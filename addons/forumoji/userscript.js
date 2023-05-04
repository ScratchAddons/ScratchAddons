export default async function ({ addon, msg }) {
  const originalPostButton = document.querySelector("#djangobbwrap [method=post] [type=submit]");
  const addonPostButton = originalPostButton.cloneNode(true);
  const forumoji = await fetch("https://raw.githubusercontent.com/lopste/forumoji/main/resources/forumoji.json").then(
    (response) => response.json()
  );
  const editor = document.querySelector(".markItUpEditor");

  const emojiList = {};
  window.emojiList = emojiList;
  forumoji.emoji.forEach((emoji) => {
    emojiList[
      emoji.codepoint
        .replaceAll("U+", "")
        .split(" ")
        .map((codepoint) => String.fromCodePoint(parseInt(codepoint, 16)))
        .join("")
    ] = emoji.url;
  });

  addonPostButton.addEventListener("click", (e) => {
    e.preventDefault();
    Object.entries(emojiList).forEach(([emoji, image]) => {
      editor.value = editor.value.replaceAll(emoji, `[img]${image}[/img]`);
    });
    if (/\p{Extended_Pictographic}/u.test(editor.value)) {
      const notInForumojiSetting = addon.settings.get("not-in-forumoji");
      if (notInForumojiSetting === "remove" || (notInForumojiSetting === "ask" && confirm(msg("not-in-forumoji")))) {
        editor.value = editor.value.replaceAll(/\p{Extended_Pictographic}/ug, "");
        originalPostButton.click();
      }
    } else {
      originalPostButton.click();
    }
  });

  originalPostButton.parentElement.insertBefore(addonPostButton, originalPostButton);

  const enable = () => {
    addonPostButton.style.display = "";
    originalPostButton.style.display = "none";
  };
  addon.self.addEventListener("disabled", () => {
    addonPostButton.style.display = "none";
    originalPostButton.style.display = "";
  });
  addon.self.addEventListener("reenabled", enable);
  enable();
}
