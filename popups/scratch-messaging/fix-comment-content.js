import commentEmojis from "../../addons/scratch-notifier/comment-emojis.js";
import { linkifyTextNode, pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";
import formatProfileComments from "../../libraries/common/cs/format-profile-comments.js";

const parser = new DOMParser();

export default (value, enabledAddons) => {
  const shouldLinkify = enabledAddons.includes("more-links");
  const shouldInsertLinebreak = enabledAddons.includes("comments-linebreaks");
  let node;
  if (value instanceof Node) {
    // profile
    node = value.cloneNode(true);
    if (shouldInsertLinebreak) formatProfileComments(node);
  } else {
    // JSON API
    const fragment = parser.parseFromString(value.trim(), "text/html");
    node = fragment.body;
  }
  node.normalize();
  for (let i = node.childNodes.length; i--; ) {
    const item = node.childNodes[i];
    let collapsed = item.textContent;
    if (!shouldInsertLinebreak) {
      collapsed = collapsed.replace(/\s+/g, " ");
    }
    if (i === 0) {
      collapsed = collapsed.trimStart();
    }
    if (i === node.childNodes.length - 1) {
      collapsed = collapsed.trimEnd();
    }
    item.textContent = collapsed;
    if (item instanceof Text && item.textContent === "") {
      item.remove();
    } else if (item instanceof HTMLAnchorElement && item.getAttribute("href").startsWith("/")) {
      item.href = "https://scratch.mit.edu" + item.getAttribute("href");
    } else if (item instanceof HTMLImageElement) {
      const splitString = item.src.split("/");
      const imageName = splitString[splitString.length - 1];
      if (commentEmojis[imageName]) item.replaceWith(commentEmojis[imageName]);
    }
  }
  if (shouldLinkify) {
    linkifyTextNode(node);
  }
  pingifyTextNode(node);
  return node;
};
