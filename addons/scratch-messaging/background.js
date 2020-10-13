import commentEmojis from "../scratch-notifier/comment-emojis.js";

export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  let lastDateTime;
  let data;
  let pendingAuthChange = false;
  const commentLocationPrefixes = {
    0: "p", // Projects
    1: "u", // Users
    2: "g", // Studios (galleries)
  };

  const getDefaultData = () => ({
    messages: [],
    lastMsgCount: null,
    username: addon.auth.username,
    ready: false,
  });

  addon.auth.addEventListener("change", () => (pendingAuthChange = true));
  resetData();
  routine();

  function resetData() {
    lastDateTime = null;
    data = getDefaultData();
  }

  async function routine() {
    await runCheckMessagesAfter({ checkOld: true }, 0);
    // Can't use while(true) because addon might get disabled
    while (addon.self) {
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

  function runCheckMessagesAfter(args, ms) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        await checkMessages(args);
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
      const seenMessageIds = [];
      for (let checkedPages = 0; seenMessageIds.length < messagesToCheck; checkedPages++) {
        const messagesPage = await addon.account.getMessages({ offset: checkedPages * 40 });
        if (messagesPage === null || messagesPage.length === 0) break;
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
      checkedMessages = await addon.account.getMessages({ offset: 0 });
    }
    if (checkedMessages === null) return;
    if (!checkOld && lastDateTime === null) lastDateTime = new Date(checkedMessages[0].datetime_created).getTime();
    else {
      for (const message of checkedMessages) {
        if (!checkOld && new Date(message.datetime_created).getTime() <= lastDateTime) break;
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
    lastDateTime = new Date(checkedMessages[0].datetime_created).getTime();
    data.ready = true;
  }

  chrome.runtime.onMessage.addListener(function thisFunction(request, sender, sendResponse) {
    // If this addon has been killed, addon.self will throw
    try {
      addon.self;
    } catch (err) {
      chrome.runtime.onMessage.removeListener(thisFunction);
      return;
    }
    if (!request.scratchMessaging) return;
    const popupRequest = request.scratchMessaging;
    if (popupRequest === "getData")
      sendResponse(data.ready ? data : { error: addon.auth.isLoggedIn ? "notReady" : "loggedOut" });
    else if (popupRequest.postComment) {
      sendComment(popupRequest.postComment).then((status) => sendResponse(status));
      return true;
    } else if (popupRequest.retrieveComments) {
      const { resourceType, resourceId, commentIds } = popupRequest.retrieveComments;
      retrieveComments(resourceType, resourceId, commentIds)
        .then((comments) => sendResponse(comments))
        .catch((err) => sendResponse(err));
      return true;
    } else if (popupRequest === "markAsRead") {
      addon.account.clearMessages();
    } else if (popupRequest.deleteComment) {
      const { resourceType, resourceId, commentId } = popupRequest.deleteComment;
      deleteComment({ resourceType, resourceId, commentId })
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse(err));
      return true;
    }
  });

  async function retrieveComments(resourceType, resourceId, commentIds, page = 1, commentsObj = {}) {
    const res = await fetch(
      `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/?page=${page}&nocache=${Date.now()}`
    );
    const text = await res.text();
    const dom = new DOMParser().parseFromString(text, "text/html");
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
        childrenComments[`${resourceType[0]}_${childId}`] = {
          author: child.querySelector(".name").textContent.trim(),
          authorId: Number(child.querySelector(".reply").getAttribute("data-commentee-id")),
          content: fixCommentContent(child.querySelector(".content").innerHTML),
          date: child.querySelector(".time").getAttribute("title"),
          children: null,
          childOf: `${resourceType[0]}_${parentId}`,
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
        commentsObj[`${resourceType[0]}_${parentId}`] = {
          author: parentComment.querySelector(".name").textContent.trim(),
          authorId: Number(parentComment.querySelector(".reply").getAttribute("data-commentee-id")),
          content: fixCommentContent(parentComment.querySelector(".content").innerHTML),
          date: parentComment.querySelector(".time").getAttribute("title"),
          children: Object.keys(childrenComments),
          childOf: null,
        };
        for (const childCommentId in childrenComments) {
          commentsObj[childCommentId] = childrenComments[childCommentId];
        }
      }
    }
    // We haven't found some comments
    if (page < 3) return await retrieveComments(resourceType, resourceId, commentIds, ++page, commentsObj);
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

  function fixCommentContent(value) {
    const matches = value.match(/<img([\w\W]+?)[\/]?>/g);
    if (matches) {
      for (const match of matches) {
        // Replace Scratch emojis with Unicode emojis
        const src = match.match(/\<img.+src\=(?:\"|\')(.+?)(?:\"|\')(?:.+?)\>/)[1];
        const splitString = src.split("/");
        const imageName = splitString[splitString.length - 1];
        if (commentEmojis[imageName]) {
          value = value.replace(match, commentEmojis[imageName]);
        }
      }
    }
    value = value.replace(/\n/g, " ").trim(); // Remove newlines
    value = value.replace(/<a href="\//g, '<a href="https://scratch.mit.edu/');
    return value;
  }

  function sendComment({ resourceType, resourceId, content, parent_id, commentee_id }) {
    return new Promise((resolve) => {
      // For some weird reason, this only works with XHR in Chrome...
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/add/`, true);
      xhr.setRequestHeader("X-ScratchAddons-Uses-Fetch", "true");

      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            const dom = new DOMParser().parseFromString(xhr.responseText, "text/html");
            const commentId = Number(dom.querySelector(".comment ").getAttribute("data-comment-id"));
            const content = fixCommentContent(dom.querySelector(".content").innerHTML);
            resolve({ commentId, username: addon.auth.username, userId: addon.auth.userId, content });
          } catch (err) {
            resolve({ error: err });
          }
        } else resolve({ error: xhr.status });
      };

      xhr.send(JSON.stringify({ content, parent_id, commentee_id }));
    });
  }

  function deleteComment({ resourceType, resourceId, commentId }) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/del/`, true);
      xhr.setRequestHeader("X-ScratchAddons-Uses-Fetch", "true");

      xhr.onload = function () {
        if (xhr.status === 200) {
          resolve(200);
        } else resolve({ error: xhr.status });
      };

      xhr.send(JSON.stringify({ id: String(commentId) }));
    });
  }
}
