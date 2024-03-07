export default async function ({ addon, console }) {
  let el;
  let url;
  const settings = { projects: "projects", studios: "studios", profiles: "users" };
  const matches = addon.settings.get("matches");

  url = window.location.href;

  const advertisingContent = "[Marked as advertising]";
  const advertisingUser = "[User's messages blocked]";

  /* 
  PROFILES
  top-level-reply

  comment
  info
  content.innerText

  replies
  reply
  comment
  content.innerText

  PROJECTS and STUDIOS
  comment-container

  comment
  comment-body
  comment-bubble
  comment-content
  emoji-text.innerText

  replies
  comment
  comment-body
  comment-bubble
  comment-content.lastChild.innerText (in replies there are two emoji-texts)
  */

  let idToContent = {};

  function handleComment(element, blockType) {
    if (addon.settings.get("method") === "hide") {
      element.style.display = "none";
    } else {
      const comment = element.classList.contains("comment") ? element : element.querySelector(".comment");
      comment.classList.add("contains-advertising");

      let commentContent;

      if (url.includes(settings["profiles"])) {
        commentContent = element.querySelector(".info>.content");
      } else {
        commentContent = element.querySelector(".comment-content");
      }

      const key = comment.getAttribute("id");
      const value = commentContent.innerHTML;

      idToContent[key] = value;

      commentContent.innerHTML = blockType === "content" ? advertisingContent : advertisingUser;
      commentContent.classList.add("advertising");
      commentContent.style.cursor = "pointer";

      commentContent.addEventListener("click", () => {
        if (commentContent.classList.contains("advertising")) {
          commentContent.innerHTML = idToContent[commentContent.closest(".comment").getAttribute("id")];
          commentContent.classList.remove("advertising");
          comment.classList.remove("contains-advertising");
        } else {
          commentContent.innerHTML = blockType === "content" ? advertisingContent : advertisingUser;
          commentContent.classList.add("advertising");
          comment.classList.add("contains-advertising");
        }
      });
    }
  }

  if (url.includes("projects")) el = ".comment-container";
  else if (url.includes("studios")) el = ".comment-container";
  else if (url.includes("users")) el = ".top-level-reply";

  //dsis = does string include string
  function dsis(comment, string) {
    return typeof comment === "object"
      ? comment.innerHTML.toLowerCase().includes(string.toLowerCase())
      : comment.toLowerCase().includes(string.toLowerCase());
  }

  function handleMatch(element, match, typeOfBlock) {
    function handleReplies(element, match, typeOfBlock) {
      if (url.includes(settings["profiles"])) {
        //Projects and studios are handled below
        const replies = element.querySelectorAll("li.reply");
        replies.forEach((reply) => {
          if (dsis(reply, match)) {
            handleComment(reply, typeOfBlock);
          }
        });
      }
    }

    if (dsis(element.querySelector("div.comment"), match)) {
      //If this is true, the first comment is what contains the advertising
      handleComment(element, typeOfBlock);

      // //If we are censoring, not hiding, then replies need to be checked too
      // if (addon.settings.get("method") === "censor") handleReplies();
    } else {
      //The first comment is not the offending comment, we search replies now
      handleReplies(element, match, typeOfBlock);
    }
  }

  for (const key in settings) {
    if (settings.hasOwnProperty.call(settings, key)) {
      if (url.includes(settings[key]) && addon.settings.get(key)) {
        while (true) {
          const commentsContainer = await addon.tab.waitForElement(el, { markAsSeen: true });
          matches.forEach((match) => {
            if (match.matchType === "link" || match.matchType === "string") {
              const commentContent = commentsContainer.querySelector(".comment-content");
              if (dsis(commentContent.innerText, match.matchValue)) {
                //We have a match somewhere, now we need to figure out where
                handleMatch(commentsContainer, match.matchValue, "content");
              }
            } else if (match.matchType === "user") {
              const userName = commentsContainer.querySelector(".username");

              if (dsis(userName.innerText, match.matchValue)) {
                //We have a match to the username, now we hide or censor it
                handleComment(commentsContainer, "user");
              }
            }
          });

          //Project and studio replies are not loaded when the comment container is, which means we have to search for them separately
          async function replies() {
            if (!url.includes(settings["profiles"])) {
              const commentReply = await addon.tab.waitForElement("div.replies>div.comment", { markAsSeen: true });

              matches.forEach((match) => {
                if (match.matchType === "link" || match.matchType === "string") {
                  if (dsis(commentReply, match.matchValue)) {
                    handleComment(commentReply, "content");
                  }
                } else if (match.matchType === "user") {
                  const userName = commentReply.querySelector(".username");
                  if (dsis(userName.innerText, match.matchValue)) {
                    handleComment(commentReply, "user");
                  }
                }
              });
            }
          }

          // replies();
        }
      }
    }
  }
}
