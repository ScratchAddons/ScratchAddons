export default async function ({ addon, global, console }) {
  while (true) {
    var element = await addon.tab.waitForElement(
      ".comment-content:not(.commentsLineBreaksViewed),.comment .content:not(.commentsLineBreaksViewed)"
    );
    element.style = "white-space:break-spaces;";

    for (var i = 0; i < element.childNodes.length; i++) {
      var thisNode = element.childNodes[i];
      var lastNode = element.childNodes[i - 1];
      var nextNode = element.childNodes[i + 1];

      if (thisNode.nodeType !== document.TEXT_NODE) {
        continue;
      }

      var content = thisNode.textContent.trim();
      if (lastNode && lastNode.nodeType === document.ELEMENT_NODE) {
        content = " " + content;
      }
      if (nextNode && nextNode.nodeType === document.ELEMENT_NODE) {
        if (content.length > 0) {
          content = content + " ";
        }
      }
      thisNode.textContent = content;
    }

    element.classList.add("commentsLineBreaksViewed");
  }
}
