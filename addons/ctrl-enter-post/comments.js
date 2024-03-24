export default async function ({ addon, console, msg }) {
  let isScratchR2 = addon.tab.clientVersion === "scratchr2";

  let textboxSelector = isScratchR2 ? "textarea[name='content']" : "[name='compose-comment']";

  while (true) {
    let textbox = await addon.tab.waitForElement(textboxSelector, {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
    });
    var button;
    if (isScratchR2) {
      button = textbox.parentNode.parentNode.querySelector(".control-group:not(.tooltip) div[data-control='post'] a");
    } else {
      button = textbox.parentNode.parentNode.parentNode.querySelector(".compose-bottom-row .compose-post");
    }

    textbox.addEventListener("keydown", (e) => {
      if (!addon.self.disabled && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
        button.click();
      }
    });
  }
}
