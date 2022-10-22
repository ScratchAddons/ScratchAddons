import { setupBetterQuoter } from "./module.js";
/* global copy_paste */
export default async function ({ addon, global, console }) {
  setupBetterQuoter(addon);
  /*let textarea = document.querySelector(".markItUpEditor");
  while (true) {
    let quoteButton = await addon.tab.waitForElement(".postquote a", { markAsSeen: true });
    quoteButton.setAttribute("onclick", "return false");
    quoteButton.addEventListener("mouseup", (e) => {
      let blockpost = quoteButton.closest(".blockpost");
      if (addon.self.disabled) return copy_paste(blockpost.id);
      let selection = window.getSelection();
      let selectionStr = selection.toString();
      if (
        selectionStr &&
        selection.anchorNode &&
        blockpost.contains(selection.anchorNode) &&
        selection.focusNode &&
        blockpost.contains(selection.focusNode)
      ) {
        window.paste(`[quote=${
          blockpost.querySelector(".black.username").innerText
        }]`);
        const quotePostNum = blockpost.querySelector("li[data-sa-shared-space-order=\"10\"]");
        if (quotePostNum) {
            quotePostNum.click();
        }
        window.paste(`\n${getSelectionBBCode()}[/quote]`);
      } else copy_paste(blockpost.id);
      window.location.hash = "#reply";
      textarea.focus();
    });
  }*/
}
