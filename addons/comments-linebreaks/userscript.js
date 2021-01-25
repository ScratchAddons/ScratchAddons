export default async function ({ addon, global, console }) {
  while (true) {
    let comment = await addon.tab.waitForElement(".comment .content, .comment-content", { markAsSeen: true });
    comment.style.whiteSpace = "break-spaces";
    if (!comment.classList.contains("comment-content")) {
      for (let child of comment.childNodes)
        if (child.nodeName === "#text") {
          child.textContent = child.textContent.trim();
          if (child.textContent.length) {
            if (
              child.previousSibling &&
              child.previousSibling.tagName === "A" &&
              child.previousSibling === comment.childNodes[1]
            )
              child.textContent = " " + child.textContent;
            if (child.nextSibling && child.nextSibling.tagName === "A") child.textContent += " ";
          }
        }
    }
  }
}
