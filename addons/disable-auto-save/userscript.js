export default async ({ addon, console }) => {
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "timeout/SET_AUTOSAVE_TIMEOUT_ID") return;
    clearTimeout(detail.next.scratchGui.timeout.autoSaveTimeoutId);
    console.log("Pending autosave prevented.");
  });
};
