/**
 * Formats profile comments by removing unnecessary spaces.
 * This modifies the element in-place.
 * @param {HTMLElement} comment - the element that contains text, i.e. div.content
 */
export default (comment) => {
  let nodes = comment.childNodes;
  for (let child of nodes) {
    if (child instanceof Text) {
      if (child === nodes[0]) {
        child.textContent = child.textContent.trimStart();
        if (!child.nextSibling) {
          child.textContent = child.textContent.trim();
        }
      } else {
        if (child === nodes[nodes.length - 1]) {
          child.textContent = child.textContent.trimEnd();
        }
        const firstA = Array.prototype.find.call(
          nodes,
          (n) => n instanceof HTMLAnchorElement && (!n.previousSibling || !n.previousSibling.textContent)
        );

        if (firstA && child.previousSibling === firstA) {
          if (child.textContent.startsWith("*")) {
            child.textContent = "* " + child.textContent.replace(/^\*\s*/, "");
          } else {
            child.textContent = " " + child.textContent.trimStart();
          }
        }
      }
    }
  }
};
