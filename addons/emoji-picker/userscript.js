export default async function ({ addon, global, console }) {
  //Emojis
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

  //Functions

  //Function for showing the emoji picker
  const showEmojiPicker = function () {
    this.appendChild(emojiPicker);
    //Also add effect on emoji button
    this.children[0].classList.add("sa-emoji-button-selected");
  };

  //Function for inserting text into a textarea
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

  //Hide emoji picker when clicked outside of
  document.addEventListener("mouseup", function (event) {
    if (!emojiPicker.contains(event.target)) {
      emojiPicker.remove();
    }
    //Also deselect emoji buttons
    document
      .querySelectorAll(".sa-emoji-button.sa-emoji-button-selected")
      .forEach((e) => e.classList.remove("sa-emoji-button-selected"));
  });

  //Function for adding an emoji
  const addEmoji = function () {
    try {
      var textBox;
      if (addon.tab.clientVersion === "scratch-www") {
        //scratch-www
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
    } catch (error) {
      console.error("Error adding emoji:", error);
    }
  };

  //Addon

  //Create picker
  var emojiPicker = document.createElement("div");
  emojiPicker.id = "sa-emoji-picker";
  addon.tab.displayNoneWhileDisabled(emojiPicker, { display: "inline-block" });
  //Create picker items
  emojis.forEach((emoji) => {
    //Container for emoji picker item
    let container = document.createElement("span");
    container.classList.add("sa-emoji-picker-item");
    container.dataset.text = emoji.text;
    container.onclick = addEmoji;
    //The actual item
    let item = document.createElement("img");
    item.src = addon.tab.clientVersion === "scratch-www" ? emoji.image : emoji.imager2; //We have to do a check here so that better emojis works on the picker on profiles
    item.classList.add(addon.tab.clientVersion === "scratch-www" ? "emoji" : "easter-egg");
    item.classList.add("sa-emoji-picker-item-inner");
    //Append
    container.appendChild(item);
    emojiPicker.appendChild(container);
  });

  //Add emoji buttons
  while (true) {
    if (addon.tab.clientVersion === "scratch-www") {
      //scratch-www
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
    //The emoji button
    let emojiButton = document.createElement("div");
    emojiButton.classList.add("sa-emoji-button-container");
    if (addon.tab.clientVersion === "scratchr2") {
      //Special classes for 2.0 pages
      emojiButton.classList.add("button");
      emojiButton.classList.add("small");
      emojiButton.classList.add("sa-emoji-button-r2");
    } else {
      emojiButton.classList.add("sa-emoji-button-www");
    }
    emojiButton.onclick = showEmojiPicker;
    //Text inside the emoji button
    let emojiButtonText;
    if (addon.tab.clientVersion === "scratch-www") {
      //scratch-www
      emojiButtonText = document.createElement("button");
      emojiButtonText.classList.add("button");
    } else {
      //scratchr2
      emojiButtonText = document.createElement("a");
    }
    emojiButtonText.textContent = "🙂";
    emojiButtonText.title = "Button added by the Scratch Addons browser extension";
    emojiButtonText.classList.add("sa-emoji-button");
    emojiButton.appendChild(emojiButtonText);
    addon.tab.displayNoneWhileDisabled(emojiButton, { display: "inline-block" });
    //Append
    if (addon.tab.clientVersion === "scratch-www") {
      //scratch-www
      buttonAppend.appendChild(emojiButton);
    } else {
      //scratchr2
      buttonAppend.insertBefore(emojiButton, buttonAppend.querySelector(".notification"));
    }
  }
}
