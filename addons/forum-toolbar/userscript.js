import { insert, wrapSelection, getSelection } from "../../libraries/thirdparty/cs/text-field-edit.js";
export default async ({ addon, console, msg }) => {
  await addon.tab.waitForElement(".markItUpButton16");
  const textBox = document.getElementById("id_body");
  /*
   * Available spaces are: (from left to right)
   * forumToolbarTextDecoration
   * forumToolbarLinkDecoration
   * forumToolbarFont
   * forumToolbarList
   * forumToolbarDecoration
   * forumToolbarEnvironment
   * forumToolbarScratchblocks
   * forumToolbarTools
   */
  const appendButton = (space, element, order) => {
    addon.tab.appendToSharedSpace({
      space,
      order,
      element,
    });
    addon.tab.displayNoneWhileDisabled(element, {
      display: `var(--forumToolbar-${element.dataset.name})`,
    });
  };
  /**
   * There are four ways to use this:
   * 1) use openWith (and closeWith optionally) - useful for static values e.g. emoji, [center]
   * 2) use replaceWith - useful for replacing selection with static text
   * 3) use promptTag/promptContent along with tag - useful for inserting a tag with parameter e.g. [url]
   * 4) use callback - useful if you're not inserting
   */
  const createButton = (
    name,
    { openWith, replaceWith, closeWith, tag, promptTag, promptContent, callback, defaultSelection }
  ) => {
    const liTag = document.createElement("li");
    liTag.classList.add("markItUpButton");
    liTag.classList.add("sa-forum-toolbar");
    liTag.classList.add("sa-forum-toolbar-" + name);
    liTag.dataset.name = name;
    const buttonName = msg(name);
    const aTag = Object.assign(document.createElement("a"), {
      href: "#",
      textContent: buttonName,
      title: buttonName,
    });
    liTag.append(aTag);
    liTag.addEventListener("click", (e) => {
      e.preventDefault();
      if (promptTag) {
        const value = prompt(msg("prompt-" + name), defaultSelection ? getSelection(textBox) : undefined);
        openWith = `[${tag}${value ? `=${value}` : ""}]`;
        closeWith = `[/${tag}]`;
      } else if (promptContent) {
        const value = getSelection(textBox) || prompt(msg("prompt-" + name));
        replaceWith = `[${tag}]${value}[/${tag}]`;
      }
      if (typeof replaceWith === "string") {
        insert(textBox, replaceWith);
      } else if (typeof openWith === "string" || typeof closeWith === "string") {
        wrapSelection(textBox, openWith || "", closeWith || "");
      } else if (callback) {
        callback();
      }
    });
    return liTag;
  };

  /**
   * To add buttons,
   * 1) edit addon.json; add a new setting for the button, and add customCssVariables
   * 2) add code below
   * 3) add background-image on userstyle.css
   * 4) add icon
   * 5) add addons-l10n
   */

  // Reminder: forumToolbarLinkDecoration order 1 is reserved by image-uploader

  appendButton(
    "forumToolbarTextDecoration",
    createButton("color", {
      tag: "color",
      promptTag: true,
    }),
    1
  );

  appendButton(
    "forumToolbarLinkDecoration",
    createButton("wp", {
      tag: "wp",
      promptTag: true,
      defaultSelection: true,
    }),
    2
  );
  appendButton(
    "forumToolbarLinkDecoration",
    createButton("wiki", {
      tag: "wiki",
      promptTag: true,
      defaultSelection: true,
    }),
    3
  );
  appendButton(
    "forumToolbarLinkDecoration",
    createButton("google", {
      tag: "google",
      promptTag: true,
      defaultSelection: true,
    }),
    4
  );
  appendButton(
    "forumToolbarLinkDecoration",
    createButton("dictionary", {
      tag: "dictionary",
      promptTag: true,
      defaultSelection: true,
    }),
    5
  );

  appendButton(
    "forumToolbarDecoration",
    createButton("center", {
      openWith: "[center]",
      closeWith: "[/center]",
    }),
    1
  );
  appendButton(
    "forumToolbarDecoration",
    createButton("code", {
      tag: "code",
      promptTag: true,
    }),
    2
  );
};
