export default async function ({ addon, global, console }) {
  const updateEmojis = () => {
    if (addon.tab.clientVersion === "scratch-www") {
      if (addon.tab.redux?.state?.scratchGui && !addon.tab.redux.state.scratchGui.mode.isPlayerOnly) {
        return;
      }
      const emojis = document.getElementsByClassName("emoji");
      for (const emoji of emojis) {
        checkEmojiNew(emoji);
      }
    } else if (addon.tab.clientVersion === "scratchr2") {
      const emojis = document.getElementsByClassName("easter-egg");
      for (const emoji of emojis) {
        checkEmoji(emoji);
      }
    }
  };

  updateEmojis();
  const obs = new MutationObserver(updateEmojis);
  obs.observe(document.body, {
    childList: true,
    subtree: true,
  });

  function checkEmoji(el) {
    if (el.src.includes("images/easter_eggs/cat.png")) el.src = addon.self.dir + "/images/cat.svg";
    if (el.src.includes("images/easter_eggs/aww-cat.png")) el.src = addon.self.dir + "/images/aww-cat.svg";
    if (el.src.includes("images/easter_eggs/cool-cat.png")) el.src = addon.self.dir + "/images/cool-cat.svg";
    if (el.src.includes("images/easter_eggs/tongue-out-cat.png"))
      el.src = addon.self.dir + "/images/tongue-out-cat.svg";
    if (el.src.includes("images/easter_eggs/wink-cat.png")) el.src = addon.self.dir + "/images/wink-cat.svg";
    if (el.src.includes("images/easter_eggs/lol-cat.png")) el.src = addon.self.dir + "/images/lol-cat.svg";
    if (el.src.includes("images/easter_eggs/upside-down-cat.png"))
      el.src = addon.self.dir + "/images/upside-down-cat.svg";
    if (el.src.includes("images/easter_eggs/huh-cat.png")) el.src = addon.self.dir + "/images/cute-cat.svg";
    if (el.src.includes("images/easter_eggs/love-it-cat.png")) el.src = addon.self.dir + "/images/love-it-cat.svg";
    if (el.src.includes("images/easter_eggs/fav-it-cat.png")) el.src = addon.self.dir + "/images/fav-it-cat.svg";
    if (el.src.includes("images/easter_eggs/rainbow-cat.png")) el.src = addon.self.dir + "/images/rainbow-cat.svg";
    if (el.src.includes("images/easter_eggs/pizza-cat.png")) el.src = addon.self.dir + "/images/pizza-cat.svg";
    if (el.src.includes("images/easter_eggs/meow.png")) el.src = addon.self.dir + "/images/meow.svg";
    if (el.src.includes("images/easter_eggs/gobo.png")) el.src = addon.self.dir + "/images/gobo.svg";
    if (el.src.includes("images/easter_eggs/waffle.png")) el.src = addon.self.dir + "/images/waffle.svg";
  }

  function checkEmojiNew(el) {
    switch (el.src) {
      case "https://scratch.mit.edu/images/emoji/cat.png":
        el.src = addon.self.dir + "/images/cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/aww-cat.png":
        el.src = addon.self.dir + "/images/aww-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/cool-cat.png":
        el.src = addon.self.dir + "/images/cool-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/tongue-out-cat.png":
        el.src = addon.self.dir + "/images/tongue-out-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/wink-cat.png":
        el.src = addon.self.dir + "/images/wink-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/lol-cat.png":
        el.src = addon.self.dir + "/images/lol-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/upside-down-cat.png":
        el.src = addon.self.dir + "/images/upside-down-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/huh-cat.png":
        el.src = addon.self.dir + "/images/cute-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/love-it-cat.png":
        el.src = addon.self.dir + "/images/love-it-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/fav-it-cat.png":
        el.src = addon.self.dir + "/images/fav-it-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/rainbow-cat.png":
        el.src = addon.self.dir + "/images/rainbow-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/pizza-cat.png":
        el.src = addon.self.dir + "/images/pizza-cat.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/meow.png":
        el.src = addon.self.dir + "/images/meow.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/gobo.png":
        el.src = addon.self.dir + "/images/gobo.svg";
        break;
      case "https://scratch.mit.edu/images/emoji/waffle.png":
        el.src = addon.self.dir + "/images/waffle.svg";
        break;
    }
  }
}
