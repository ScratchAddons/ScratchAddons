import { HTTPError } from "../../libraries/common/message-cache.js";

const parser = new DOMParser();

export { HTTPError };

export class DetailedError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

export async function deleteComment(addon, { resourceType, resourceId, commentId }) {
  if (resourceType === "user") return deleteLegacyComment(addon, { resourceType, resourceId, commentId });
  const resourceTypeUrl = resourceType === "project" ? "project" : "studio";
  const xToken = await addon.auth.fetchXToken();
  return fetch(
    `https://api.scratch.mit.edu/proxy/comments/${resourceTypeUrl}/${resourceId}/comment/${commentId}?sareferer`,
    {
      headers: {
        "content-type": "application/json",
        "x-csrftoken": addon.auth.csrfToken,
        "x-token": xToken,
      },
      method: "DELETE",
    }
  ).then((resp) => {
    if (!resp.ok)
      throw HTTPError.fromResponse(`Deleting ${resourceTypeUrl} comment ${commentId} of ${resourceId} failed`, resp);
  });
}

const deleteLegacyComment = async (addon, { resourceType, resourceId, commentId }) => {
  return fetch(`https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/del/?sareferer`, {
    headers: {
      "content-type": "application/json",
      "x-csrftoken": addon.auth.csrfToken,
      "x-requested-with": "XMLHttpRequest",
    },
    body: JSON.stringify({ id: String(commentId) }),
    method: "POST",
  }).then((resp) => {
    if (!resp.ok)
      throw HTTPError.fromResponse(`Deleting ${resourceType} comment ${commentId} of ${resourceId} failed`, resp);
  });
};

export async function dismissAlert(addon, alertId) {
  return fetch("https://scratch.mit.edu/site-api/messages/messages-delete/?sareferer", {
    headers: {
      "content-type": "application/json",
      "x-csrftoken": addon.auth.csrfToken,
      "x-requested-with": "XMLHttpRequest",
    },
    body: JSON.stringify({ alertType: "notification", alertId }),
    method: "POST",
  }).then((resp) => {
    if (!resp.ok) throw HTTPError.fromResponse(`Dismissing alert ${alertId} failed`, resp);
  });
}

export async function sendComment(addon, { resourceType, resourceId, content, parentId, commenteeId }) {
  if (resourceType === "user")
    return sendLegacyComment(addon, { resourceType, resourceId, content, parentId, commenteeId });
  return sendMigratedComment(addon, { resourceType, resourceId, content, parentId, commenteeId });
}

export async function sendMigratedComment(addon, { resourceType, resourceId, content, parentId, commenteeId }) {
  const resourceTypeUrl = resourceType === "project" ? "project" : "studio";
  const xToken = await addon.auth.fetchXToken();
  return fetch(`https://api.scratch.mit.edu/proxy/comments/${resourceTypeUrl}/${resourceId}?sareferer`, {
    headers: {
      "content-type": "application/json",
      "x-csrftoken": addon.auth.csrfToken,
      "x-token": xToken,
    },
    body: JSON.stringify({ content, parent_id: parentId, commentee_id: commenteeId }),
    method: "POST",
  })
    .then((resp) => {
      if (!resp.ok) throw HTTPError.fromResponse(`Sending ${resourceTypeUrl} comment on ${resourceId} failed`, resp);
      return resp.json();
    })
    .then((json) => {
      if (json.rejected) {
        throw new DetailedError(`Server rejected sending ${resourceTypeUrl} comment`, {
          error: json.rejected,
          muteStatus: json.status?.mute_status || null,
        });
      }
      return {
        id: json.id,
        content: json.content,
      };
    });
}

export async function sendLegacyComment(addon, { resourceType, resourceId, content, parentId, commenteeId }) {
  return fetch(`https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/add/?sareferer`, {
    headers: {
      "content-type": "application/json",
      "x-csrftoken": addon.auth.csrfToken,
      "x-requested-with": "XMLHttpRequest",
    },
    method: "POST",
    body: JSON.stringify({ content, parent_id: parentId, commentee_id: commenteeId }),
  })
    .then((resp) => {
      if (!resp.ok) throw HTTPError.fromResponse(`Sending ${resourceType} comment on ${resourceId} failed`, resp);
      return resp.text();
    })
    .then((text) => {
      const dom = parser.parseFromString(text, "text/html");
      const comment = dom.querySelector(".comment");
      const error = dom.querySelector("script#error-data");
      if (comment) {
        const commentId = Number(comment.getAttribute("data-comment-id"));
        const content = dom.querySelector(".content");
        return { id: commentId, content };
      } else if (error) {
        const json = JSON.parse(error.textContent);
        throw new DetailedError(`Server rejected sending ${resourceType} comment`, {
          error: json.error,
          muteStatus: json.status?.mute_status || null,
        });
      } else {
        console.warn("Unexpected state while sending legacy comment: ", text);
        throw new Error("Unexpected state while sending legacy comment, see logs");
      }
    });
}

export async function fetchComments(addon, { resourceType, resourceId, commentIds, page = 1, commentsObj = {} }) {
  if (resourceType === "user")
    return fetchLegacyComments(addon, { resourceType, resourceId, commentIds, page, commentsObj });
  return fetchMigratedComments(addon, { resourceType, resourceId, commentIds, page, commentsObj });
}

export async function fetchMigratedComments(
  addon,
  { resourceType, resourceId, commentIds, page = 1, commentsObj = {} }
) {
  let projectAuthor;
  if (resourceType === "project") {
    const projectRes = await fetch(`https://api.scratch.mit.edu/projects/${resourceId}`);
    if (!projectRes.ok) return commentsObj; // empty
    const projectJson = await projectRes.json();
    projectAuthor = projectJson.author.username;
  }
  const getCommentUrl = (commId) =>
    resourceType === "project"
      ? `https://api.scratch.mit.edu/users/${projectAuthor}/projects/${resourceId}/comments/${commId}`
      : `https://api.scratch.mit.edu/studios/${resourceId}/comments/${commId}`;
  const getRepliesUrl = (commId, offset) =>
    resourceType === "project"
      ? `https://api.scratch.mit.edu/users/${projectAuthor}/projects/${resourceId}/comments/${commId}/replies?offset=${offset}&limit=40`
      : `https://api.scratch.mit.edu/studios/${resourceId}/comments/${commId}/replies?offset=${offset}&limit=40`;
  for (const commentId of commentIds) {
    if (commentsObj[`${resourceType[0]}_${commentId}`]) continue;

    const res = await fetch(getCommentUrl(commentId));

    if (!res.ok) {
      if (res.status === 404 || res.status === 403) continue;
      throw HTTPError.fromResponse(`Error when fetching comment ${resourceType}/${commentId}`, res);
    }
    const json = await res.json();
    // This is sometimes null for deleted comments
    if (json === null) continue;
    const parentId = json.parent_id || commentId;
    const childrenComments = {};

    let parentComment;

    if (json.parent_id) {
      const resParent = await fetch(getCommentUrl(parentId));
      if (!resParent.ok) {
        throw HTTPError.fromResponse(
          `Error when fetching parent ${parentId} for comment ${resourceType}/${commentId}`,
          resParent
        );
      }
      const jsonParent = await resParent.json();
      // This is sometimes null for deleted comments
      if (jsonParent === null) continue;
      parentComment = jsonParent;
    } else {
      parentComment = json;
    }

    // If originally requested comment was not a parent comment, we do not use
    // "json" variable at all. We'll get info for the same comment when fetching
    // all of the parent's child comments anyway
    // Note: we need to check replies for all parent comments, reply_count doesn't work properly

    const getReplies = async (offset) => {
      const repliesRes = await fetch(getRepliesUrl(parentId, offset));
      if (!repliesRes.ok) {
        if (repliesRes.status === 404 || repliesRes.status === 403) return null;
        throw HTTPError.fromResponse(`Ignoring comment ${resourceType}/${commentId}`, repliesRes);
      }
      const repliesJson = await repliesRes.json();
      return repliesJson;
    };

    const replies = [];
    let lastRepliesLength = 40;
    let offset = 0;
    // reply_count is guaranteed to be above 0 if replies exist,
    // although the exact value is unreliable
    // This matches scratch-www behavior, and has significant performance gain
    if (parentComment.reply_count > 0) {
      while (lastRepliesLength === 40) {
        const newReplies = await getReplies(offset);
        if (!Array.isArray(newReplies)) break;
        newReplies.forEach((c) => replies.push(c));
        lastRepliesLength = newReplies.length;
        offset += 40;
      }
    }

    if (json.parent_id && replies.length === 0) {
      // Something went wrong, we didn't get the replies (likely API failure)
      // Add the comment as a reply - better than crashing, because apparently it's
      // more common than I thought!
      console.error(
        `No replies found on comment ${resourceType}/${resourceId}/${commentId} with parents ${json.parent_id}`
      );
      replies.push(json);
    }

    for (const reply of replies) {
      const commenteeReply = replies.find((c) => c.author.id === reply.commentee_id);
      const replyingTo = commenteeReply ? commenteeReply.author.username : parentComment.author.username;
      childrenComments[`${resourceType[0]}_${reply.id}`] = {
        author: reply.author.username,
        authorId: reply.author.id,
        content: reply.content,
        date: reply.datetime_created,
        children: null,
        childOf: `${resourceType[0]}_${parentId}`,
        replyingTo,
        scratchTeam: reply.author.scratchteam,
        projectAuthor,
      };
    }
    for (const childCommentId of Object.keys(childrenComments)) {
      commentsObj[childCommentId] = childrenComments[childCommentId];
    }

    commentsObj[`${resourceType[0]}_${parentId}`] = {
      author: parentComment.author.username,
      authorId: parentComment.author.id,
      content: parentComment.content,
      date: parentComment.datetime_created,
      children: Object.keys(childrenComments),
      childOf: null,
      replyingTo: "",
      scratchTeam: parentComment.author.scratchteam,
      projectAuthor,
    };
  }
  return commentsObj;
}

export async function fetchLegacyComments(addon, { resourceType, resourceId, commentIds, page = 1, commentsObj = {} }) {
  const res = await fetch(`https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/?page=${page}`, {
    credentials: "omit",
  });
  if (!res.ok) {
    console.warn(`Ignoring comments ${resourceType}/${resourceId} page ${page}, status ${res.status}`);
    return commentsObj;
  }
  const text = await res.text();
  const dom = parser.parseFromString(text, "text/html");
  for (const commentChain of dom.querySelectorAll(".top-level-reply:not(.removed)")) {
    if (commentIds.length === 0) {
      // We found all comments we had to look for
      return commentsObj;
    }
    let foundComment = false;
    const parentComment = commentChain.querySelector("div");
    const parentId = Number(parentComment.getAttribute("data-comment-id"));

    const childrenComments = {};
    const children = commentChain.querySelectorAll("li.reply:not(.removed)");
    for (const child of children) {
      const childId = Number(child.querySelector("div").getAttribute("data-comment-id"));
      if (commentIds.includes(childId)) {
        foundComment = true;
        commentIds.splice(
          commentIds.findIndex((commentId) => commentId === childId),
          1
        );
      }
      const author = child.querySelector(".name").textContent.trim();
      childrenComments[`${resourceType[0]}_${childId}`] = {
        author: author.replace(/\*/g, ""),
        authorId: Number(child.querySelector(".reply").getAttribute("data-commentee-id")),
        content: child.querySelector(".content"),
        date: child.querySelector(".time").getAttribute("title"),
        children: null,
        childOf: `${resourceType[0]}_${parentId}`,
        scratchTeam: author.includes("*"),
      };
    }

    if (commentIds.includes(parentId)) {
      foundComment = true;
      commentIds.splice(
        commentIds.findIndex((commentId) => commentId === parentId),
        1
      );
    }

    if (foundComment) {
      const parentAuthor = parentComment.querySelector(".name").textContent.trim();
      commentsObj[`${resourceType[0]}_${parentId}`] = {
        author: parentAuthor.replace(/\*/g, ""),
        authorId: Number(parentComment.querySelector(".reply").getAttribute("data-commentee-id")),
        content: parentComment.querySelector(".content"),
        date: parentComment.querySelector(".time").getAttribute("title"),
        children: Object.keys(childrenComments),
        childOf: null,
        scratchTeam: parentAuthor.includes("*"),
      };
      for (const childCommentId of Object.keys(childrenComments)) {
        commentsObj[childCommentId] = childrenComments[childCommentId];
      }
    }
  }
  // We haven't found some comments
  if (page < 3)
    return await fetchLegacyComments(addon, { resourceType, resourceId, commentIds, page: page + 1, commentsObj });
  else {
    console.log(
      "Could not find all comments for ",
      resourceType,
      " ",
      resourceId,
      ", remaining ids: ",
      JSON.parse(JSON.stringify(commentIds))
    );
    return commentsObj;
  }
}

export async function fetchAlerts(addon) {
  const username = await addon.auth.fetchUsername();
  const xToken = await addon.auth.fetchXToken();
  return fetch(`https://api.scratch.mit.edu/users/${username}/messages/admin`, {
    headers: {
      "x-token": xToken,
    },
  }).then((res) => {
    if (!res.ok) throw HTTPError.fromResponse("Fetching alerts failed", res);
    return res.json();
  });
}
