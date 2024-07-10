export default async function ({ addon, msg }) {
  const postButton = document.querySelector("#djangobbwrap [method=post] [type=submit]");
  const forumoji = Object.keys(
    await (await fetch("https://raw.githubusercontent.com/vercte/forumoji/main/assets/emoji.json")).json()
  ).map((codepoint) => [
    codepoint,
    codepoint
      .split("-")
      .map((part) => String.fromCodePoint(parseInt(part, 16)))
      .join(""),
  ]);
  const editor = document.querySelector(".markItUpEditor");

  postButton.addEventListener("click", (e) => {
    if (addon.self.disabled) {
      return;
    }
    forumoji.forEach(([codepoint, char]) => {
      editor.value = editor.value.replaceAll(char, `[img https://u.cubeupload.com/fmji/${codepoint}.png]`);
    });
    if (/\p{Extended_Pictographic}/u.test(editor.value)) {
      if (confirm(msg("not-in-forumoji"))) {
        editor.value = editor.value.replaceAll(/\p{Extended_Pictographic}/gu, "");
        return;
      }
      e.preventDefault();
    }
  });
}
