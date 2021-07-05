import commentEmojis from "../scratch-notifier/comment-emojis.js";
import { linkifyTextNode, pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";

/**
 * @typedef {{
 *   id: number;
 *   parent_id: number;
 *   commentee_id: number;
 *   content: string;
 *   datetime_created: string;
 *   datetime_modified: string;
 *   visibility: string;
 *   author: {
 *     id: number;
 *     username: string;
 *     scratchteam: boolean;
 *     image: string;
 *   };
 *   reply_count: number;
 * }[]} comments
 */

/**
 * @typedef {{
 *   [key: string]: {
 *     author: string;
 *     authorId: number;
 *     content: string;
 *     date: string;
 *     children: string[] | null;
 *     childOf: string | null;
 *     scratchTeam: boolean;
 *   };
 * }} commentReplies
 */

export default async (
  /** @type {AddonAPIs.PersistentScript} */ { addon, console, setTimeout, setInterval, clearTimeout, clearInterval }
) => {
  const getDefaultData = () => ({
    messages: [],
    lastMsgCount: undefined,
    username: addon.auth.username,
    ready: false,
  });

  /** @type {number | null} */
  let lastDateTime;
  /**
   * @type {{
   *   messages: any;
   *   lastMsgCount?: number;
   *   username?: string;
   *   ready: boolean;
   *   stMessages?: {
   *     id: number;
   *     datetime_created: string;
   *     message: string;
   *   };
   * }}
   */
  let data = getDefaultData();
  let pendingAuthChange = false;
  let addonEnabled = true;
  // reuse one DOMParser
  const parser = new DOMParser();

  addon.auth.addEventListener("change", () => (pendingAuthChange = true));
  resetData();
  routine();

  function resetData() {
    lastDateTime = null;
    data = getDefaultData();
  }

  async function routine() {
    await runCheckMessagesAfter({ checkOld: true }, 0);
    while (addonEnabled) {
      if (pendingAuthChange) {
        pendingAuthChange = false;
        resetData();
        routine();
        break;
      } else {
        await runCheckMessagesAfter({}, 5000);
      }
    }
  }

  /**
   * @param {{ checkOld?: boolean }} opts
   * @param {number} [ms]
   *
   * @returns {Promise<void>}
   */
  function runCheckMessagesAfter(opts, ms) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        await checkMessages(opts).catch((e) => console.warn("Error checking messages", e));
        resolve();
      }, ms);
    });
  }

  async function checkMessages({ checkOld = false } = {}) {
    if (!addon.auth.isLoggedIn) return;

    // Check if message count changed, if not, return
    const msgCount = await addon.account.getMsgCount();
    if (data.lastMsgCount === msgCount) return;
    data.lastMsgCount = msgCount;

    let checkedMessages = [];
    data.ready = false;

    if (checkOld) {
      const messagesToCheck = msgCount > 1000 ? 1000 : msgCount < 41 ? 40 : msgCount;
      /** @type {number[]} */
      const seenMessageIds = [];
      for (let checkedPages = 0; seenMessageIds.length < messagesToCheck; checkedPages++) {
        const messagesPage = await addon.account.getMessages({ offset: checkedPages * 40 });
        if (!messagesPage?.length) break;
        for (const message of messagesPage) {
          // Make sure we don't add the same message twice,
          // it could happen since we request through pages
          if (!seenMessageIds.includes(message.id)) {
            seenMessageIds.push(message.id);
            checkedMessages.push(message);
            if (seenMessageIds.length === msgCount && msgCount > 39) break;
          }
        }
        if (messagesPage.length !== 40) break;
      }
    } else {
      checkedMessages = (await addon.account.getMessages({ offset: 0 })) || [];
    }
    if (checkedMessages === null) return;
    if (!(!checkOld && !lastDateTime)) {
      for (const message of checkedMessages) {
        if (!checkOld && new Date(message.datetime_created).getTime() <= (lastDateTime || 0)) break;
        if (checkOld) data.messages.push(message);
        else data.messages.unshift(message);
      }
      if (data.messages.length > 40 && msgCount < 41) {
        // Remove extra messages
        data.messages.length = 40;
      }
      if (data.messages.length > 1000) {
        data.messages.length = 1000;
      }
    }
    lastDateTime = new Date(`${checkedMessages[0]?.datetime_created}`).getTime();
    const headers = new Headers();
    headers.set("x-token", addon.auth.xToken || "");
    data.stMessages = await (
      await fetch(`https://api.scratch.mit.edu/users/${addon.auth.username}/messages/admin`, {
        headers,
      })
    ).json();

    data.ready = true;
  }

  /**
   * @param {any} request
   * @param {chrome.runtime.MessageSender} sender
   * @param {(response?: any) => void} sendResponse
   */
  const messageListener = (request, sender, sendResponse) => {
    if (!request.scratchMessaging) return;
    const popupRequest = request.scratchMessaging;
    if (popupRequest === "getData") {
      sendResponse(data.ready ? data : { error: addon.auth.isLoggedIn ? "notReady" : "loggedOut" });
      return true;
    } else if (popupRequest.postComment) {
      sendComment(popupRequest.postComment).then((status) => sendResponse(status));
      return true;
    } else if (popupRequest.retrieveComments) {
      const { resourceType, resourceId, commentIds } = popupRequest.retrieveComments;
      retrieveComments(resourceType, resourceId, commentIds)
        .then((comments) => sendResponse(comments))
        .catch((err) => {
          // TODO: are these errors recognized by popup?
          // (Check for other catches below as well)
          console.warn("Comment could not be fetched:", err);
          sendResponse({ failed: true });
        });
      return true;
    } else if (popupRequest === "markAsRead") {
      addon.account.clearMessages();
      return true;
    } else if (popupRequest.deleteComment) {
      const { resourceType, resourceId, commentId } = popupRequest.deleteComment;
      deleteComment({ resourceType, resourceId, commentId })
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse(err));
      return true;
    } else if (popupRequest.dismissAlert) {
      dismissAlert(popupRequest.dismissAlert)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse(err));
      return true;
    }
    return false;
  };
  chrome.runtime.onMessage.addListener(messageListener);
  addon.self.addEventListener("disabled", () => {
    chrome.runtime.onMessage.removeListener(messageListener);
    addonEnabled = false;
  });

  /**
   * @param {string} resourceType
   * @param {number} resourceId
   * @param {number[]} commentIds
   * @param {commentReplies} commentsObj
   *
   * @returns {Promise<commentReplies>}
   */
  async function retrieveComments(resourceType, resourceId, commentIds, page = 1, commentsObj = {}) {
    if (resourceType === "project" || resourceType === "gallery") {
      /** @type {string} */
      let projectAuthor;
      if (resourceType === "project") {
        const projectRes = await fetch(`https://api.scratch.mit.edu/projects/${resourceId}`);
        if (!projectRes.ok) return commentsObj; // empty
        const projectJson = await projectRes.json();
        projectAuthor = projectJson.author.username;
      }
      /** @param {number} commId */
      const getCommentUrl = (commId) =>
        resourceType === "project"
          ? `https://api.scratch.mit.edu/users/${projectAuthor}/projects/${resourceId}/comments/${commId}`
          : `https://api.scratch.mit.edu/studios/${resourceId}/comments/${commId}`;
      /**
       * @param {number} commId
       * @param {number} offset
       */
      const getRepliesUrl = (commId, offset) =>
        resourceType === "project"
          ? `https://api.scratch.mit.edu/users/${projectAuthor}/projects/${resourceId}/comments/${commId}/replies?offset=${offset}&limit=40&nocache=${Date.now()}`
          : `${getCommentUrl(commId)}/replies?offset=${offset}&limit=40&nocache=${Date.now()}`;

      for (const commentId of commentIds) {
        if (commentsObj[`${resourceType[0]}_${commentId}`]) continue;

        const res = await fetch(getCommentUrl(commentId));

        if (!res.ok) continue;
        const json = await res.json();
        // This is sometimes null for deleted comments
        if (json === null) continue;
        const parentId = json.parent_id || commentId;
        /** @type {commentReplies} */
        const childrenComments = {};

        let parentComment;

        if (json.parent_id) {
          const resParent = await fetch(getCommentUrl(parentId));
          if (!resParent.ok) continue;
          const jsonParent = await resParent.json();
          // This is sometimes null for deleted comments
          if (jsonParent === null) continue;
          parentComment = jsonParent;
        } else {
          parentComment = json;
        }

        /**
         * If originally requested comment was not a parent comment, we do not use the `json` variable at all. We'll get
         * info for the same comment when fetching all of the parent's child comments anyway.
         *
         * Note: we need to check replies for all parent comments, reply_count doesn't work properly.
         *
         * @param {number} offset
         *
         * @returns {Promise<comments>}
         */
        const getReplies = async (offset) => {
          const repliesRes = await fetch(getRepliesUrl(parentId, offset));
          if (!repliesRes.ok) return [];
          return repliesRes.json();
        };

        /** @type {comments} */
        const replies = [];
        let lastRepliesLength = 40;
        let offset = 0;
        while (lastRepliesLength === 40) {
          const newReplies = await getReplies(offset);
          newReplies.forEach((c) => replies.push(c));
          lastRepliesLength = newReplies.length;
          offset += 40;
        }

        if (json.parent_id && replies.length === 0) {
          // Something went wrong, we didn't get the replies
          continue;
        }

        for (const reply of replies) {
          const commenteeReply = replies.find((c) => c.author.id === reply.commentee_id);
          const replyingTo = commenteeReply ? commenteeReply.author.username : parentComment.author.username;
          const mention = `<a href=\"https://scratch.mit.edu/users/${replyingTo}\">@${replyingTo}</a>`;
          childrenComments[`${resourceType[0]}_${reply.id}`] = {
            author: reply.author.username,
            authorId: reply.author.id,
            content: `${mention} ${fixCommentContent(reply.content)}`,
            date: reply.datetime_created,
            children: null,
            childOf: `${resourceType[0]}_${parentId}`,
            scratchTeam: reply.author.scratchteam,
          };
        }
        for (const childCommentId in childrenComments) {
          if ({}.hasOwnProperty.call(childrenComments, childCommentId)) {
            commentsObj[childCommentId] = childrenComments[childCommentId];
          }
        }

        console.log(childrenComments);

        commentsObj[`${resourceType[0]}_${parentId}`] = {
          author: parentComment.author.username,
          authorId: parentComment.author.id,
          content: fixCommentContent(parentComment.content),
          date: parentComment.datetime_created,
          children: Object.keys(childrenComments),
          childOf: null,
          scratchTeam: parentComment.author.scratchteam,
        };
      }
      return commentsObj;
    }

    const res = await fetch(
      `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/?page=${page}&nocache=${Date.now()}`
    );
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

      /** @type {commentReplies} */
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
          content: fixCommentContent(child.querySelector(".content")),
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
          content: fixCommentContent(parentComment.querySelector(".content")),
          date: parentComment.querySelector(".time").getAttribute("title"),
          children: Object.keys(childrenComments),
          childOf: null,
          scratchTeam: parentAuthor.includes("*"),
        };
        for (const childCommentId in childrenComments) {
          if ({}.hasOwnProperty.call(childrenComments, childCommentId)) {
            commentsObj[childCommentId] = childrenComments[childCommentId];
          }
        }
      }
    }
    // We haven't found some comments
    if (page < 3) return retrieveComments(resourceType, resourceId, commentIds, ++page, commentsObj);
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

  /** @param {string | Node} value */
  function fixCommentContent(value) {
    const shouldLinkify = scratchAddons.localState?.addonsEnabled["more-links"] === true;
    let node;
    if (value instanceof Node) {
      // profile
      node = value.cloneNode(true);
    } else {
      // JSON API
      const fragment = parser.parseFromString(value.trim(), "text/html");
      node = fragment.body;
    }
    for (let i = node.childNodes.length; i--; ) {
      const item = node.childNodes[i];
      item.textContent = item?.textContent?.replace(/\n/g, "");
      if (item instanceof Text && item.textContent === "") {
        item.remove();
      } else if (item instanceof HTMLAnchorElement && item.getAttribute("href")?.startsWith("/")) {
        item.href = "https://scratch.mit.edu" + item.getAttribute("href");
      } else if (item instanceof HTMLImageElement) {
        const splitString = item.src.split("/");
        const imageName = splitString[splitString.length - 1] || "";
        if (commentEmojis[imageName]) item.replaceWith(commentEmojis[imageName]);
      }
    }
    if (shouldLinkify) {
      linkifyTextNode(node);
    }
    pingifyTextNode(node);
    return node.innerHTML;
  }

  /**
   * @param {{
   *   resourceType: string;
   *   resourceId: number;
   *   content: string;
   *   parent_id: number;
   *   commentee_id: number;
   *   commenteeUsername: string;
   * }} arg0
   */
  async function sendComment({ resourceType, resourceId, content, parent_id, commentee_id, commenteeUsername }) {
    if (resourceType === "project" || resourceType === "gallery") {
      const resourceTypeUrl = resourceType === "project" ? "project" : "studio";
      const headers = new Headers();
      headers.append("content-type", "application/json");
      headers.append("x-csrftoken", addon.auth.csrfToken || "");
      headers.append("x-token", addon.auth.xToken || "");
      const res = await fetch(`https://api.scratch.mit.edu/proxy/comments/${resourceTypeUrl}/${resourceId}?sareferer`, {
        headers,
        body: JSON.stringify({ content, parent_id, commentee_id }),
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.rejected)
          return {
            error: json.rejected,
            muteStatus: json.status?.mute_status || null,
          };
        const mention = `<a href=\"https://scratch.mit.edu/users/${commenteeUsername}\">@${commenteeUsername}</a>`;
        return {
          commentId: json.id,
          username: addon.auth.username,
          userId: addon.auth.userId,
          content: `${mention} ${fixCommentContent(json.content)}`,
        };
      } else {
        return { error: res.status };
      }
    }
    return new Promise((resolve) => {
      // For some weird reason, this only works with XHR in Chrome...
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/add/?sareferer`, true);
      xhr.setRequestHeader("x-csrftoken", addon.auth.csrfToken || "");
      xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const dom = parser.parseFromString(xhr.responseText, "text/html");
            const comment = dom.querySelector(".comment ");
            const error = dom.querySelector("script#error-data");
            if (comment) {
              const commentId = Number(comment.getAttribute("data-comment-id"));
              const content = fixCommentContent(dom.querySelector(".content"));
              resolve({ commentId, username: addon.auth.username, userId: addon.auth.userId, content });
            } else if (error) {
              const json = JSON.parse(error.textContent || "");
              resolve({
                error: json.error,
                muteStatus: json.status?.mute_status || null,
              });
            } else resolve({ error: 200 }); // Shouldn't ever happen, just in case
          } catch (err) {
            resolve({ error: err });
          }
        } else resolve({ error: xhr.status });
      };

      xhr.send(JSON.stringify({ content, parent_id, commentee_id }));
    });
  }

  /** @param {{ resourceType: string; resourceId: number; commentId: number }} arg0 */
  async function deleteComment({ resourceType, resourceId, commentId }) {
    if (resourceType === "project" || resourceType === "gallery") {
      const resourceTypeUrl = resourceType === "project" ? "project" : "studio";
      const headers = new Headers();
      headers.append("content-type", "application/json");
      headers.append("x-csrftoken", addon.auth.csrfToken || "");
      headers.append("x-token", addon.auth.xToken || "");
      const res = await fetch(
        `https://api.scratch.mit.edu/proxy/comments/${resourceTypeUrl}/${resourceId}/comment/${commentId}?sareferer`,
        {
          headers,
          method: "DELETE",
        }
      );
      if (res.ok) return 200;
      else return { error: res.status };
    }
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/del/?sareferer`, true);
      xhr.setRequestHeader("x-csrftoken", addon.auth.csrfToken || "");
      xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");

      xhr.onload = function () {
        if (xhr.status === 200) {
          resolve(200);
        } else resolve({ error: xhr.status });
      };

      xhr.send(JSON.stringify({ id: String(commentId) }));
    });
  }

  /** @param {number} alertId */
  async function dismissAlert(alertId) {
    const headers = new Headers();
    headers.set("content-type", "application/json");
    headers.set("x-csrftoken", addon.auth.csrfToken || "");
    headers.set("x-requested-with", "XMLHttpRequest");
    const res = await fetch("https://scratch.mit.edu/site-api/messages/messages-delete/?sareferer", {
      headers: {},
      body: JSON.stringify({ alertType: "notification", alertId }),
      method: "POST",
    });
    if (!res.ok) return { error: res.status };
    return { success: true };
  }
};
