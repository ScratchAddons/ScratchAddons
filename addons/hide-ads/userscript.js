export default async function ({ addon, console }) {
  let url;
  let contentClass;
  let containerClass;
  let userClass;

  const settings = { projects: "projects", studios: "studios", profiles: "users" };
  const matches = addon.settings.get("matches");

  url = window.location.href;

  if (url.includes("projects")) {
    contentClass = ".comment-content";
    containerClass = ".comment-container";
    userClass = ".username";
  } else if (url.includes("studios")) {
    contentClass = ".comment-content";
    containerClass = ".comment-container";
    userClass = ".username";
  } else if (url.includes("users")) {
    contentClass = ".content";
    containerClass = ".top-level-reply";
    userClass = ".name";
  }

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
    if (addon.settings.get("method") === "hide") {
      element.style.display = "none";
    } else {
      const comment = element.classList.contains("comment") ? element : element.querySelector(".comment");
      comment.classList.add("contains-advertising");

      let commentContent;
      let profileReplyButton;

      if (url.includes(settings["profiles"])) {
        commentContent = element.querySelector(".info>.content");
        profileReplyButton = commentContent.nextElementSibling.lastElementChild;
      } else {
        commentContent = element.querySelector(".comment-content");
      }

      function handleProfileReplyButton() {
        if (profileReplyButton?.classList.contains("reply") && url.includes(settings["profiles"])) {
          return true;
        } else return false;
      }

      const key = comment.getAttribute("id");
      const value = commentContent.innerHTML;

      idToContent[key] = value;

      commentContent.innerHTML =
        blockType === "content" ? advertisingContent : blockType === "user" ? advertisingUser : advertisingSpam;
      commentContent.classList.add("advertising");
      commentContent.style.cursor = "pointer";

      if (handleProfileReplyButton()) {
        profileReplyButton.style.display = "";
      }

      commentContent.addEventListener("click", () => {
        if (commentContent.classList.contains("advertising")) {
          commentContent.innerHTML = idToContent[commentContent.closest(".comment").getAttribute("id")];
          commentContent.classList.remove("advertising");
          comment.classList.remove("contains-advertising");

          if (handleProfileReplyButton()) {
            profileReplyButton.style.display = "inline";
          }
        } else {
          commentContent.innerHTML =
            blockType === "content" ? advertisingContent : blockType === "user" ? advertisingUser : advertisingSpam;
          commentContent.classList.add("advertising");
          comment.classList.add("contains-advertising");

          if (handleProfileReplyButton()) {
            profileReplyButton.style.display = "";
          }
        }
      });
    }
  }

  function stringIncludesString(comment, string) {
    return typeof comment === "object"
      ? comment.innerHTML.toLowerCase().includes(string.toLowerCase().trim())
      : comment.toLowerCase().includes(string.toLowerCase().trim());
  }

  let foundMatch = false;

  for (const key in settings) {
    if (settings.hasOwnProperty.call(settings, key)) {
      if (url.includes(settings[key]) && addon.settings.get(key)) {
        while (true) {
          const commentContent = await addon.tab.waitForElement(contentClass, { markAsSeen: true });

          foundMatch = false;

          matches.forEach((match) => {
            if (match.matchType === "link" || match.matchType === "string") {
              if (stringIncludesString(commentContent.innerText, match.matchValue)) {
                foundMatch = true;

                if (commentContent.closest(".comment").parentElement.classList.contains(containerClass))
                  handleComment(commentContent.closest(containerClass), "content");
                else handleComment(commentContent.closest(".comment"), "content");
              }
            } else if (match.matchType === "user") {
              const userName = commentContent.closest(".comment").querySelector(userClass);

              if (stringIncludesString(userName.innerText, match.matchValue)) {
                foundMatch = true;

                if (commentContent.closest(".comment").parentElement.classList.contains(containerClass))
                  handleComment(commentContent.closest(containerClass), "user");
                else handleComment(commentContent.closest(".comment"), "user");
              }
            }
          });

          // Check if a match was found before applying spam filtering
          if (!foundMatch && addon.settings.get("spamFilter")) {
            if (filterSpamComments(commentContent.innerText)) {
              if (commentContent.closest(".comment").parentElement.classList.contains(containerClass))
                handleComment(commentContent.closest(containerClass), "spam");
              else handleComment(commentContent.closest(".comment"), "spam");
            }
          }
        }
      }
    }
  }
}
