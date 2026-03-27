export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const speeds = {
    none: "0s",
    short: "0.2s",
    default: "0.3s",
    long: "0.5s",
  };

  const getElementAtPoint = (e) => {
    e.target.style.pointerEvents = "none";
    const elementAtPoint = document.elementFromPoint(e.x, e.y);
    e.target.style.pointerEvents = "auto";
    return elementAtPoint;
  };

  const customZoomAreaElement = document.createElement("div");
  customZoomAreaElement.className = "sa-custom-zoom-area";
  customZoomAreaElement.addEventListener("mousedown", (e) => {
    // old Blockly
    getElementAtPoint(e).dispatchEvent(new MouseEvent("mousedown", e));
  });
  customZoomAreaElement.addEventListener("pointerdown", (e) => {
    // new Blockly
    getElementAtPoint(e).dispatchEvent(new PointerEvent("pointerdown", e));
  });
  customZoomAreaElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    getElementAtPoint(e).dispatchEvent(new WheelEvent("wheel", e));
  });

  let originalGetMetrics = null; // Store the original getMetrics function

  function update() {
    if (addon.tab.editorMode !== "editor") return;

    const workspace = addon.tab.traps.getWorkspace();
    const zoomOptions = workspace.options.zoom || workspace.options.zoomOptions; // new Blockly || old Blockly
    zoomOptions.maxScale = addon.settings.get("maxZoom") / 100;
    zoomOptions.minScale = addon.settings.get("minZoom") / 100;
    zoomOptions.startScale = addon.settings.get("startZoom") / 100;
    zoomOptions.scaleSpeed = 1 + 0.2 * (addon.settings.get("zoomSpeed") / 100);

    if (addon.settings.get("expandWorkspace")) {
      // Override getMetrics to return expanded scrollable area
      // Only override once to avoid multiple overrides
      if (!originalGetMetrics && workspace.getMetrics) {
        // Backup the original method
        originalGetMetrics = workspace.getMetrics;

        // Override with our expanded version
        workspace.getMetrics = function () {
          // Get the original metrics
          const originalMetrics = originalGetMetrics.call(this);

          // Add half a screen width and height to each side of the content area
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          const extraWidth = screenWidth; // Half screen on each side = full screen total
          const extraHeight = screenHeight; // Half screen on each side = full screen total

          // Expand the content area - this is what defines the scrollable boundaries
          return {
            ...originalMetrics,
            // Expand content dimensions
            contentWidth: originalMetrics.contentWidth + extraWidth,
            contentHeight: originalMetrics.contentHeight + extraHeight,
            // Shift content position to center the original content in the expanded area
            contentLeft: originalMetrics.contentLeft - extraWidth / 2,
            contentTop: originalMetrics.contentTop - extraHeight / 2,
            // Keep all other properties (view, toolbox, etc.) unchanged
          };
        };

        // Force Blockly to recalculate and redraw scrollbars with new metrics
        workspace.resizeContents();
        if (workspace.scrollbar) {
          workspace.scrollbar.resize();
        }
        // Also trigger a resize event to update everything
        workspace.resize();
      }
    } else if (originalGetMetrics) {
      // Restore original getMetrics if we had overridden it before
      workspace.getMetrics = originalGetMetrics;
      originalGetMetrics = null;

      // Force refresh when restoring original metrics too
      workspace.resizeContents();
      if (workspace.scrollbar) {
        workspace.scrollbar.resize();
      }
      workspace.resize();
    }

    const autohide = addon.settings.get("autohide");
    const blocklySvg = document.querySelector(".blocklySvg");
    blocklySvg.classList.toggle("sa-custom-zoom-autohide", autohide);
    if (autohide) {
      blocklySvg.style.setProperty("--sa-custom-zoom-speed", speeds[addon.settings.get("speed")]);
      blocklySvg.insertAdjacentElement("beforebegin", customZoomAreaElement);
    }
  }

  if (document.querySelector('[class*="backpack_backpack-container_"]')) {
    window.dispatchEvent(new Event("resize"));
  }

  if (!addon.self.enabledLate) {
    const workspace = addon.tab.traps.getWorkspace();
    workspace.scale = addon.settings.get("startZoom") / 100;
  }

  addon.settings.addEventListener("change", update);
  while (true) {
    const selector = Blockly.registry ? ".blocklyZoomReset" : ".blocklyZoom";
    await addon.tab.waitForElement(selector, {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/settings/SET_COLOR_MODE",
        "scratch-gui/settings/SET_THEME",
        "fontsLoaded/SET_FONTS_LOADED",
      ],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    update();
  }
}
