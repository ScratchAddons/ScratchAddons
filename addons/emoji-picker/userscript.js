export default async function ({ addon, global, console, msg }) {
  const emojis = [
    {
      text: "_meow_",
      image: "/images/emoji/meow.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/meow.png",
    },
    {
      text: "_gobo_",
      image: "/images/emoji/gobo.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/gobo.png",
    },
    {
      text: "_:)_",
      image: "/images/emoji/cat.png",
      imager2: "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/cat.png",
    },
    {
      text: "_:D_",
      image: "/images/emoji/aww-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/aww-cat.png",
    },
    {
      text: "_B)_",
      image: "/images/emoji/cool-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/cool-cat.png",
    },
    {
      text: "_:P_",
      image: "/images/emoji/tongue-out-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/tongue-out-cat.png",
    },
    {
      text: "_;P_",
      image: "/images/emoji/wink-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/wink-cat.png",
    },
    {
      text: "_:'P_",
      image: "/images/emoji/lol-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/lol-cat.png",
    },
    {
      text: "_P:_",
      image: "/images/emoji/upside-down-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/upside-down-cat.png",
    },
    {
      text: "_:3_",
      image: "/images/emoji/huh-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/huh-cat.png",
    },
    {
      text: "_<3_",
      image: "/images/emoji/love-it-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/love-it-cat.png",
    },
    {
      text: "_**_",
      image: "/images/emoji/fav-it-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/fav-it-cat.png",
    },
    {
      text: "_:))_",
      image: "/images/emoji/rainbow-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/rainbow-cat.png",
    },
    {
      text: "_:D<_",
      image: "/images/emoji/pizza-cat.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/pizza-cat.png",
    },
    {
      text: "_10mil_",
      image: "/images/emoji/10mil.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/10mil.png",
    },
    {
      text: "_waffle_",
      image: "/images/emoji/waffle.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/waffle.png",
    },
    {
      text: "_taco_",
      image: "/images/emoji/taco.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/taco.png",
    },
    {
      text: "_sushi_",
      image: "/images/emoji/sushi.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/sushi.png",
    },
    {
      text: "_apple_",
      image: "/images/emoji/apple.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/apple.png",
    },
    {
      text: "_broccoli_",
      image: "/images/emoji/broccoli.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/broccoli.png",
    },
    {
      text: "_pizza_",
      image: "/images/emoji/pizza.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/pizza.png",
    },
    {
      text: "_candycorn_",
      image: "/images/emoji/candycorn.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/candycorn.png",
    },
    {
      text: "_map_",
      image: "/images/emoji/map.png",
      imager2: "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/map.png",
    },
    {
      text: "_camera_",
      image: "/images/emoji/camera.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/camera.png",
    },
    {
      text: "_suitcase_",
      image: "/images/emoji/suitcase.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/suitcase.png",
    },
    {
      text: "_compass_",
      image: "/images/emoji/compass.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/compass.png",
    },
    {
      text: "_binoculars_",
      image: "/images/emoji/binoculars.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/binoculars.png",
    },
    {
      text: "_cupcake_",
      image: "/images/emoji/cupcake.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/cupcake.png",
    },
    {
      text: "_pride_",
      image: "/images/emoji/pride.png",
      imager2:
        "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/pride.png",
    },
    {
      text: "_blm_",
      image: "/images/emoji/blm.png",
      imager2: "//cdn.scratch.mit.edu/scratchr2/static/__9e4044de46c7852aec750b6571cceb92__/images/easter_eggs/blm.png",
    },
  ];
  //Scratch only supports Unicode emojis inside the Basic Multilingual Plane.
  //This array contains all of those emojis.
  //"br" is automatically converted to a line break.
  const unicodeEmojis = [
    "⌚️",
    "⏰",
    "⏱️",
    "⏲️",
    "⌨️",
    "☎️",
    "⌛️",
    "⚖️",
    "⚙️",
    "✉️",
    "✂️",
    "✒️",
    "☂️",
    "✏️",
    "☕️",
    "♟️",
    "⚰️",
    "⚱️",
    "⛏️",
    "⚔️",
    "⚒️",
    "⛓️",
    "⚗️",
    "⛑️",
    "br",
    "⭐️",
    "✨",
    "⚡️",
    "☄️",
    "☀️",
    "⛅️",
    "☁️",
    "⛈️",
    "⛄️",
    "❄️",
    "☔️",
    "☘️",
    "br",
    "☹️",
    "✌️",
    "☝️",
    "✍️",
    "✋",
    "☺️",
    "br",
    "⚽️",
    "⚾️",
    "⛳️",
    "⛹️",
    "⛷️",
    "⛸️",
    "br",
    "✈️",
    "⛵️",
    "Ⓜ️",
    "⚓️",
    "⛽️",
    "⛲️",
    "⛺️",
    "⛪️",
    "⛰️",
    "⛱️",
    "⛴️",
    "⛩️",
    "♨️",
    "br",
    "❗️",
    "❕",
    "❓",
    "❔",
    "©️",
    "®️",
    "‼️",
    "⁉️",
    "™️",
    "➕",
    "➖",
    "➗",
    "✖️",
    "⛔",
    "⭕",
    "❌",
    "✔️",
    "〰️",
    "〽️",
    "⚠️",
    "br",
    "☑️",
    "✅",
    "❎",
    "▶️",
    "⏩",
    "⏪",
    "⏫",
    "⏬",
    "ℹ️",
    "⏭️",
    "⏮️",
    "⏯️",
    "⏏️",
    "◀️",
    "➡️",
    "⬅️",
    "⬆️",
    "⬇️",
    "↗️",
    "↘️",
    "↙️",
    "↖️",
    "↪️",
    "↩️",
    "⤴️",
    "⤵️",
    "✳️",
    "✴️",
    "❇️",
    "㊗️",
    "㊙️",
    "br",
    "⚕️",
    "☦️",
    "♾️",
    "⚛️",
    "⛎️",
    "✝️",
    "☪️",
    "☮️",
    "☯️",
    "☸️",
    "♈️",
    "♉️",
    "♊️",
    "♋️",
    "♌️",
    "♍️",
    "♎️",
    "♏️",
    "♐️",
    "♑️",
    "♒️",
    "♓️",
    "br",
    "❤️",
    "❣️",
    "♠️",
    "♣️",
    "♥️",
    "♦️",
    "♀️",
    "♂️",
    "♻️",
    "☢️",
    "☣️",
    "⚜️",
    "➰️",
    "➿️",
    "☠️",
    "br",
    "⬛️",
    "⬜️",
    "⚪️",
    "⚫️",
    "▪️",
    "▫️",
    "◻️",
    "◼️",
    "◽️",
    "◾️",
  ];

  const emojiPickerOffset = addon.tab.clientVersion === "scratchr2" ? 30 : 48;

  //Functions

  const setEmojiPickerPos = function () {
    emojiPicker.style.top = emojiPickerOffset + "px";
    //scratchr2 makes the body and root <html>'s height value the size of the screen somehow so I have to do this
    let realDocumentBody =
      addon.tab.clientVersion === "scratchr2" ? document.querySelector("#pagewrapper") : document.body;
    if (emojiPicker.getBoundingClientRect().bottom > realDocumentBody.getBoundingClientRect().bottom - 48) {
      //Emoji picker may be partially hidden, move up
      emojiPicker.style.top = -emojiPicker.getBoundingClientRect().height + "px";
    }
  };

  const showEmojiPicker = function (event) {
    if (!event.target.classList.contains("sa-emoji-button")) return; //Only attempt to show when clicking button, not picker
    unicodeContainer.style.display = "none";
    pickerDivider.style.display = "none";

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
      emojiPicker.remove();
    }
  });

  const addEmoji = function () {
    try {
      var textBox;
      if (addon.tab.clientVersion === "scratch-www") {
        textBox =
          this.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(
            'textarea[id*="frc-compose-comment"]'
          );
      } else {
        //scratchr2
        textBox = this.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(
          ".control-group.tooltip.right > textarea"
        );
      }
      insertTextToTextArea(this.dataset.text, textBox);
      //Simulate inputting so that Scratch doesn't consider
      //emojis added from an empty comment using this button
      //as an empty comment
      textBox.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (error) {}
  };

  //Addon

  //Create the emoji picker
  var emojiPicker = document.createElement("div");
  emojiPicker.id = "sa-emoji-picker";
  addon.tab.displayNoneWhileDisabled(emojiPicker, { display: "inline-block" });

  //Scratch emojis
  emojis.forEach((emoji) => {
    let container = document.createElement("span");
    container.classList.add("sa-emoji-picker-item");
    container.dataset.text = emoji.text;
    container.title = emoji.text;
    container.onclick = addEmoji;
    let item = document.createElement("img");
    item.src = addon.tab.clientVersion === "scratch-www" ? emoji.image : emoji.imager2; //We have to do a check here so that better emojis works on the picker on profiles
    item.classList.add(
      addon.tab.clientVersion === "scratch-www" ? "emoji" : "easter-egg",
      "sa-emoji-picker-item-inner"
    );
    container.appendChild(item);
    emojiPicker.appendChild(container);
  });

  //Unicode emojis
  let unicodeContainer = document.createElement("div");
  unicodeContainer.classList.add("sa-emoji-picker-unicode");
  let pickerDivider = document.createElement("div");
  pickerDivider.classList.add("sa-emoji-picker-divider");
  pickerDivider.style.display = "none";
  emojiPicker.appendChild(pickerDivider);

  unicodeEmojis.forEach((emoji) => {
    if (emoji === "br") {
      let br = document.createElement("br");
      br.classList.add("sa-emoji-picker-break");
      unicodeContainer.appendChild(br);
    } else {
      let container = document.createElement("span");
      container.classList.add("sa-emoji-picker-item");
      container.dataset.text = emoji;
      container.onclick = addEmoji;
      let item = document.createElement("span");
      item.textContent = emoji;
      item.classList.add("sa-emoji-picker-item-inner");
      container.appendChild(item);
      unicodeContainer.appendChild(container);
    }
  });
  unicodeContainer.style.display = "none";
  emojiPicker.appendChild(unicodeContainer);

  var seeMoreButton = document.createElement("button");
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
    if (addon.tab.clientVersion === "scratch-www") {
      var textBox = await addon.tab.waitForElement('textarea[id*="frc-compose-comment"]', {
        markAsSeen: true,
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
      });
    } else {
      //scratchr2
      var textBox = await addon.tab.waitForElement("form > .control-group.tooltip.right > textarea", {
        markAsSeen: true,
      });
    }
    const buttonAppend = textBox.parentElement.parentElement.parentElement.querySelector(
      ".compose-limit, .control-group.tooltip.right + .control-group"
    );

    let emojiButton = document.createElement("div");
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
      //scratchr2
      emojiButtonText = document.createElement("a");
    }
    emojiButtonText.textContent = "🙂";
    emojiButtonText.title = msg("emoji-button-hover");
    emojiButtonText.classList.add("sa-emoji-button");
    emojiButton.appendChild(emojiButtonText);
    addon.tab.displayNoneWhileDisabled(emojiButton, { display: "inline-block" });
    if (addon.tab.clientVersion === "scratch-www") {
      buttonAppend.appendChild(emojiButton);
    } else {
      //scratchr2
      buttonAppend.insertBefore(emojiButton, buttonAppend.querySelector(".notification"));
    }
  }
}
