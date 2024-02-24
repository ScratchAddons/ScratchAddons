/**
 * Used for the automatic browser full screen setting
 * and for hiding the scrollbar in full screen.
 */
export default async function ({ addon, console }) {
  // "Browser fullscreen" is defined as the mode that hides the browser UI.
  function updateBrowserFullscreen() {
    if (addon.settings.get("browserFullscreen") && !addon.self.disabled) {
      // If Scratch fullscreen is enabled, then browser fullscreen should also
      // be enabled, and vice versa for disabling.
      if (addon.tab.redux.state.scratchGui.mode.isFullScreen && document.fullscreenElement === null) {
        document.documentElement.requestFullscreen();
      } else if (!addon.tab.redux.state.scratchGui.mode.isFullScreen && document.fullscreenElement !== null) {
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
      if (document.fullscreenElement === null && addon.tab.redux.state.scratchGui.mode.isFullScreen) {
        addon.tab.redux.dispatch({
          type: "scratch-gui/mode/SET_FULL_SCREEN",
          isFullScreen: false,
        });
      }
    }
  }

  // The "phantom header" is a small strip at the top of the page that
  // brings the header into view when hovered.
  async function updatePhantomHeader() {
    if (
      !addon.self.disabled &&
      addon.tab.redux.state.scratchGui.mode.isFullScreen &&
      addon.settings.get("hideToolbar") &&
      addon.settings.get("hoverToolbar")
    ) {
      const canvas = await addon.tab.waitForElement('[class*="stage_full-screen"] canvas');
      const header = await addon.tab.waitForElement('[class^="stage-header_stage-header-wrapper"]');
      const phantom = header.parentElement.appendChild(document.createElement("div"));
      phantom.classList.add("phantom-header");

      // Make the header a child of the phantom, so that mouseleave will trigger when the
      // mouse leaves the header OR the phantom header.
      phantom.appendChild(header);

      phantom.addEventListener("mouseenter", () => {
        header.classList.add("stage-header-hover");
      });
      phantom.addEventListener("mouseleave", () => {
        header.classList.remove("stage-header-hover");
      });

      // Listen for when the mouse moves above the page (helps to show header when not in browser full screen mode)
      document.body.addEventListener("mouseleave", (e) => {
        if (e.clientY < 8) {
          header.classList.add("stage-header-hover");
        }
      });
      // and for when the mouse re-enters the page
      document.body.addEventListener("mouseenter", () => {
        header.classList.remove("stage-header-hover");
      });

      // Pass click events on the phantom header onto the project player, essentially making it click-through
      ["mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend", "wheel"].forEach((eventName) => {
        phantom.addEventListener(eventName, (e) => {
          if (e.target.classList.contains("phantom-header")) {
            canvas.dispatchEvent(new e.constructor(e.type, e));
          }
        });
      });
    } else {
      const header = await addon.tab.waitForElement('[class*="stage-header_stage-header-wrapper"]');
      if (header.parentElement.classList.contains("phantom-header")) {
        const phantom = header.parentElement;
        phantom.parentElement.appendChild(header);
        phantom.remove();
      }
    }
  }

  updatePhantomHeader();

  async function setPageScrollbar() {
    const body = await addon.tab.waitForElement(".sa-body-editor");
    if (addon.tab.redux.state.scratchGui.mode.isFullScreen) {
      body.classList.add("sa-fullscreen");
    } else {
      body.classList.remove("sa-fullscreen");
    }
  }

  // Properly resize the canvas and scale variable monitors on stage resize.
  let monitorScaler, resizeObserver, stage;
  async function initScaler() {
    monitorScaler = await addon.tab.waitForElement("[class*=monitor-list_monitor-list-scaler]");
    stage = await addon.tab.waitForElement('[class*="stage-wrapper_full-screen"] [class*="stage_stage"]');
    resizeObserver = new ResizeObserver(() => {
      const stageSize = stage.getBoundingClientRect();
      // When switching between project page and editor, the canvas
      // is removed from the DOM and inserted again in a different place.
      // This causes the size to be reported as 0x0.
      if (!stageSize.width || !stageSize.height) return;
      // Width and height attributes of the canvas need to match the actual size.
      const renderer = addon.tab.traps.vm.runtime.renderer;
      if (renderer) renderer.resize(stageSize.width, stageSize.height);
      // Scratch uses the `transform` CSS property on a stage overlay element
      // to control the scaling of variable monitors.
      const scale = stageSize.width / 480;
      monitorScaler.style.transform = `scale(${scale}, ${scale})`;
    });
    resizeObserver.observe(stage);
  }

  initScaler();

  // Running this on page load handles the case of the project initially
  // loading in Scratch fullscreen mode.
  setPageScrollbar();
  updateBrowserFullscreen();

  // Changing to or from Scratch fullscreen is signified by a state change
  // (URL change doesn't work when editing project without project page)
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/mode/SET_FULL_SCREEN") {
      initScaler();
      updateBrowserFullscreen();
      setPageScrollbar();
      updatePhantomHeader();
    }
  });
  // Changing to or from browser fullscreen is signified by a window resize.
  window.addEventListener("resize", () => {
    updateScratchFullscreen();
  });
  // Handles the case of F11 full screen AND document full screen being enabled
  // at the same time.
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement === null && addon.tab.redux.state.scratchGui.mode.isFullScreen) {
      addon.tab.redux.dispatch({
        type: "scratch-gui/mode/SET_FULL_SCREEN",
        isFullScreen: false,
      });
    }
  });

  // These handle the case of the user already being in Scratch fullscreen
  // (without being in browser fullscreen) when the addon or sync option are
  // dynamically enabled.
  addon.settings.addEventListener("change", () => {
    updateBrowserFullscreen();
    updatePhantomHeader();
  });
  addon.self.addEventListener("disabled", () => {
    resizeObserver.disconnect();
    updatePhantomHeader();
  });
  addon.self.addEventListener("reenabled", () => {
    resizeObserver.observe(stage);
    updateBrowserFullscreen();
    updatePhantomHeader();
  });
}
