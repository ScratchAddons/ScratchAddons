/**
 *
 * @param {import("../../addon-api/content-script/typedef.js").UserscriptUtilities} param0
 */
export default async function ({ addon, console, msg }) {
  const fullscreen = document.createElement("a");
  fullscreen.title = msg("fullscreen");
  fullscreen.className = addon.tab.scratchClass("menu-bar_menu-bar-item", "menu-bar_hoverable", {
    others: "sa-fullscreeneditor",
  });

  let isFullscreen = false;

  const enterFullscreen = () => {
    document.body.requestFullscreen();
    if (addon.settings.get("shrinkStage")) {
      if (!addon.settings.get("hide")) {
        addon.tab.redux.dispatch({
          type: "scratch-gui/StageSize/SET_STAGE_SIZE",
          stageSize: "small",
        });
      } else {
        document.querySelector(".sa-hide-stage-button").click();
      }
    }
  };

  const exitFullscreen = () => {
    document.exitFullscreen();
    if (addon.settings.get("shrinkStage")) {
      if (!addon.settings.get("hide")) {
        addon.tab.redux.dispatch({
          type: "scratch-gui/StageSize/SET_STAGE_SIZE",
          stageSize: "large",
        });
      } else {
        document.querySelector('[class*="stage-header_stage-button-last_"]').click();
      }
    }
    isFullscreen = false;
  };

  fullscreen.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isFullscreen) enterFullscreen();
    else exitFullscreen();
  });
  document.addEventListener("fullscreenchange", (e) => {
    if (isFullscreen) exitFullscreen();
    isFullscreen = !!document.fullscreenElement;
  });
  addon.tab.addEventListener("urlChange", exitFullscreen);

  addon.tab.displayNoneWhileDisabled(fullscreen);

  while (true) {
    let nav = await addon.tab.waitForElement("[class^='menu-bar_account-info-group'] > [href^='/my']", {
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
