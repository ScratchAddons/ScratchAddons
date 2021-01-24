function rsort(array, by1, by2) {
  return array.sort((b, a) => {
    return String(a[by1]).localeCompare(String(b[by1])) === 0
      ? String(a[by2]).localeCompare(String(b[by2]))
      : String(a[by1]).localeCompare(String(b[by1]));
  });
}

var messageIndex = 0;

function printMessages(safeMsg) {
  if (Object.keys(messages).length == users.length) {
    messages = rsort(messages.flat(), "unread", "datetime_created");
    document.getElementsByClassName("messages-social-list")[0].innerHTML = "";
    var currentIndex = messageIndex;
    for (; messageIndex < currentIndex + 20; messageIndex++) {
      var message = messages[messageIndex];
      document.getElementsByClassName(
        "messages-social-list"
      )[0].innerHTML += `<li class="social-message mod-${messageHTML(
        message
      )}</div></div><span class="social-message-date"><span>${timeSince(
        new Date(message.datetime_created)
      )}</span></span></div></li>`;
    }
    //ADD duplicate detection
  }
}

function timeSince(date, safeMsg) {
  var seconds = Math.floor((new Date() - date) / 1000);
  var interval = seconds / 31536000;
  if (interval > 1) {
    return safeMsg("years", {
      number: Math.floor(interval),
    });
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return safeMsg("months", {
      number: Math.floor(interval),
    });
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return safeMsg("days", {
      number: Math.floor(interval),
    });
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return safeMsg("hours", {
      number: Math.floor(interval),
    });
  }
  interval = seconds / 60;
  if (interval > 1) {
    return safeMsg("minutes", {
      number: Math.floor(interval),
    });
  }
  return safeMsg("seconds", {
    number: Math.floor(seconds),
  });
}

function messageHTML(message, safeMsg) {
  //all are unneeded if actor_username is one of the users' alts
  switch (message.type) {
    default:
      return `sa-error"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="notification image" src="chrome-extension://fbeffbjdlemaoicjdapfpikkikjoneco/images/icons/notice-red.svg" class="social-message-icon" width="1rem"><div><p class="comment-message-info"><span>Scratch Addons error: <code>Unrecognised message type - ${
        message.type
      }</code>. Please post this error on <a href="https://github.com/ScratchAddons/ScratchAddons/issues/new?assignees=RedGuy12&amp;labels=bug&amp;template=---bug.md&amp;title=Unrecognised%20message%20type:%20${
        message.type
      }">GitHub</a> or report it via <a href="https://scratchaddons.com/feedback">Scratch Addons Feedback</a>. Wherever you report it, please make sure you include the following error code: </span></p><div class="flex-row mod-sa-error"><div class="error-text"><pre class="sa-error">JSON message: ${JSON.stringify(
        message
      )
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</pre></div></div>`;
    case "followuser":
      return `follow-user"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="follow notification image" class="social-message-icon" src="/svgs/messages/follow.svg"><div><span><a class="social-messages-profile-link" href="/users/${
        message.actor_username
      }/">${message.actor_username}</a> is now following ${message.recipient_id}</span>`;
    case "loveproject":
      return `love-project"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="love notification image" class="social-message-icon" src="/svgs/messages/love.svg"><div><span><a class="social-messages-profile-link" href="/users/${
        message.actor_username
      }">${message.actor_username}</a> loved your project <a href="/projects/${
        message.project_id
      }">${message.title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a></span>`;
    case "favoriteproject":
      return `love-favorite"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="favorite notification image" class="social-message-icon" src="/svgs/messages/favorite.svg"><div><span><a class="social-messages-profile-link" href="/users/${
        message.actor_username
      }">${message.actor_username}</a> favorited your project <a href="/projects/${
        message.project_id
      }">${message.project_title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a></span>`;
    case "remixproject":
      return `remix-project"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="remix notification image" class="social-message-icon" src="/svgs/messages/remix.svg"><div><span><a class="social-messages-profile-link" href="/users/${
        message.actor_username
      }">${message.actor_username}</a> remixed your project <a href="/projects/${
        message.parent_id
      }">${message.parent_title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a> as <a href="/projects/${
        message.project_id
      }">${message.title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a></span>`;
    case "curatorinvite":
      return `curator-invite"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="curator invite notification image" class="social-message-icon" src="/svgs/messages/curator-invite.svg"><div><span><a class="social-messages-profile-link" href="/users/${
        message.actor_username
      }/">${message.actor_username}</a> invited <a class="social-messages-profile-link" href="/users/${
        message.recipient_name
      }/">${message.recipient_name}</a> to curate the studio <a href="/studios/${
        message.gallery_id
      }/">${message.title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a>. Visit the <a href="/studios/${
        message.gallery_id
      }/curators/">curator tab</a> on the studio to accept the invitation</span>`;
    case "becomeownerstudio":
      return `become-manager"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="become owner notification image" class="social-message-icon" src="/svgs/messages/owner-invite.svg"><div><span><a class="social-messages-profile-link" href="/users/${
        message.actor_username
      }/">${message.actor_username}</a> promoted <a class="social-messages-profile-link" href="/users/${
        message.actor_username
      }/">${message.recipient_username}</a> to manager for the studio <a href="/studios/${
        message.gallery_id
      }/">${message.gallery_title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a></span>`;
    case "studioactivity":
      return `studio-activity"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="studio activity notification image" class="social-message-icon" src="/svgs/messages/studio-activity.svg"><div><span>There was new activity in <a href="/studios/${
        message.gallery_id
      }/activity">${message.title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a> today</span>`; //potential for duplicates
    case "forumpost":
      return `forum-activity"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="forum activity notification image" class="social-message-icon" src="/svgs/messages/forum-activity.svg"><div><span>There are new posts in the forum thread: <a href="/discuss/topic/${
        message.topic_id
      }/unread/">${message.topic_title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a></span>`; //potential for duplicates
    case "userjoin":
      return `user-join"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><div><span>Welcome to Scratch, ${
        message.actor_username
      }! After you make projects and comments, you'll get messages about them here. Go <a href="/explore">Explore</a> or <a href="/projects/editor/?tutorial=getStarted">make a project</a>.</span>`; //IMPROVE by moving to "alerts"
    case "loginrequired":
      return `sa-error"><div class="flex-row ${
        message.unread ? "mod-unread" : ""
      } mod-social-message"><div class="social-message-content"><img alt="notification image" src="chrome-extension://fbeffbjdlemaoicjdapfpikkikjoneco/images/icons/notice-red.svg" class="social-message-icon" width="1rem"><div><span>Scratch Addons error: <code>Missing username, ID, and/or XToken for account - ${
        message.recipient_name
      }</code>. <strong>This will most likely be fixed by logging into the account <a href="/users/${
        message.recipient_name
      }">${message.recipient_name}</a>.</strong></span></p></div></div>`;
    case "addcomment": {
      if (users.flatMap(Object.values).includes(message.commentee_username)) {
        switch (message.comment_type) {
          case 0:
            return `comment-message"><div class="flex-row ${
              message.unread ? "mod-unread" : ""
            } mod-social-message"><div class="social-message-content"><img alt="comment notification image" class="social-message-icon" src="/svgs/messages/comment.svg"><div><p class="comment-message-info"><span><a class="social-messages-profile-link" href="/users/${
              message.actor_username
            }/">${message.actor_username}</a> replied to your comment on <a href="/projects/${
              message.comment_obj_id
            }/#comments-${message.comment_id}">${message.comment_obj_title
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</a></span></p><div class="flex-row mod-comment-message"><a href="/users/${
              message.actor_username
            }"><img alt="${
              message.actor_username
            }'s avatar" class="comment-message-info-img" src="https://cdn2.scratch.mit.edu/get_image/user/${
              message.actor_id
            }_32x32.png"></a><div class="comment-text"><p class="emoji-text mod-comment">${message.comment_fragment
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</p></div></div>`;
          case 1:
            return `comment-message"><div class="flex-row ${
              message.unread ? "mod-unread" : ""
            } mod-social-message"><div class="social-message-content"><img alt="comment notification image" class="social-message-icon" src="/svgs/messages/comment.svg"><div><p class="comment-message-info"><span><a class="social-messages-profile-link" href="/users/${
              message.actor_username
            }/">${message.actor_username}</a> replied to your comment on <a href="/users/${
              message.comment_obj_id
            }/#comments-${message.comment_id}"><span>${message.comment_obj_title
              .replaceAll("<", "&lt;")
              .replaceAll(
                ">",
                "&gt;"
              )}'s profile</span></a></span></p><div class="flex-row mod-comment-message"><a href="/users/${
              message.actor_username
            }"><img alt="${
              message.actor_username
            }'s avatar" class="comment-message-info-img" src="https://cdn2.scratch.mit.edu/get_image/user/${
              message.actor_id
            }_32x32.png"></a><div class="comment-text"><p class="emoji-text mod-comment">${message.comment_fragment
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</p></div></div>`;
          case 2:
            return `comment-message"><div class="flex-row ${
              message.unread ? "mod-unread" : ""
            } mod-social-message"><div class="social-message-content"><img alt="comment notification image" class="social-message-icon" src="/svgs/messages/comment.svg"><div><p class="comment-message-info"><span><a class="social-messages-profile-link" href="/users/${
              message.actor_username
            }/">${message.actor_username}</a> replied to your comment in <a href="/studios/${
              message.comment_obj_id
            }/comments/#comments-${message.comment_id}">${message.comment_obj_title
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</a></span></p><div class="flex-row mod-comment-message"><a href="/users/${
              message.actor_username
            }"><img alt="${
              message.actor_username
            }'s avatar" class="comment-message-info-img" src="https://cdn2.scratch.mit.edu/get_image/user/${
              message.actor_id
            }_32x32.png"></a><div class="comment-text"><p class="emoji-text mod-comment">${message.comment_fragment
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</p></div></div>`;
          default:
            return `sa-error"><div class="flex-row ${
              message.unread ? "mod-unread" : ""
            } mod-social-message"><div class="social-message-content"><img alt="notification image" src="chrome-extension://fbeffbjdlemaoicjdapfpikkikjoneco/images/icons/notice-red.svg" class="social-message-icon" width="1rem"><div><p class="comment-message-info"><span>Scratch Addons error: <code>Unrecognised comment type - ${
              message.comment_type
            }</code>. Please post this error on <a href="https://github.com/ScratchAddons/ScratchAddons/issues/new?assignees=RedGuy12&amp;labels=bug&amp;template=---bug.md&amp;title=Unrecognised%20comment%20type:%20${
              message.comment_type
            }">GitHub</a> or report it via <a href="https://scratchaddons.com/feedback">Scratch Addons Feedback</a>. Wherever you report it, please make sure you include the following error code: </span></p><div class="flex-row mod-sa-error"><div class="error-text"><pre class="sa-error">JSON message: ${JSON.stringify(
              message
            )
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</pre></div></div>`;
        }
      } else {
        switch (message.comment_type) {
          case 0:
            return `comment-message"><div class="flex-row ${
              message.unread ? "mod-unread" : ""
            } mod-social-message"><div class="social-message-content"><img alt="comment notification image" class="social-message-icon" src="/svgs/messages/comment.svg"><div><p class="comment-message-info"><span><a class="social-messages-profile-link" href="/users/${
              message.actor_username
            }/">${message.actor_username}</a> commented on <a href="/projects/${message.comment_obj_title
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}/#comments-${message.comment_id}">${message.comment_obj_title
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</a></span></p><div class="flex-row mod-comment-message"><a href="/users/${
              message.actor_username
            }"><img alt="${
              message.actor_username
            }'s avatar" class="comment-message-info-img" src="https://cdn2.scratch.mit.edu/get_image/user/${
              message.actor_id
            }_32x32.png"></a><div class="comment-text"><p class="emoji-text mod-comment">${message.comment_fragment
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</p></div></div>`;
          case 1:
            return `comment-message"><div class="flex-row ${
              message.unread ? "mod-unread" : ""
            } mod-social-message"><div class="social-message-content"><img alt="comment notification image" class="social-message-icon" src="/svgs/messages/comment.svg"><div><p class="comment-message-info"><span><a class="social-messages-profile-link" href="/users/${
              message.actor_username
            }/">${message.actor_username}</a> commented on <a href="/users/${message.comment_obj_title
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}/#comments-${message.comment_id}">${message.comment_obj_title
              .replaceAll("<", "&lt;")
              .replaceAll(
                ">",
                "&gt;"
              )}'s profile</a></span></p><div class="flex-row mod-comment-message"><a href="/users/${
              message.actor_username
            }"><img alt="${
              message.actor_username
            }'s avatar" class="comment-message-info-img" src="https://cdn2.scratch.mit.edu/get_image/user/${
              message.actor_id
            }_32x32.png"></a><div class="comment-text"><p class="emoji-text mod-comment">${message.comment_fragment
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</p></div></div>`;
          default:
            return `sa-error"><div class="flex-row ${
              message.unread ? "mod-unread" : ""
            } mod-social-message"><div class="social-message-content"><img alt="notification image" src="chrome-extension://fbeffbjdlemaoicjdapfpikkikjoneco/images/icons/notice-red.svg" class="social-message-icon" width="1rem"><div><p class="comment-message-info"><span>Scratch Addons error: <code>Unrecognised comment type - ${
              message.comment_type
            }</code>. Please post this error on <a href="https://github.com/ScratchAddons/ScratchAddons/issues/new?assignees=RedGuy12&amp;labels=bug&amp;template=---bug.md&amp;title=Unrecognised%20comment%20type:%20${
              message.comment_type
            }">GitHub</a> or report it via <a href="https://scratchaddons.com/feedback">Scratch Addons Feedback</a>. Wherever you report it, please make sure you include the following error code: </span></p><div class="flex-row mod-sa-error"><div class="error-text"><pre class="sa-error">JSON message: ${JSON.stringify(
              message
            )
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")}</pre></div></div>`;
        }
      }
    }
  }
}

export default async function ({ addon, safeMsg }) {
  if (addon.auth.isLoggedIn) {
    // set variables
    var cookieUsers;
    try {
      cookieUsers = JSON.parse(decodeURIComponent(/(sa-accounts=.*?);/.exec(document.cookie + ";")[1]));
    } catch (_) {
      cookieUsers = [];
    }
    var users = [];
    var messages = [];
    var alerts = [];
    var parseCookie = {
      name: [],
      token: [],
      id: [],
    };
    cookieUsers.forEach((user, index) => {
      // parse the stored cookie containing IDs and XTokens to make the next loop simpler
      var uValue = Object.values(user);
      var uKeys = Object.keys(user);
      parseCookie.name[index] = uKeys.indexOf("name") > -1 ? uValue[uKeys.indexOf("name")] : "";
      parseCookie.token[index] = uKeys.indexOf("token") > -1 ? uValue[uKeys.indexOf("token")] : "";
      parseCookie.id[index] = uKeys.indexOf("id") > -1 ? uValue[uKeys.indexOf("id")] : "";
    });
    //document.querySelector(".messages-social-list").innerHTML = '<img src="//cdn.scratch.mit.edu/scratchr2/static/__31603c47ef357e5c3cfbc182f95181bb__//images/ajax-loader.gif" class="loading" alt="loading...">' //clears the already-there messages and adds a loading image.
    users.forEach((user, index) => {
      alerts[index] = [];
      //turns alerts from [] to [[],[],[],[],...]. Messages dosen't need this because there is only one request, but Alerts are combined from two requests with .concat()
      if (Object.values(user).includes("")) {
        messages[index] = [
          {
            datetime_created: new Date().toISOString(),
            type: "loginrequired",
            recipient_id: user.id,
            recipient_name: user.name,
            xtoken: user.token,
            unread: true,
          },
        ];
        printMessages();
      } else {
        fetch("https://api.scratch.mit.edu/users/" + user.name + "/messages?x-token=" + user.token)
          .then((response) => response.json())
          .then((usermessages) => {
            messages[index] = usermessages;
            fetch("https://api.scratch.mit.edu/users/" + user.name + "/messages/count")
              .then((response) => response.json())
              .then((count) => {
                usermessages.forEach((_, ind) => {
                  messages[index][ind].recipient_id = user.id;
                  messages[index][ind].recipient_name = user.name;
                  messages[index][ind].unread = ind <= count - 1;
                });
                printMessages();
              });
          });
        //fetch("https://api.scratch.mit.edu/users/" + user.name + "/messages/admin?x-token=" + user.token).then(response => response.json()).then(useralerts => {
        //	alerts[index] = alerts[index].concat(useralerts)
        //	alerts.forEach((_, i) => alerts[index][i].recipient_id = userinfo.id)
        //})
        //fetch("https://api.scratch.mit.edu/users/" + user.name + "/invites?x-token=" + user.token).then(response => response.json()).then(invite => {
        //	if (!invite == {}) {
        //		parsedInvite = JSON.parse("[" + JSON.stringify(invite) + "]")
        //		parsedInvite[0].message = "<a href='[url]'>You are invited to become a Scratcher! Click here to learn more.</a>" //FIX url
        //		alerts[index] = alerts[index].concat(parsedInvite)
        //		alerts.forEach((_, i) => alerts[index][i].recipient_id = userinfo.id)
        //})
      }
    });
  }
}
