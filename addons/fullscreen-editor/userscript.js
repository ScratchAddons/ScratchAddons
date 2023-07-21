export default async function ({ addon, console, msg }) {
  const fullscreen = document.createElement("a");
  fullscreen.title = "Full screen"; // TODO: msg()
  fullscreen.className = addon.tab.scratchClass("menu-bar_menu-bar-item", "menu-bar_hoverable", {
    others: "sa-fullscreen-editor",
  });

  const changeStageMode = (newMode) => {
    const stageControls = document.querySelector(
      "[class*='stage-header_stage-size-toggle-group_'] > [class*='toggle-buttons_row_']"
    );
    const hideStageButton = stageControls.querySelector(".sa-hide-stage-button");
    const smallStageButton = stageControls.querySelectorAll(":scope > :not(.sa-hide-stage-button")[0];
    const largeStageButton = stageControls.lastChild;

    if (newMode === "hidden") {
      if (hideStageButton) hideStageButton.click();
      // Assume user will want to make the stage smaller if `hide-stage` not available.
      else smallStageButton.click();
    } else if (newMode === "small") smallStageButton.click();
    else if (newMode === "large") largeStageButton.click();
  };

  let oldStageMode = null;

  const enterFullscreen = () => {
    oldStageMode = document.body.classList.contains("sa-stage-hidden-outer")
      ? "hidden"
      : addon.tab.redux.state.scratchGui.stageSize.stageSize;

    document.body.requestFullscreen().then(() => {
      if (addon.settings.get("hideStage")) changeStageMode("hidden");
      else if (addon.settings.get("shrinkStage")) changeStageMode("small");

      document.body.classList.add("sa-fullscreen-editor");
    });
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    if (oldStageMode) {
      changeStageMode(oldStageMode);
      oldStageMode = null;
    }
    document.body.classList.remove("sa-fullscreen-editor");
  };

  fullscreen.addEventListener("click", (e) => {
    if (!document.fullscreenElement) enterFullscreen();
    else exitFullscreen();
  });

  document.addEventListener("fullscreenchange", (e) => {
    if (!document.fullscreenElement) {
      // User might have exited full-screen manually.
      // We still need to set the stage to large.
      exitFullscreen();
    }
  });

  // Exit full-screen if user clicks "See project page".
  addon.tab.addEventListener("urlChange", () => {
    if (addon.tab.editorMode === "projectpage") exitFullscreen();
    // TODO: compatibility with existing `fullscreen addon`
  });

  addon.tab.displayNoneWhileDisabled(fullscreen);

  while (true) {
    await addon.tab.waitForElement("[class^='menu-bar_account-info-group'] > [href^='/my']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    addon.tab.appendToSharedSpace({
      space: "beforeEditorProfile",
      element: fullscreen,
      order: 1,
    });
  }
}
