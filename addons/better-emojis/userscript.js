export default async function ({ addon, global, console }) {
  const body = document.body;

  // Check if there are any emojis on the page when this script loads.
  // On Scratch 2.0-esque pages, emojis are given a different class and image directory than on Scratch 3.0-esque pages.

  // For 2.0 pages
  let emojis = document.getElementsByClassName("easter-egg");
  for (let emoji of emojis) {
    checkEmoji(emoji);
  }

  // For 3.0 pages
  emojis = document.getElementsByClassName("emoji");
  for (let emoji of emojis) {
    checkEmojiNew(emoji);
  }

  // Defines a MutationObserver to detect when new elements are added to the page.
  // A TreeWalker is used to navigate any new nodes and locate potential emojis.
  let obs = new MutationObserver(function (mutations, observer) {
    const treeWalker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT);
    let currentNode = treeWalker.currentNode;
    while (currentNode) {
      if (typeof currentNode.className === "string") {
        if (currentNode.className.includes("easter-egg")) checkEmoji(currentNode);
        else if (currentNode.className.includes("emoji")) checkEmojiNew(currentNode);
      }
      currentNode = treeWalker.nextNode();
    }
  });

  // Begins to observe the page.
  obs.observe(body, {
    childList: true,
    subtree: true,
  });

  // Sets the src of the given Scratch 2.0 cat emoji to a custom image
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
  }

  // Sets the src of the given Scratch 3.0 cat emoji to a custom image
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
    }
  }
}
