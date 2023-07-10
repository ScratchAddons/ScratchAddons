export default async ({ addon, console, msg }) => {
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (addon.self.disabled || detail.action.type !== "timeout/SET_AUTOSAVE_TIMEOUT_ID") return;
    clearTimeout(detail.next.scratchGui.timeout.autoSaveTimeoutId);
    console.log("Pending autosave prevented.");
  });

  // If the addon is enable late, don't use the `waitForElement` below
  // because the `waitForElement` below only runs on certain redux events
  if (addon.self.enabledLate) {
    addListener(document.querySelector('[class*="community-button_community-button_"]'));
  }
  while (true) {
    const btn = await addon.tab.waitForElement('[class*="community-button_community-button_"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    addListener(btn);
  }

  function addListener(btn) {
    btn.addEventListener(
      "click",
      (e) => {
        // Don't show if it's on someone else's project page,
        // or if there are no changes.
        if (
          !addon.self.disabled &&
          addon.tab.redux.state.scratchGui.projectChanged &&
          document.querySelector('[class*="project-title-input_title-field_"]') &&
          !confirm(msg("save-and-leave"))
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true },
    );
  }
};
