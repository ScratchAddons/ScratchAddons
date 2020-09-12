export default async function ({ addon, global, console }) {
  while (true) {
    var element = await addon.tab.waitForElement(
      ".comment-content:not(.commentsLineBreaksViewed),.comment .content:not(.commentsLineBreaksViewed)"
    );
    element.style = "white-space:break-spaces;";

    for (var i = 0; i < element.childNodes.length; i++) {
      var thisNode = element.childNodes[i];
      var nextNode = element.childNodes[i + 1];

      if (thisNode.nodeType !== document.TEXT_NODE) {
        continue;
      }

      var content = thisNode.textContent;
      if (i === 0) { // First text node
        content = content.trimStart();
      }
      if (i === element.childNodes.length - 1) { // Last text node
        content = content.trimEnd();
      }
      if (element.closest(".reply") && i === 2) { // "First" text node in reply (comes after parent username link)
        content = " " + content.trimStart();
      }
      if (nextNode && nextNode.nodeType === document.ELEMENT_NODE && content.length) { // Text node before link
        content = content.slice(0, -1);
      }

      thisNode.textContent = content;
    }

    element.classList.add("commentsLineBreaksViewed");
  }
}
