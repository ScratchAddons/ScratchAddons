/**
 * Used for the automatic browser fullscreen setting.
 */
export default async function ({ addon, global, console }) {
  // "Browser fullscreen" is defined as the mode that hides the browser UI.
  function updateBrowserFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If Scratch fullscreen is enabled, then browser fullscreen should also
      // be enabled, and vice versa for disabling.
      if (addon.tab.redux.state.scratchGui.mode.isFullScreen && window.innerHeight !== window.screen.height) {
        document.documentElement.requestFullscreen();
      } else if (!addon.tab.redux.state.scratchGui.mode.isFullScreen) {
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
        addon.tab.redux.state.scratchGui.mode.isFullScreen
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

  // Changing to or from Scratch fullscreen is signified by a state change
  // (URL change doesn't work when editing project without project page)
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/mode/SET_FULL_SCREEN") updateBrowserFullscreen();
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
  });
  addon.self.addEventListener("reenabled", () => {
    updateBrowserFullscreen();
  });
  // Properly scale variable monitors on window resize
  let canvas = await addon.tab.waitForElement("canvas");
  setInterval(() => {
    document.querySelector("[class*=monitor-list_monitor-list-scaler]").style.transform = `scale(${
      canvas.getBoundingClientRect().width / 480
    }, ${canvas.getBoundingClientRect().width / 480})`;
  }, 10);
}
