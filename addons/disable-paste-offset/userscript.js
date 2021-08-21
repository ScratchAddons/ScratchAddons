export default async function ({ addon, console }) {
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({detail}) => {
    if (addon.self.disabled) return;
    if (detail.action.type === "scratch-paint/clipboard/SET" || detail.action.type === "scratch-paint/clipboard/INCREMENT_PASTE_OFFSET") {
      addon.tab.redux.state.scratchPaint.clipboard.pasteOffset = 0;
    }
  });
}
