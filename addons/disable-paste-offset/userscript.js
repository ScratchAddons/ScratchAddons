export default async function ({ addon, console }) {
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (addon.self.disabled) return;
    if (
      detail.action.type === "scratch-paint/clipboard/SET" ||
      detail.action.type === "scratch-paint/clipboard/INCREMENT_PASTE_OFFSET"
    ) {
      addon.tab.redux.dispatch({ type: "scratch-paint/clipboard/CLEAR_PASTE_OFFSET" });
    }
  });
  addon.self.addEventListener("disabled", () => {
    addon.tab.redux.dispatch({ type: "scratch-paint/clipboard/CLEAR_PASTE_OFFSET" });
    addon.tab.redux.dispatch({ type: "scratch-paint/clipboard/INCREMENT_PASTE_OFFSET" });
  });
  addon.self.addEventListener("reenabled", () => {
    addon.tab.redux.dispatch({ type: "scratch-paint/clipboard/CLEAR_PASTE_OFFSET" });
  });
  if (addon.self.enabledLate) {
    addon.tab.redux.dispatch({ type: "scratch-paint/clipboard/CLEAR_PASTE_OFFSET" });
  }
}
