import { insert, wrapSelection, getSelection } from "../../libraries/thirdparty/cs/text-field-edit.js";

export const createDropdown = (name, msg, buttons, displayOnSetting = null, classPrefix = "sa-forum-toolbar-") => {
  const liTag = document.createElement("li");
  liTag.classList.add("markItUpButton");
  liTag.classList.add("markItUpDropMenu");
  liTag.classList.add(classPrefix + name);
  liTag.dataset.name = name;
  const buttonName = typeof msg === "function" ? msg(name) : msg;
  const aTag = Object.assign(document.createElement("a"), {
    href: "#",
    textContent: buttonName,
    title: buttonName,
  });
  liTag.append(aTag);
  const ulTag = document.createElement("ul");
  ulTag.hidden = true;
  buttons.forEach((button) => {
    if (displayOnSetting !== null) {
      button.style.display = `var(--${displayOnSetting}-${button.dataset.name}, none)`;
    }
    ulTag.append(button);
  });
  liTag.addEventListener("click", (e) => e.preventDefault());
  liTag.addEventListener("mouseover", () => {
    ulTag.style.display = "block";
  });
  liTag.addEventListener("mouseout", () => {
    ulTag.style.display = "none";
  });
  liTag.append(ulTag);
  return liTag;
};
/**
 * There are four ways to use this:
 * 1) use openWith (and closeWith optionally) - useful for static values e.g. emoji, [center]
 * 2) use replaceWith - useful for replacing selection with static text
 * 3) use promptTag/promptContent along with tag - useful for inserting a tag with parameter e.g. [url]
 * 4) use callback - useful if you're not inserting
 * This assumes that the name (and prompt-name if applicable) are messages that
 * exist, or that nameMessage or promptMessage are given.
 */
export const createButton = (
  name,
  {
    openWith,
    replaceWith,
    closeWith,
    tag,
    promptTag,
    promptContent,
    promptText,
    callback,
    defaultSelection,
    msg,
    nameMessage,
    promptMessage,
    classPrefix = "sa-forum-toolbar-",
  }
) => {
  const textBox = document.querySelector(".markItUpEditor");
  const liTag = document.createElement("li");
  liTag.classList.add("markItUpButton");
  liTag.classList.add(classPrefix + name);
  liTag.dataset.name = name;
  const buttonName = nameMessage || msg(name);
  const aTag = Object.assign(document.createElement("a"), {
    href: "#",
    textContent: buttonName,
    title: buttonName,
  });
  liTag.append(aTag);
  liTag.addEventListener("click", (e) => {
    e.preventDefault();
    let ow = openWith,
      cw = closeWith,
      rw = replaceWith;
    if (promptTag) {
      const value = prompt(
        promptMessage || msg("prompt-" + name),
        defaultSelection ? getSelection(textBox).trim() : undefined
      );
      if (value !== null) {
        ow = `[${tag}${value ? `=${value}` : ""}]`;
        cw = `[/${tag}]`;
      }
    } else if (promptContent) {
      const value = getSelection(textBox) || prompt(promptMessage || msg("prompt-" + name));
      if (value !== null) rw = `[${tag}]${value}[/${tag}]`;
    } else if (promptText) {
      const value = getSelection(textBox) || prompt(promptMessage || msg("prompt-" + name));
      if (value !== null) rw = `${openWith}${value}${closeWith}`;
    }
    if (typeof rw === "string") {
      insert(textBox, rw);
    } else if (typeof ow === "string" || typeof cw === "string") {
      wrapSelection(textBox, ow || "", cw || "");
    } else if (callback) {
      callback();
    }
    textBox.focus();
  });
  return liTag;
};
