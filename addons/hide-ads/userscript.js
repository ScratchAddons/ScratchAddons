export default async function ({ addon, console }) {
  let el;
  let url;
  const settings = { projects: "projects", studios: "studios", profiles: "users" };
  const matches = addon.settings.get("matches");

  url = window.location.href;

  const advertisingContent = "[Marked as advertising]";
  const advertisingUser = "[User's messages blocked]";
  const advertisingSpam = "[Marked as general spam]";

  function filterSpamComments(content) {
    //These are just made by chatGPT after giving it a lot of example comments
    const repeatedCharactersRegex = /(.)\1{20,}/;

    const meaninglessRegex = /^[\W\s]*$/;

    if (repeatedCharactersRegex.test(content)) {
      return true;
    }

    if (meaninglessRegex.test(content)) {
      return true;
    }

    return false;
  }

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
    console.log(element);
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

      commentContent.innerHTML =
        blockType === "content" ? advertisingContent : blockType === "user" ? advertisingUser : advertisingSpam;
      commentContent.classList.add("advertising");
      commentContent.style.cursor = "pointer";

      commentContent.addEventListener("click", () => {
        if (commentContent.classList.contains("advertising")) {
          commentContent.innerHTML = idToContent[commentContent.closest(".comment").getAttribute("id")];
          commentContent.classList.remove("advertising");
          comment.classList.remove("contains-advertising");
        } else {
          commentContent.innerHTML =
            blockType === "content" ? advertisingContent : blockType === "user" ? advertisingUser : advertisingSpam;
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

  for (const key in settings) {
    if (settings.hasOwnProperty.call(settings, key)) {
      if (url.includes(settings[key]) && addon.settings.get(key)) {
        while (true) {
          const commentsContainer = await addon.tab.waitForElement(el, { markAsSeen: true });
          matches.forEach((match) => {
            const commentContents = commentsContainer.querySelectorAll(".comment-content");
            commentContents.forEach((commentContent) => {
              if (addon.settings.get("spamFilter")) {
                if (filterSpamComments(commentContent.innerText)) {
                  if (commentContent.closest(".comment").parentElement.classList.contains(".comment-container"))
                    handleComment(commentContent.closest(".comment-container"), "spam");
                  else handleComment(commentContent.closest(".comment"), "spam");
                }
              }

              if (match.matchType === "link" || match.matchType === "string") {
                if (dsis(commentContent.innerText, match.matchValue)) {
                  //We have a match somewhere, now we need to figure out where
                  if (commentContent.closest(".comment").parentElement.classList.contains(".comment-container"))
                    handleComment(commentContent.closest(".comment-container"), "content");
                  else handleComment(commentContent.closest(".comment"), "content");
                }
              } else if (match.matchType === "user") {
                const userName = commentContent.closest(".comment").querySelector(".username");

                if (dsis(userName.innerText, match.matchValue)) {
                  //We have a match to the username, now we hide or censor it
                  if (commentContent.closest(".comment").parentElement.classList.contains(".comment-container"))
                    handleComment(commentContent.closest(".comment-container"), "user");
                  else handleComment(commentContent.closest(".comment"), "user");
                }
              }
            });
          });
        }
      }
    }
  }
}
