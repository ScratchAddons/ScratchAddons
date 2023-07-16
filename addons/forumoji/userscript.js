export default async function ({ addon, msg }) {
  const postButton = document.querySelector("#djangobbwrap [method=post] [type=submit]");
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

  postButton.addEventListener("click", (e) => {
    if (addon.self.disabled) {
      return;
    }
    Object.entries(emojiList).forEach(([emoji, image]) => {
      editor.value = editor.value.replaceAll(emoji, `[img]${image}[/img]`);
    });
    if (/\p{Extended_Pictographic}/u.test(editor.value)) {
      if (confirm(msg("not-in-forumoji"))) {
        editor.value = editor.value.replaceAll(/\p{Extended_Pictographic}/gu, "");
      } else {
        e.preventDefault();
      }
    } else {
      e.preventDefault();
    }
  });
}
