import { GradientModel, COLOR_ACTIONS } from "./gradient-model.js";
import { buildOverlay } from "./overlay.js";
import { setupFillToolHook } from "./fill-tool-hook.js";
import { setupStateHandlers } from "./state-handlers.js";

export default async function ({ addon, msg, console }) {
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");
  addon.tab.redux.initialize();

  // If the Redux store wasn't created yet when initialize() ran (runAtComplete:false timing),
  // target will be undefined. Retry once it becomes available so that all registered
  // addon.tab.redux.addEventListener("statechanged", ...) listeners start receiving events.
  if (!addon.tab.redux.initialized) {
    (async () => {
      while (!window.__scratchAddonsRedux?.target) {
        await new Promise((r) => setTimeout(r, 50));
      }
      addon.tab.redux.initialize();
    })();
  }

  const model = new GradientModel(addon, msg);
  setupStateHandlers(addon, model);
  setupFillToolHook(model, addon);

  // Lifecycle
  addon.self.addEventListener("disabled", () => {
    model.activeOverlay?.close();
    model.activeOverlay?.destroy();
    model.activeOverlay = null;
    // newItemPatcherActive is cleared by the loop itself on next rAF when it sees disabled.
  });
  addon.self.addEventListener("reenabled", () => {
    if (model.cachedPaper && !model.newItemPatcherActive) model.startNewItemPatcher();
  });

  // Cache paper.js early so the statechange handlers can fix MIXED
  // swatches even before the user opens a colour picker.
  // Also start the continuous new-item patcher which injects the full multi-stop
  // gradient into shapes as they are drawn live (see patchLayerItems in GradientModel).
  addon.tab.traps.getPaper().then((p) => {
    if (!model.cachedPaper) model.cachedPaper = p;
    if (!model.newItemPatcherActive) model.startNewItemPatcher();
  });

  addon.tab.scratchClassReady().then(() => {
    model.scratchClassReady = true;
    requestAnimationFrame(model.syncSwatches);
  });

  // Main loop
  while (true) {
    // 1. Wait until a gradient colour picker is open in the vector editor.
    await addon.tab.waitForElement('[class*="color-picker_gradient-swatches-row_"]', {
      markAsSeen: true,
      reduxCondition: (reduxState) => {
        if (reduxState.scratchGui.editorTab.activeTabIndex !== 1 || reduxState.scratchGui.mode.isPlayerOnly)
          return false;
        const fillGrad = reduxState.scratchPaint?.color?.fillColor?.gradientType;
        const strokeGrad = reduxState.scratchPaint?.color?.strokeColor?.gradientType;
        return fillGrad !== "SOLID" || strokeGrad !== "SOLID";
      },
    });

    // 2. Determine which modal (fill or stroke) triggered the open.
    const spModals = addon.tab.redux.state?.scratchPaint?.modals;
    const spColor = addon.tab.redux.state?.scratchPaint?.color;
    let colorModeNow;
    if (spModals?.fillColor && spColor?.fillColor?.gradientType !== "SOLID") {
      colorModeNow = "fill";
    } else if (spModals?.strokeColor && spColor?.strokeColor?.gradientType !== "SOLID") {
      colorModeNow = "stroke";
    } else {
      continue;
    }
    model.activeColorMode = colorModeNow;

    const colorStateNow = spColor[colorModeNow === "stroke" ? "strokeColor" : "fillColor"];
    if (!colorStateNow || colorStateNow.gradientType === "SOLID") continue;

    // 3. Tear down any overlay left over from a previous open.
    model.activeOverlay?.destroy();
    model.activeOverlay = null;

    // 4. Read current gradient state from paper.js.
    const paper = await addon.tab.traps.getPaper();
    model.cachedPaper = paper;
    // In fill mode there are no selected items, so readCurrentStops would wipe
    // extraStops. Keep the cached state from the last selected shape instead.
    const isFillMode = addon.tab.redux.state?.scratchPaint?.mode === "FILL";
    if (!isFillMode) {
      model.stops = model.readCurrentStops(paper);
      model.storedAngle = colorStateNow.gradientType === "VERTICAL" ? 90 : model.readCurrentAngle(paper);
    }

    // 5. Resolve gradient type — infer from paper.js when Redux shows MIXED (undefined).
    if (!colorStateNow.gradientType) {
      const items = paper.project.selectedItems.filter((i) => i.parent instanceof paper.Layer);
      const fg = items[0]?.[model.colorProp()];
      if (fg?.type !== "gradient") continue;
      const inferredType = fg.gradient.radial
        ? "RADIAL"
        : Math.abs(fg.destination.y - fg.origin.y) > Math.abs(fg.destination.x - fg.origin.x)
          ? "VERTICAL"
          : "HORIZONTAL";
      model.lastKnownGradientType = inferredType;
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS[model.activeColorMode].GRADIENT,
        gradientType: inferredType,
      });
    } else {
      model.lastKnownGradientType = colorStateNow.gradientType;
    }

    // 6. Build the SVG overlay on the canvas.
    const canvasContainer = document.querySelector("[class*='paint-editor_canvas-container_']");
    const overlayCanvas = canvasContainer?.querySelector("canvas");
    if (canvasContainer && overlayCanvas) {
      model.activeOverlay = buildOverlay(paper, canvasContainer, overlayCanvas, model);
    }

    // 7. Poll for picker close — scratch-paint doesn't always dispatch CLOSE_MODAL
    // (e.g. clicking outside the popover), but Redux modal state does update.
    const pollPickerClose = () => {
      const currentModals = addon.tab.redux.state?.scratchPaint?.modals;
      const stillOpen = model.activeColorMode === "stroke" ? currentModals?.strokeColor : currentModals?.fillColor;
      if (!stillOpen) {
        model.activeOverlay?.destroy();
        model.activeOverlay = null;
      } else {
        requestAnimationFrame(pollPickerClose);
      }
    };
    requestAnimationFrame(pollPickerClose);

    // 8. Warm up liveGradientItems and fix any MIXED swatches on reopen.
    // applyAllStops() wires the GradientStop→Item owner chain so the first handle
    // drag produces a live canvas redraw without needing a prior interaction.
    model.applyAllStops();
    const MIXED = "scratch-paint/style-path/mixed";
    const colorNow = addon.tab.redux.state?.scratchPaint?.color?.[model.colorProp()];
    if (colorNow?.primary === MIXED) {
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[model.activeColorMode].COLOR, color: model.c0hex });
    }
    if (colorNow?.secondary === MIXED) {
      addon.tab.redux.dispatch({ type: COLOR_ACTIONS[model.activeColorMode].COLOR2, color: model.c1hex });
    }

    // 9. Sync the overlay and swatches to the current state.
    requestAnimationFrame(model.syncUI);
  }
}
