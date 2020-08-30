import commentEmojis from "../scratch-notifier/comment-emojis.js"

export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  let lastDateTime;
  let data;
  let checkInterval;
  const commentLocationPrefixes = {
    0: "p", // Projects
    1: "u", // Users
    2: "g", // Studios (galleries)
  };

  const getDefaultData = () => ({
    messages: [],
    comments: {},
    lastMsgCount: null,
    username: addon.auth.username,
    ready: false
  });

  addon.auth.addEventListener("change", routine);
  routine();

  async function routine() {
    lastDateTime = null;
    data = getDefaultData();
    // TODO: remove, this is for easy debugging
    if (!window._messaging) window._messaging = {};
    window._messaging.data = data;
    if (checkInterval) clearInterval(checkInterval);
    if (!addon.auth.isLoggedIn) return;
    await checkMessages({ checkOld: true });
    checkInterval = setInterval(checkMessages, 5000);
  }

  async function checkMessages({ checkOld = false } = {}) {
    // Check if message count changed, if not, return
    const msgCount = await addon.account.getMsgCount();
    window._messaging._msgCount = msgCount;
    if (data.lastMsgCount === msgCount) return;
    data.lastMsgCount = msgCount;

    let checkedMessages = [];
    let newlyFoundComments = [];
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
      }
    } else {
      checkedMessages = await addon.account.getMessages({ offset: 0 });
    }
    console.log(checkedMessages);
    if (checkedMessages === null || checkedMessages.length === 0) return;
    if (!checkOld && lastDateTime === null) lastDateTime = new Date(checkedMessages[0].datetime_created).getTime();
    else {
      for (const message of checkedMessages) {
        if (!checkOld && new Date(message.datetime_created).getTime() <= lastDateTime) break;
        if (lastDateTime === null) data.messages.push(message);
        else data.messages.unshift(message);
        console.log("Found new message: ", message);
        if (message.type === "addcomment") newlyFoundComments.push(message);
      }
      if (data.messages.length > 40 && msgCount < 41) {
        data.messages.length = 40;
        removeUnnecessaryComments();
      }
    }
    lastDateTime = new Date(checkedMessages[0].datetime_created).getTime();

    if (newlyFoundComments.length) {
      const commentLocations = {
        0: {},
        1: {},
        2: {},
      };
      // Group newly found comments by their location
      for (const commentMessage of newlyFoundComments) {
        // If it's a parent comment that wasn't truncated, we don't need to request it via ajax
        if (1 === 2 && /* TODO: */ !commentMessage.commentee_username && commentMessage.comment_fragment.length < 250) {
          data.comments[`${commentLocationPrefixes[commentMessage.comment_type]}_${commentMessage.comment_id}`] = {
            author: commentMessage.actor_username,
            authorId: commentMessage.actor_id,
            content: fixCommentContent(commentMessage.comment_fragment),
            date: commentMessage.datetime_created,
            children: [],
            childOf: null,
          };
          continue;
        }
        // Else, we should check the comments API
        const projectId =
          commentMessage.comment_type === 1 ? commentMessage.comment_obj_title : commentMessage.comment_obj_id;
        if (!commentLocations[commentMessage.comment_type][projectId])
          commentLocations[commentMessage.comment_type][projectId] = [];
        commentLocations[commentMessage.comment_type][projectId].push(commentMessage.comment_id);
      }
      // Retrieve full comments, and their chains
      for (const resourceId in commentLocations[0]) {
        await retrieveComments("project", Number(resourceId), commentLocations[0][resourceId]);
      }
      for (const resourceId in commentLocations[1]) {
        await retrieveComments("user", resourceId, commentLocations[1][resourceId]);
      }
      for (const resourceId in commentLocations[2]) {
        await retrieveComments("gallery", Number(resourceId), commentLocations[2][resourceId]);
      }
    }
    data.ready = true;
  }

  // NOTE: addons aren't supposed to use chrome APIs
  // Until addons have a way to communicate with popups, this is the only way
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // If this addon has been killed, addon.self will throw
    if (!request.scratchMessaging || !addon.self) return;
    console.log(request);
    const popupRequest = request.scratchMessaging;
    if(popupRequest === "getData") sendResponse(data.ready ? data : { error : addon.auth.isLoggedIn ? "notReady" : "loggedOut"});
    if(popupRequest.postComment) sendComment(popupRequest.postComment);
  });

  async function retrieveComments(resourceType, resourceId, commentIds, page = 1) {
    const res = await fetch(
      `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/?page=${page}&nocache=${Date.now()}`
    );
    const text = await res.text();
    const dom = new DOMParser().parseFromString(text, "text/html");
    for (const commentChain of dom.querySelectorAll(".top-level-reply:not(.removed)")) {
      if (commentIds.length === 0) {
        // We found all comments we had to look for
        return;
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
        data.comments[`${resourceType[0]}_${parentId}`] = {
          author: parentComment.querySelector(".name").textContent.trim(),
          authorId: Number(parentComment.querySelector(".reply").getAttribute("data-commentee-id")),
          content: fixCommentContent(parentComment.querySelector(".content").innerHTML),
          date: parentComment.querySelector(".time").getAttribute("title"),
          children: Object.keys(childrenComments),
          childOf: null,
        };
        for (const childCommentId in childrenComments) {
          data.comments[childCommentId] = childrenComments[childCommentId];
        }
      }
    }
    // We haven't found some comments
    if (page < 2) await retrieveComments(resourceType, resourceId, commentIds, ++page);
    else
      console.log(
        "Could not find all comments for ",
        resourceType,
        " ",
        resourceId,
        ", remaining ids: ",
        JSON.parse(JSON.stringify(commentIds))
      );
  }

  function removeUnnecessaryComments() {
    // We only want to keep comments that are related to the
    // most recent 40 messages. Others should be deleted.

    // Let's check what individual comments we want to preserve:
    const commentsToPreserve = data.messages.filter((msg) => msg.type === "addcomment");
    // We don't want to keep these comments only, but their whole chain.
    // Let's get the parent IDs of the chains we want to preserve,
    // and then also keep its children:
    const parentsToPreserve = new Set();
    commentsToPreserve.forEach((commentMsg) => {
      const commentId = `${commentLocationPrefixes[commentMsg.comment_type]}_${commentMsg.comment_id}`;
      const commentObj = data.comments[commentId];
      if (commentObj) {
        if (commentObj.children !== null) parentsToPreserve.add(commentId);
        else parentsToPreserve.add(commentObj.childOf);
      }
    });
    // Let's get all the parent comments we're currently storing:
    const parentCommentIds = Object.entries(data.comments).filter(([id, obj]) => obj.children !== null);
    // If we didn't whitelist a parent comment, delete it and
    // all of its children.
    for (const [commentId, commentObj] of parentCommentIds) {
      if (!parentsToPreserve.has(commentId)) {
        for (const childId of commentObj.children) {
          delete data.comments[childId];
        }
        delete data.comments[commentId];
        console.log("Deleted comment ", commentId, " and its children.");
      }
    }
  }

  function fixCommentContent(value) {
    const matches = value.match(/<img([\w\W]+?)[\/]?>/g);
    if (matches) {
      for (const match of matches) {
        const src = match.match(/\<img.+src\=(?:\"|\')(.+?)(?:\"|\')(?:.+?)\>/)[1];
        const splitString = src.split("/");
        const imageName = splitString[splitString.length - 1];
        if (commentEmojis[imageName]) {
          value = value.replace(match, commentEmojis[imageName]);
        }
      }
    }
    value = value.replace(/\n/g, " ").trim(); // Remove newlines
    return value;
  }

  window.sendComment = function sendComment({ resourceType, resourceId, content, parent_id, commentee_id}) {
    // For some weird reason, this only works with XHR in Chrome...
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/add/`, true);
    xhr.setRequestHeader("x-csrftoken", addon.auth.csrfToken);
    xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
    xhr.setRequestHeader("X-ScratchAddons-Uses-Fetch", "true");

    xhr.onload = function () {
      console.log(xhr);
    };

xhr.send(JSON.stringify({ content, parent_id, commentee_id }));
    /*fetch(`https://scratch.mit.edu/site-api/comments/${resourceType}/${resourceId}/add/`, {
      body: JSON.stringify({content, parent_id, commentee_id}),
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      }
    });*/
  }
}
