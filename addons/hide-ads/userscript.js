export default async function ({ addon, console }) {
  let el;
  let url;
  const settings = { projects: "projects", studios: "studios", profiles: "users" };
  const matches = addon.settings.get("matchingStrings").map((obj) => obj.match.toLowerCase());

  url = window.location.href;

  const advertisingContent = "[Marked as advertising]";

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

  function handleComment(element) {
    if (addon.settings.get("method") === "hide") {
      element.style.display = "none";
    } else {
      let commentContent;

      if (url.includes(settings["profiles"])) {
        commentContent = element.querySelector(".info>.content");
      } else {
        commentContent = element.querySelector(".comment-content");
      }

      const key = element.querySelector("div").getAttribute("id");
      const value = commentContent.innerText;

      idToContent[key] = value;

      commentContent.innerText = advertisingContent;
      commentContent.classList.add("advertising");

      commentContent.addEventListener("click", () => {
        if (commentContent.innerText === advertisingContent) {
          commentContent.innerText = idToContent[commentContent.closest(".comment").getAttribute("id")];
          commentContent.classList.remove("advertising");
        } else {
          commentContent.innerText = advertisingContent;
          commentContent.classList.add("advertising");
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

  for (const key in settings) {
    if (settings.hasOwnProperty.call(settings, key)) {
      if (url.includes(settings[key]) && addon.settings.get(key)) {
        while (true) {
          const commentsContainer = await addon.tab.waitForElement(el, { markAsSeen: true });
          console.log("Checking main comments");
          matches.forEach((match) => {
            if (dsis(commentsContainer.innerHTML, match)) {
              //We have a match somewhere, now we need to figure out where

              function handleReplies() {
                if (url.includes(settings["profiles"])) {
                  //Projects and studios are handled below
                  const replies = commentsContainer.querySelectorAll("li.reply");
                  replies.forEach((reply) => {
                    if (dsis(reply, match)) {
                      handleComment(reply);
                    }
                  });
                }
              }

              if (dsis(commentsContainer.querySelector("div.comment"), match)) {
                //If this is true, the first comment is what contains the advertising
                handleComment(commentsContainer);

                //If we are censoring, not hiding, then replies need to be checked too
                if (addon.settings.get("method") === "censor") handleReplies();
              } else {
                //The first comment is not the offending comment, we search replies now
                handleReplies();
              }
            }
          });

          //Project and studio replies are not loaded when the comment container is, which means we have to search for them separately
          // if (addon.settings.get("method") === "censor" && !url.includes(settings["profiles"])) {
          //   const commentReply = await addon.tab.waitForElement("div.replies>div.comment", { markAsSeen: true });
          //   console.log("Checing replies");
          //   matches.forEach((match) => {
          //     if (dsis(commentReply, match)) {
          //       handleComment(commentReply);
          //     }
          //   });
          // }
        }
      }
    }
  }
}
