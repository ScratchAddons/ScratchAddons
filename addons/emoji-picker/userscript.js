import { emojis, unicodeEmojis } from "./emojis.js";
export default async function ({ addon, console, msg }) {
  let lastParent = null;
  //Functions
  const setEmojiPickerPos = function () {
    emojiPicker.classList.remove("sa-emoji-picker-offscreen");
    //scratchr2 makes the body and root <html>'s height value the size of the screen somehow so this has to be done
    const realDocumentBody =
      addon.tab.clientVersion === "scratchr2" ? document.querySelector("#pagewrapper") : document.body;
    if (emojiPicker.getBoundingClientRect().bottom > realDocumentBody.getBoundingClientRect().bottom - 48) {
      //Emoji picker may be partially hidden, move up
      emojiPicker.classList.add("sa-emoji-picker-offscreen");
    }
  };

  const showEmojiPicker = function (event) {
    if (!event.target.classList.contains("sa-emoji-button")) return; //Only attempt to show when clicking button, not picker
    unicodeContainer.style.display = "none";
    pickerDivider.style.display = "none";
    if (lastParent === this) {
      lastParent = null;
      return;
    }
    setSeeMoreText();

    this.appendChild(emojiPicker);

    setEmojiPickerPos();
  };

  const insertTextToTextArea = function (insertText, textBox) {
    if (textBox.selectionStart === textBox.value.length && textBox.selectionEnd === textBox.value.length) {
      //Cursor is at the end
      if (
        !(textBox.value[textBox.value.length - 1] === " ") &&
        !(textBox.value[textBox.value.length - 1] === undefined)
      ) {
        insertText = " " + insertText;
      }
      textBox.value += insertText;
    } else {
      //Cursor is somewhere else or is selecting a part of the textbox
      if (!(textBox.value[textBox.selectionStart] === " ")) {
        insertText = " " + insertText;
      }
      if (!(textBox.value[textBox.selectionEnd - 1] === " ")) {
        insertText += " ";
      }
      textBox.value =
        textBox.value.substring(0, textBox.selectionStart) +
        insertText +
        textBox.value.substring(textBox.selectionEnd - 1, textBox.value.length);
    }
  };
  document.addEventListener("mouseup", function (event) {
    if (!emojiPicker.contains(event.target)) {
      lastParent = emojiPicker.parentElement;
      emojiPicker.remove();
    }
  });

  const addEmoji = function () {
    const textBox =
      addon.tab.clientVersion === "scratch-www"
        ? this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(
            'textarea[id*="frc-compose-comment"]'
          )
        : this.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(
            ".control-group.tooltip.right > textarea"
          );
    insertTextToTextArea(this.dataset.text, textBox);
    //Simulate inputting so that Scratch doesn't consider
    //emojis added from an empty comment using this button
    //as an empty comment
    textBox.dispatchEvent(new Event("input", { bubbles: true }));
  };

  //Addon
  //Create the emoji picker
  const emojiPicker = document.createElement("div");
  emojiPicker.className = "sa-emoji-picker";
  addon.tab.displayNoneWhileDisabled(emojiPicker);

  //Scratch emojis
  emojis.forEach((emoji) => {
    const container = document.createElement("span");
    container.classList.add("sa-emoji-picker-item");
    container.dataset.text = emoji.text;
    container.title = emoji.text;
    container.onclick = addEmoji;
    const item = document.createElement("img");
    item.src = addon.tab.clientVersion === "scratch-www" ? emoji.image : emoji.imager2; //We have to do a check here so that better emojis works on the picker on profiles
    item.classList.add(
      addon.tab.clientVersion === "scratch-www" ? "emoji" : "easter-egg",
      "sa-emoji-picker-item-inner"
    );
    container.appendChild(item);
    emojiPicker.appendChild(container);
  });

  //Unicode emojis
  const unicodeContainer = document.createElement("div");
  unicodeContainer.classList.add("sa-emoji-picker-unicode");
  const pickerDivider = document.createElement("div");
  pickerDivider.classList.add("sa-emoji-picker-divider");
  pickerDivider.style.display = "none";
  emojiPicker.appendChild(pickerDivider);

  unicodeEmojis.forEach((emoji) => {
    if (emoji === "br") {
      const br = document.createElement("br");
      br.classList.add("sa-emoji-picker-break");
      unicodeContainer.appendChild(br);
    } else {
      const container = document.createElement("span");
      container.classList.add("sa-emoji-picker-item");
      container.dataset.text = emoji;
      container.onclick = addEmoji;
      const item = document.createElement("span");
      item.textContent = emoji;
      item.classList.add("sa-emoji-picker-item-inner");
      container.appendChild(item);
      unicodeContainer.appendChild(container);
    }
  });
  unicodeContainer.style.display = "none";
  emojiPicker.appendChild(unicodeContainer);

  const seeMoreButton = document.createElement("button");
  seeMoreButton.type = "button";
  seeMoreButton.classList.add("sa-emoji-picker-see-more", "button", "small");
  const setSeeMoreText = function () {
    seeMoreButton.textContent = unicodeContainer.style.display === "none" ? msg("show-more") : msg("show-less");
  };
  seeMoreButton.onclick = function () {
    unicodeContainer.style.display = unicodeContainer.style.display === "none" ? "block" : "none";
    pickerDivider.style.display = unicodeContainer.style.display;
    setSeeMoreText();
    setEmojiPickerPos();
  };
  setSeeMoreText();
  emojiPicker.appendChild(seeMoreButton);

  //Add emoji buttons
  while (true) {
    const textBox =
      addon.tab.clientVersion === "scratch-www"
        ? await addon.tab.waitForElement('textarea[id*="frc-compose-comment"]', {
            markAsSeen: true,
            reduxCondition: (state) => {
              if (!state.scratchGui) return true;
              return state.scratchGui.mode.isPlayerOnly;
            },
          })
        : await addon.tab.waitForElement("form > .control-group.tooltip.right > textarea", {
            markAsSeen: true,
          });
    const buttonAppend = textBox.parentElement.parentElement.parentElement.querySelector(
      ".compose-limit, .control-group.tooltip.right + .control-group"
    );

    const emojiButton = document.createElement("div");
    emojiButton.classList.add("sa-emoji-button-container");
    if (addon.tab.clientVersion === "scratchr2") {
      //Special classes for scratchr2 pages
      emojiButton.classList.add("button", "small", "sa-emoji-button-r2");
    } else {
      emojiButton.classList.add("sa-emoji-button-www");
    }
    emojiButton.onclick = showEmojiPicker;

    let emojiButtonText;
    if (addon.tab.clientVersion === "scratch-www") {
      emojiButtonText = document.createElement("button");
      emojiButtonText.classList.add("button");
    } else {
      emojiButtonText = document.createElement("a");
    }
    emojiButtonText.textContent = "🙂︎";
    emojiButtonText.classList.add("sa-emoji-button");
    emojiButton.appendChild(emojiButtonText);
    addon.tab.displayNoneWhileDisabled(emojiButton);
    if (addon.tab.clientVersion === "scratch-www") {
      buttonAppend.appendChild(emojiButton);
    } else {
      buttonAppend.appendChild(emojiButton);
    }
  }
}
