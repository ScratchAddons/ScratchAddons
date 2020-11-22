// TODO: Update messages time

export default async function ({ addon, console }) {
  let messageList = await addon.tab.waitForElement(".messages-social-list");
  document.querySelector(".messages-title-filter").remove();
  let loadMore = document.querySelector(".messages-social-loadmore");
  let loadMoreText = loadMore.innerText
  loadMore.addEventListener("click", async function (e) {
    e.preventDefault();
    e.cancelBubble = true;
    let comments = await getVaildComments([], commentsOffset);
    for (let i = 0; i < comments.length; i++) {
      createMessage(comments[i]);
    }
  })
  messageList.innerText = ""
  let comments = await getVaildComments();
  for (let i = 0; i < comments.length; i++) {
    createMessage(comments[i]);
  }
  function createMessage(info) {
    let li = messageList.appendChild(document.createElement("li"));
    li.className = "social-message mod-comment-message";
    let messageContainer = li.appendChild(document.createElement("div"));
    messageContainer.className = "flex-row mod-social-message";
    let messageContent = messageContainer.appendChild(document.createElement("div"));
    messageContent.className = "social-message-content";
    let messageIcon = messageContent.appendChild(document.createElement("img"));
    messageIcon.className = "social-message-icon";
    let messageInfoContainer = messageContent.appendChild(document.createElement("div"));
    let messageCreated = messageContainer.appendChild(document.createElement("span"));
    messageCreated.className = "social-message-date";
    let messageCreatedValue = messageCreated.appendChild(document.createElement("span"));
    messageCreatedValue.innerText = getTimeDifference(info.datetime_created);
    let commentInfo;
    if (info.type == "addcomment") commentInfo = messageInfoContainer.appendChild(document.createElement("p"));
    let messageInfoValue = (commentInfo ? commentInfo : messageInfoContainer).appendChild(document.createElement("span"));
    if (info.type == "addcomment") {
      messageIcon.setAttribute("alt", "comment notification image")
      messageIcon.setAttribute("src", "/svgs/messages/comment.svg")
      let commentMessageContainer = messageInfoContainer.appendChild(document.createElement("div"));
      commentInfo.className = "comment-message-info"
      commentMessageContainer.className = "flex-row mod-comment-message"
      let userIconContainer = commentMessageContainer.appendChild(document.createElement("a"));
      userIconContainer.href = "/users/" + info.actor_username
      let userIconImg = userIconContainer.appendChild(document.createElement("img"));
      userIconImg.alt = info.actor_username + "'s avatar"
      userIconImg.className = "comment-message-info-img"
      userIconImg.src = `https://cdn2.scratch.mit.edu/get_image/user/${info.actor_id}_32x32.png`
      let commentContainer = commentMessageContainer.appendChild(document.createElement("div"));
      commentContainer.className = "comment-text"
      let comentText = commentContainer.appendChild(document.createElement("p"));
      comentText.className = "emoji-text mod-comment"
      comentText.innerHTML = info.comment_fragment
      let messageCreator = messageInfoValue.appendChild(document.createElement("a"));
      messageCreator.className = "social-messages-profile-link"
      messageCreator.href = `/users/${info.actor_username}/`
      messageCreator.innerText = info.actor_username
      messageInfoValue.appendChild(document.createTextNode(info.commentee_username == addon.auth.username ? " replied to your comment on " : " commented on "));
      let actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = info.comment_type == 1 ? (info.comment_obj_title == addon.auth.username ? "your profile" : info.comment_obj_title + "'s profile") : info.comment_obj_title
      actionLink.href = `/${info.comment_type == 0 ? "projects" : (info.comment_type == 1 ? "users" : "studios")}/${(info.comment_type == 1 ? info.comment_obj_title : info.comment_obj_id) + (info.comment_type == 2 ? "/comments" : "")}/#comments-${info.comment_id}/`
    }
    if (info.type == "loveproject") {
      messageIcon.setAttribute("alt", "favorite love image")
      messageIcon.setAttribute("src", "/svgs/messages/love.svg")
      let messageCreator = messageInfoValue.appendChild(document.createElement("a"));
      messageCreator.className = "social-messages-profile-link"
      messageCreator.href = `/users/${info.actor_username}/`
      messageCreator.innerText = info.actor_username
      messageInfoValue.appendChild(document.createTextNode(" loved your project "));
      let actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = info.title
      actionLink.href = `/projects/${info.project_id}/`
    }
    if (info.type == "favoriteproject") {
      messageIcon.setAttribute("alt", "favorite notification image")
      messageIcon.setAttribute("src", "/svgs/messages/favorite.svg")
      let messageCreator = messageInfoValue.appendChild(document.createElement("a"));
      messageCreator.className = "social-messages-profile-link"
      messageCreator.href = `/users/${info.actor_username}/`
      messageCreator.innerText = info.actor_username
      messageInfoValue.appendChild(document.createTextNode(" favorited your project "));
      let actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = info.project_title
      actionLink.href = `/projects/${info.project_id}/`
    }
    if (info.type == "studioactivity") {
      messageIcon.setAttribute("alt", "studio activity notification image")
      messageIcon.setAttribute("src", "/svgs/messages/studio-activity.svg")
      messageInfoValue.appendChild(document.createTextNode("There was new activity in "));
      let actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = info.title
      actionLink.href = `/studios/${info.gallery_id}/`
      messageInfoValue.appendChild(document.createTextNode(" today"));
    }
    if (info.type == "curatorinvite") {
      messageIcon.setAttribute("alt", "curator invite notification image")
      messageIcon.setAttribute("src", "/svgs/messages/curator-invite.svg")
      let messageCreator = messageInfoValue.appendChild(document.createElement("a"));
      messageCreator.className = "social-messages-profile-link"
      messageCreator.href = `/users/${info.actor_username}/`
      messageCreator.innerText = info.actor_username
      messageInfoValue.appendChild(document.createTextNode(" invited you to curate the studio "));
      let actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = info.title
      actionLink.href = `/studios/${info.gallery_id}/`
      messageInfoValue.appendChild(document.createTextNode(". Visit the "));
      actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = "curator tab"
      actionLink.href = `/studios/${info.gallery_id}/curators`
      messageInfoValue.appendChild(document.createTextNode(" on the studio to accept the invitation"));
    }
    if (info.type == "followuser") {
      messageIcon.setAttribute("alt", "follow activity notification image")
      messageIcon.setAttribute("src", "/svgs/messages/follow.svg")
      let messageCreator = messageInfoValue.appendChild(document.createElement("a"));
      messageCreator.className = "social-messages-profile-link"
      messageCreator.href = `/users/${info.actor_username}/`
      messageCreator.innerText = info.actor_username
      messageInfoValue.appendChild(document.createTextNode(" is now following you"));
    }
    if (info.type == "remixproject") {
      messageIcon.setAttribute("alt", "remix notification image")
      messageIcon.setAttribute("src", "/svgs/messages/remix.svg")
      let messageCreator = messageInfoValue.appendChild(document.createElement("a"));
      messageCreator.className = "social-messages-profile-link"
      messageCreator.href = `/users/${info.actor_username}/`
      messageCreator.innerText = info.actor_username
      messageInfoValue.appendChild(document.createTextNode(" remixed your project "));
      let actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = info.parent_title
      actionLink.href = `/projects/${info.parent_id}/`
      messageInfoValue.appendChild(document.createTextNode(" as "));
      actionLink = messageInfoValue.appendChild(document.createElement("a"));
      actionLink.innerText = info.title
      actionLink.href = `/projects/${info.project_id}/`
    }
    function getTimeDifference(time) {
      const differance = Math.abs(new Date() - new Date(time));
      let toReturn = differance / (1000 * 60 * 60 * 24 * 30.4166667 * 12)
      let amount = "years";
      if (toReturn < 1) {toReturn *= 12; amount = "month"}
      if (toReturn < 1) {toReturn *= 30.4166667; amount = "day"}
      if (toReturn < 1) {toReturn *= 24; amount = "hour"}
      if (toReturn < 1) {toReturn *= 60; amount = "minute"}
      if (toReturn < 1) {toReturn *= 60; amount = "second"}
      if (Math.floor(toReturn) != 1) amount+= "s"
      toReturn = `${Math.floor(toReturn)} ${amount} ago`
      toReturn = toReturn == "1 day ago" ? "yesterday" : (toReturn == "1 month ago" ? "last month" : (toReturn == "1 year ago" ? "last year" : toReturn))
      return toReturn;
    }
  }
  async function getVaildComments(valid=[], offset=0) {
    loadMore.innerText = "Loading Messages..."
    await addon.fetch(`https://api.scratch.mit.edu/users/${addon.auth.username}/messages?limit=40&offset=${offset * 40}`)
    .then((response) => {
      return response.json();
    })
    .then((messages) => {
      if (messages.length == 0) return valid;
      for (let i = 0; i < messages.length; i++) {
        let messageType = messages[i].type
        if (messageType == "addcomment") {
          messageType += "/";
          let commentUrl;
          if (messages[i].comment_type === 0) { // Project comment
            const replyFor = messages[i].commentee_username;
            if (replyFor === null) messageType += "ownProjectNewComment";
            else if (replyFor === addon.auth.username) messageType += "projectReplyToSelf";
            else messageType += "ownProjectReplyToOther";
            commentUrl = `https://scratch.mit.edu/projects/${messages[i].comment_obj_id}/#comments-${messages[i].comment_id}`;
          } else if (messages[i].comment_type === 1) { // Profile comment
            const profile = messages[i].comment_obj_title;
            const replyFor = messages[i].commentee_username;
            if (profile === addon.auth.username) {
              if (replyFor === null) messageType += "ownProfileNewComment";
              else if (replyFor === addon.auth.username) messageType += "ownProfileReplyToSelf";
              else messageType += "ownProfileReplyToOther";
            } else { // Studio comment
              messageType += "otherProfileReplyToSelf";
            }
            commentUrl = `https://scratch.mit.edu/users/${messages[i].comment_obj_title}/#comments-${messages[i].comment_id}`;
          } else if (messages[i].comment_type === 2) {
            messageType += "studio";
            commentUrl = `https://scratch.mit.edu/studios/${messages[i].comment_obj_id}/comments/#comments-${messages[i].comment_id}`;
          }
        }
        if (messages[i].type === "addcomment") {
          if (
            messageType === "addcomment/ownProjectNewComment" ||
            messageType === "addcomment/ownProjectReplyToOther"
          ) {
            if (addon.settings.get("commentsonmyprojects") === false) continue;
          } else {
            if (addon.settings.get("commentsforme") === false) continue;
          }
        } else {
          if (messages[i].type == "becomeownerstudio") messages[i].type = "studioactivity"
          if (messages[i].type == "userjoin") messages[i].type = "followuser"
          if (addon.settings.get(messages[i].type) === false) continue;
        }
        if (valid.length < 40) valid.push(messages[i])
      }
    });
    if (valid.length < 40) return getVaildComments(valid, offset+1)
    loadMore.innerText = loadMoreText;
    window.commentsOffset = offset + 1
    return valid;
  }
}
