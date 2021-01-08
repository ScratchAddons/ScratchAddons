/* global copy_paste */
export default async function ({ addon, global, console }) {
  let textarea = document.querySelector(".markItUpEditor");
  while (true) {
    let quoteButton = await addon.tab.waitForElement(".postquote a", { markAsSeen: true });
    quoteButton.setAttribute("onclick", "return false");
    quoteButton.addEventListener("mouseup", (e) => {
      let blockpost = quoteButton.closest(".blockpost");
      let selection = window.getSelection();
      let selectionStr = selection.toString();
      if (
        selectionStr &&
        selection.anchorNode &&
        blockpost.contains(selection.anchorNode) &&
        selection.focusNode &&
        blockpost.contains(selection.focusNode)
      )
        textarea.value += `[quote=${blockpost.querySelector(".black.username").innerText}]${selectionStr}[/quote]`;
      else copy_paste(blockpost.id);
      textarea.scrollIntoView(false);
      textarea.focus();
    });
  }
}
