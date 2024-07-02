export default async function ({ addon, console, msg }) {
  const EMOJIS = [
    "aww-cat",
    "cat",
    "cool-cat",
    "fav-it-cat",
    "gobo",
    "huh-cat",
    "lol-cat",
    "love-it-cat",
    "meow",
    "pizza-cat",
    "rainbow-cat",
    "tongue-out-cat",
    "upside-down-cat",
    "waffle",
    "wink-cat",
  ];
  const WWW_COMMENTS_REGEX = /^https?:\/\/scratch.mit.edu\/images\/emoji\/(.*).png$/;
  const R2_COMMENTS_REGEX = /^https:\/\/cdn.scratch.mit.edu\/scratchr2\/static\/(.*)\/images\/easter_eggs\/(.*).png$/;
  const COMMENTS_REGEX = addon.tab.clientVersion === "scratch-www" ? WWW_COMMENTS_REGEX : R2_COMMENTS_REGEX;

  addon.self.addEventListener("disabled", () => {
    const emojis = document.querySelectorAll("img.easter-egg, img.emoji");
    for (const emoji of emojis) {
      if (EMOJIS.includes(emoji.dataset.saEmoji)) {
        // check if emoji is supported by this addon
        emoji.src =
          addon.tab.clientVersion === "scratch-www"
            ? `https://scratch.mit.edu/images/emoji/${emoji.dataset.saEmoji}.png`
            : `https://cdn.scratch.mit.edu/scratchr2/static/images/easter_eggs/${emoji.dataset.saEmoji}.png`;
      }
    }
  });
  addon.self.addEventListener("reenabled", () => {
    const emojis = document.querySelectorAll("img.easter-egg[data-sa-emoji], img.emoji[data-sa-emoji]");
    for (const emoji of emojis) {
      if (EMOJIS.includes(emoji.dataset.saEmoji)) {
        // check if emoji is supported by this addon
        emoji.src = addon.self.dir + "/images/" + emoji.dataset.saEmoji + ".svg";
      }
    }
  });
  while (true) {
    const emoji = await addon.tab.waitForElement(".emoji, .easter-egg", {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (location.pathname.startsWith("/messages")) {
          return state.messages?.status?.message === "FETCHED";
        }
        return state.comments?.status?.comments === "FETCHED";
      },
    });

    const match = emoji.src.match(COMMENTS_REGEX);
    if (match !== null) {
      const emojiId = match[addon.tab.clientVersion === "scratch-www" ? 1 : 2];
      if (EMOJIS.includes(emojiId)) {
        // check if emoji is supported by this addon
        if (!addon.self.disabled) emoji.src = addon.self.dir + "/images/" + emojiId + ".svg";
        emoji.dataset.saEmoji = emojiId;
      }
    }
  }
}
