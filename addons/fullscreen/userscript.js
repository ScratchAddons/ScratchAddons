/**
 * Used for the automatic browser fullscreen setting.
 */
export default async function ({ addon, global, console }) {
  // "Browser fullscreen" is defined as the mode that hides the browser UI.
  function updateBrowserFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If Scratch fullscreen is enabled, then browser fullscreen should also
      // be enabled, and vice versa for disabling.
      if (addon.tab.editorMode === "fullscreen" && window.innerHeight !== window.screen.height) {
        document.documentElement.requestFullscreen();
      } else if (addon.tab.editorMode !== "fullscreen") {
        document.exitFullscreen();
      }
    }
  }

  // "Scratch fullscreen" is defined as the mode normally toggled by the
  // rightmost button above the stage.
  function updateScratchFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If browser fullscreen is disabled, then Scratch fullscreen should also
      // be disabled.
      if (
        (document.fullscreenElement === null || window.innerHeight !== window.screen.height) &&
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
  addon.tab.addEventListener("urlChange", () => {
    updateBrowserFullscreen();
  });
  // Changing to or from browser fullscreen is signified by a window resize
  window.addEventListener("resize", () => {
    updateScratchFullscreen();
  });
  // These handle the case of the user already being in Scratch fullscreen
  // (without being in browser fullscreen) when the addon or sync option are
  // dynamically enabled.
  addon.settings.addEventListener("change", () => {
    updateBrowserFullscreen();
    updateScratchFullscreen();
  });
  addon.self.addEventListener("reenabled", () => {
    updateBrowserFullscreen();
    updateScratchFullscreen();
  });
}
