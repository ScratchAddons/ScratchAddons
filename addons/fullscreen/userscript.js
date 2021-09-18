// Used for the automatic browser fullscreen setting.
export default async function ({ addon, global, console }) {
  // "Browser fullscreen" is defined as the fullscreen normally toggled by F11
  // or the fullscreen option in the hamburger menu.
  function updateBrowserFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If Scratch fullscreen is enabled, then browser fullscreen should also
      // be enabled.
      if (addon.tab.editorMode === "fullscreen" && window.innerHeight !== window.screen.height) {
        document.documentElement.requestFullscreen();
        // Likewise, if Scratch fullscreen is disabled, then browser fullscreen
        // should also be disabled.
      } else if (addon.tab.editorMode !== "fullscreen") {
        document.exitFullscreen().catch((err) => {
          return;
        });
      }
    }
  }

  // "Scratch fullscreen" is defined as the fullscreen normally toggled by the
  // rightmost button above the stage.
  function updateScratchFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If browser fullscreen is enabled, then Scratch fullscreen should also
      // be enabled.
      // Also respect the setting to make the editor not respond to F11.
      if (
        !(addon.settings.get("editorFullscreen") && addon.tab.editorMode === "editor") &&
        (window.innerHeight === window.screen.height || document.fullscreenElement !== null) &&
        addon.tab.editorMode !== "fullscreen"
      ) {
        addon.tab.redux.dispatch({
          type: "scratch-gui/mode/SET_FULL_SCREEN",
          isFullScreen: true,
        });
        // Likewise, if browser fullscreen is disabled, then Scratch fullscreen
        // should also be disabled.
      } else if (
        (!(window.innerHeight === window.screen.height || document.fullscreenElement !== null) ||
          document.fullscreenElement === null) &&
        addon.tab.editorMode === "fullscreen"
      ) {
        addon.tab.redux.dispatch({
          type: "scratch-gui/mode/SET_FULL_SCREEN",
          isFullScreen: false,
        });
      }
    }
  }

  // Running this on page load handles the case of the project initially
  // loading in Scratch fullscreen mode.
  updateBrowserFullscreen();

  // Changing to or from Scratch fullscreen is signified by a URL change
  addon.tab.addEventListener("urlChange", updateBrowserFullscreen);
  // Changing to or from browser fullscreen is signified by a window resize
  window.addEventListener("resize", updateScratchFullscreen);
  // These handle the case of the user already being in Scratch fullscreen
  // (without being in browser fullscreen) when the addon or sync option are
  // dynamically enabled.
  addon.settings.addEventListener("change", function () {
    updateBrowserFullscreen();
    updateScratchFullscreen();
  });
  addon.self.addEventListener("reenabled", function () {
    updateBrowserFullscreen();
    updateScratchFullscreen();
  });
}
