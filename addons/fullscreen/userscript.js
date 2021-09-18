// Used for the automatic browser fullscreen setting
export default async function ({ addon, global, console }) {
  function updateBrowserFullscreen() {
    if (addon.settings.get("browserFullscreen")) {
      if (document.fullscreenElement === null && addon.tab.editorMode === "fullscreen") {
        document.documentElement.requestFullscreen();
      } else if (document.fullscreenElement !== null && addon.tab.editorMode !== "fullscreen") {
        document.exitFullscreen();
      }
    }
  }

  function updateScratchFullscreen() {
    if (addon.settings.get("browserFullscreen")) {
      let fullscreen;
      if (addon.settings.get("editorFullscreen")) {
        fullscreen = window.innerHeight == window.screen.height;
        console.log(window.innerHeight);
        console.log(window.screen.height);
      }
      if ((fullscreen || document.fullscreenElement !== null) && addon.tab.editorMode !== "fullscreen") {
        addon.tab.redux.dispatch({
          type: "scratch-gui/mode/SET_FULL_SCREEN",
          isFullScreen: true,
        });
      } else if ((!fullscreen || document.fullscreenElement === null) && addon.tab.editorMode === "fullscreen") {
        addon.tab.redux.dispatch({
          type: "scratch-gui/mode/SET_FULL_SCREEN",
          isFullScreen: false,
        });
      }
    }
  }

  addon.tab.addEventListener("urlChange", updateBrowserFullscreen);
  window.addEventListener("resize", updateScratchFullscreen);
  addon.settings.addEventListener("change", function () {
    updateBrowserFullscreen();
    updateScratchFullscreen();
  });
  addon.self.addEventListener("reenabled", function () {
    updateBrowserFullscreen();
    updateScratchFullscreen();
  });
}
