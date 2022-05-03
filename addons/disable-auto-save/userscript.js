/**
 * @param {import("../types").UserscriptUtilities} param0
 */
export default async ({ addon, console, msg }) => {
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "timeout/SET_AUTOSAVE_TIMEOUT_ID") return;
    clearTimeout(detail.next.scratchGui.timeout.autoSaveTimeoutId);
    console.log("Pending autosave prevented.");
  });
  while (true) {
    const btn = await addon.tab.waitForElement('[class*="community-button_community-button_"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    btn.addEventListener(
      "click",
      (e) => {
        // Don't show if it's on someone else's project page,
        // or if there are no changes.
        if (
          addon.tab.redux.state.scratchGui.projectChanged &&
          document.querySelector('[class*="project-title-input_title-field_"]') &&
          !confirm(msg("save-and-leave"))
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true }
    );
  }
};
