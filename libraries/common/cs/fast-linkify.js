// Note: the regex below contains catastrophic backtracking.
// However, if someone wanted to crash the website, there are many other (and better) ways.
// Note that the regex is grouped for split() support.
const getURLRegex = () => /((?:https?:\/\/)?(?:[\w-]+\.)+(?:xn--[a-zA-Z\d]+|[a-zA-Z]{2,})(?:\/[^\s"<>\\^`{|}]*)?)/g;

const _linkify = (child) => {
  if (!(child instanceof Text)) return;
  child.nodeValue.split(getURLRegex()).forEach((content, i) => {
    const isLink = i % 2;
    if (isLink) {
      const elem = document.createElement("a");
      elem.textContent = content;
      if (!/^https?:\/\//g.test(content)) {
        content = `http://${content}`;
      }
      elem.href = content;
      elem.rel = "noreferrer";
      child.parentNode.insertBefore(elem, child);
    } else {
      child.parentNode.insertBefore(document.createTextNode(content), child);
    }
  });
  child.remove();
};

/**
 * Linkify an element which uses either <br> or whitespace: pre-line to add linebreaks,
 * such as "About Me" or project descriptions.
 * @param {Element} elem - element to linkify to.
 */
export const linkifyTextNode = (elem) => {
  for (const child of elem.childNodes) {
    _linkify(child);
  }
};

/**
 * Linkify an element which uses tags around text, such as studio descriptions or project comments.
 * @param {Element} elem element to linkify to.
 */
export const linkifyTag = (elem, tagClass) => {
  for (const tag of elem.children) {
    if (tagClass && !(elem instanceof tagClass)) continue;
    for (const child of tag.childNodes) {
      _linkify(child);
    }
  }
};
