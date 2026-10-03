/** @param {AddonContext} param0 */
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
          const originalMetrics = originalGetMetrics.call(this);
          // Scroll limits are in workspace coordinates, independent of toolbox screen position.
          // Expand by half a viewport on each side — matches vertical which also uses viewHeight/2 per side.
          const extraLeft = originalMetrics.viewWidth / 2;
          const extraRight = originalMetrics.viewWidth / 2;
          const totalExtraWidth = extraLeft + extraRight + (originalMetrics.toolboxWidth || 0);
          const extraHeight = originalMetrics.viewHeight;

          if (Blockly.registry) {
            // New Blockly: scrollable area is defined by scrollWidth/scrollHeight/scrollLeft/scrollTop
            return {
              ...originalMetrics,
              scrollWidth: originalMetrics.scrollWidth + totalExtraWidth,
              scrollHeight: originalMetrics.scrollHeight + extraHeight,
              scrollLeft: originalMetrics.scrollLeft - extraLeft,
              scrollTop: originalMetrics.scrollTop - extraHeight / 2,
            };
          } else {
            // Old Blockly: scrollable area is defined by contentWidth/contentHeight/contentLeft/contentTop
            return {
              ...originalMetrics,
              contentWidth: originalMetrics.contentWidth + totalExtraWidth,
              contentHeight: originalMetrics.contentHeight + extraHeight,
              contentLeft: originalMetrics.contentLeft - extraLeft,
              contentTop: originalMetrics.contentTop - extraHeight / 2,
            };
          }
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
