import { createButton, createDropdown } from "./lib.js";
export default async ({ addon, console, msg }) => {
  await addon.tab.waitForElement(".markItUpButton16");
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
    addon.tab.displayNoneWhileDisabled(element);
    element.style.display = `var(--forumToolbar-${element.dataset.name}, none)`;
  };
  const appendDropdown = (space, element, order) => {
    addon.tab.appendToSharedSpace({
      space,
      order,
      element,
    });
    const buttons = element.children[1].children;
    const display = Array.from(buttons, (button) => `var(--forumToolbar-${button.dataset.name},`);
    addon.tab.displayNoneWhileDisabled(element);
    element.style.display = `${display.join("")}none${")".repeat(buttons.length)}`;
  };

  /**
   * To add buttons,
   * 1) edit addon.json; add a new setting for the button, and add customCssVariables
   * 2) add code below
   * 3) add background-image on userstyle.css
   * 4) add icon
   * 5) add addons-l10n
   */

  appendButton(
    "forumToolbarTextDecoration",
    createButton("color", {
      tag: "color",
      promptTag: true,
      msg,
    }),
    1
  );

  appendDropdown(
    "forumToolbarLinkDecoration",
    createDropdown(
      "link",
      msg,
      [
        createButton("wp", {
          tag: "wp",
          promptTag: true,
          defaultSelection: true,
          msg,
        }),
        createButton("wiki", {
          tag: "wiki",
          promptTag: true,
          defaultSelection: true,
          msg,
        }),
        createButton("google", {
          tag: "google",
          promptTag: true,
          defaultSelection: true,
          msg,
        }),
        createButton("dictionary", {
          tag: "dictionary",
          promptTag: true,
          defaultSelection: true,
          msg,
        }),
      ],
      "forumToolbar"
    ),
    2
  );

  appendButton(
    "forumToolbarDecoration",
    createButton("center", {
      openWith: "[center]",
      closeWith: "[/center]",
      msg,
    }),
    1
  );
  appendButton(
    "forumToolbarDecoration",
    createButton("code", {
      tag: "code",
      promptTag: true,
      msg,
    }),
    2
  );
};
