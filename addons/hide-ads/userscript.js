export default async function ({ addon, msg, console }) {
  let url;
  let contentClass;
  let containerClass;
  let userClass;
  let idToContent = {};

  const settingsToUrl = { projects: "projects", studios: "studios", profiles: "users" };
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

  const advertisingContent = msg("ad");
  const advertisingUser = msg("user");
  const advertisingSpam = msg("spam");

  function filterSpamComments(content) {
    //These are just made by chatGPT after giving it a lot of example comments
    const repeatedCharactersRegex = /(.)\1{20,}/;
    const meaninglessRegex = /^(?:(?!\p{L})(?!\d).)+$/u;

    if (repeatedCharactersRegex.test(content)) {
      return true;
    }

    if (meaninglessRegex.test(content)) {
      return true;
    }

    return false;
  }

  function handleDisabled(commentContent, profileReplyButton, comment, handleProfileReplyButton, blockType) {
    commentContent.innerHTML = idToContent[commentContent.closest(".comment").getAttribute("id")];
    commentContent.classList.remove("advertising");
    comment.classList.remove("contains-advertising");

    if (handleProfileReplyButton()) {
      profileReplyButton.style.display = "inline";
    }

    commentContent.style.cursor = "";
  }

  function handleReenabled(commentContent, profileReplyButton, comment, handleProfileReplyButton, blockType) {
    commentContent.innerHTML =
      blockType === "content" ? advertisingContent : blockType === "user" ? advertisingUser : advertisingSpam;
    commentContent.classList.add("advertising");
    comment.classList.add("contains-advertising");

    if (handleProfileReplyButton()) {
      profileReplyButton.style.display = "";
    }

    commentContent.style.cursor = "pointer";
  }

  let settings = {};

  function getNewSettings() {
    settings["projects"] = addon.settings.get("projects");
    settings["studios"] = addon.settings.get("studios");
    settings["profiles"] = addon.settings.get("profiles");
    settings["method"] = addon.settings.get("method");
    settings["spamFilter"] = addon.settings.get("spamFilter");
    settings["matches"] = addon.settings.get("matches");
  }

  getNewSettings();

  function handleComment(element, blockType) {
    if (addon.settings.get("method") === "hide") {
      element.style.display = "none";
    } else {
      const comment = element.classList.contains("comment") ? element : element.querySelector(".comment");
      comment.classList.add("contains-advertising");

      let commentContent;
      let profileReplyButton;

      if (url.includes(settingsToUrl["profiles"])) {
        commentContent = element.querySelector(".info>.content");
        profileReplyButton = commentContent.nextElementSibling.lastElementChild;
      } else {
        commentContent = element.querySelector(".comment-content");
      }

      function handleProfileReplyButton() {
        if (profileReplyButton?.classList.contains("reply") && url.includes(settingsToUrl["profiles"])) {
          return true;
        } else return false;
      }

      const key = comment.getAttribute("id");
      const value = commentContent.innerHTML;

      idToContent[key] = value;

      commentContent.innerText =
        blockType === "content" ? advertisingContent : blockType === "user" ? advertisingUser : advertisingSpam;
      commentContent.classList.add("advertising");
      commentContent.role = "button";
      commentContent.tabIndex = 0;
      commentContent.style.cursor = "pointer";

      if (handleProfileReplyButton()) {
        profileReplyButton.style.display = "";
      }

      commentContent.addEventListener("click", () => {
        if (addon.self.disabled) return;
        if (commentContent.classList.contains("advertising")) {
          commentContent.innerHTML = idToContent[commentContent.closest(".comment").getAttribute("id")];
          commentContent.classList.remove("advertising");
          commentContent.role = null;
          commentContent.tabIndex = -1;
          comment.classList.remove("contains-advertising");

          if (handleProfileReplyButton()) {
            profileReplyButton.style.display = "inline";
          }
        } else {
          commentContent.innerText =
            blockType === "content" ? advertisingContent : blockType === "user" ? advertisingUser : advertisingSpam;
          commentContent.classList.add("advertising");
          comment.classList.add("contains-advertising");

          if (handleProfileReplyButton()) {
            profileReplyButton.style.display = "";
          }
        }
      });

      const args = [commentContent, profileReplyButton, comment, handleProfileReplyButton, blockType];

      addon.self.addEventListener("disabled", handleDisabled.bind(this, ...args));
      addon.self.addEventListener("reenabled", handleReenabled.bind(this, ...args));
    }
  }

  function stringIncludesString(commentContent, string) {
    let onlyContent = typeof commentContent === "object" ? commentContent.lastChild : commentContent;

    return typeof onlyContent === "object"
      ? onlyContent.innerText.toLowerCase().includes(string.toLowerCase().trim())
      : onlyContent.toLowerCase().includes(string.toLowerCase().trim());
  }

  let foundMatch = false;

  for (const key in settingsToUrl) {
    if (url.includes(settingsToUrl[key]) && addon.settings.get(key)) {
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
          if (filterSpamComments(commentContent.lastChild.textContent.trim())) {
            if (commentContent.closest(".comment").parentElement.classList.contains(containerClass))
              handleComment(commentContent.closest(containerClass), "spam");
            else handleComment(commentContent.closest(".comment"), "spam");
          }
        }
      }
    }
  }
}
