const parser = new DOMParser();

export class HTTPError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }

  static fromResponse(resp, message) {
    return new HTTPError(`${message}: status ${resp.status}`, resp.status);
  }
}
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
  return fetch(`https://api.scratch.mit.edu/proxy/comments/${resourceTypeUrl}/${resourceId}/comment/${commentId}?sareferer`, {
    headers: {
      "content-type": "application/json",
      "x-csrftoken": addon.auth.csrfToken,
      "x-token": xToken,
    },
    method: "DELETE",
  }).then((resp) => {
    if (!resp.ok) throw HTTPError.fromResponse(`Deleting ${resourceTypeUrl} comment ${commentId} of ${resourceId} failed`, resp);
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
    if (!resp.ok) throw HTTPError.fromResponse(`Deleting ${resourceType} comment ${commentId} of ${resourceId} failed`, resp);
  });
}

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
  if (resourceType === "user") return sendLegacyComment(addon, { resourceType, resourceId, content, parentId, commenteeId });
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
  }).then((resp) => {
    if (!resp.ok) throw HTTPError.fromResponse(`Sending ${resourceTypeUrl} comment on ${resourceId} failed`, resp);
    return resp.json();
  }).then((json) => {
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
  }).then((resp) => {
    if (!resp.ok) throw HTTPError.fromResponse(`Sending ${resourceType} comment on ${resourceId} failed`, resp);
    return resp.text();
  }).then((text) => {
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
