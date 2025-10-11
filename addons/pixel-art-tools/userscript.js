import { createPaletteModule } from "./modules/palette/index.js";
import { createCanvasAdjuster } from "./modules/canvas-adjuster.js";
import { createControlsModule } from "./modules/controls.js";
import { wrapAddCostumeWait, wrapCreateBitmapSkin } from "./modules/bitmap-loader.js";

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function ({ addon, msg, console }) {
  const paper = await addon.tab.traps.getPaper();
  const vm = addon.tab.traps.vm;
  if (!addon.tab?.redux) {
    console.warn("pixel-art-tools: redux unavailable");
    return;
  }
  addon.tab.redux.initialize();

  const state = {
    enabled: false,
    pixelModeDesired: addon.settings.get("enableByDefault"),
    palette: [],
    selectedPaletteIndex: -1,
    editingPaletteIndex: -1,
    pendingSize: { width: addon.settings.get("defaultWidth"), height: addon.settings.get("defaultHeight") },
    brushButtons: null,
    controlsGroup: null,
    palettePanel: null,
    paletteGrid: null,
    widthInput: null,
    heightInput: null,
    pixelGridOriginal: null,
    pixelGridOverlay: null,
    pixelCheckerboardSize: 1,
    paletteNotice: null,
    toggleButton: null,
  };

  const redux = addon.tab.redux;

  // Initialize modules
  const canvasAdjuster = createCanvasAdjuster(paper);
  const palette = createPaletteModule(addon, state, redux, msg);
  const controls = createControlsModule(addon, state, redux, msg, canvasAdjuster, palette);

  // Main Redux event handler for paint events
  redux.addEventListener("statechanged", ({ detail }) => {
    if (!detail || !detail.prev || !detail.next) return;
    if (detail.action.type === "scratch-paint/modes/CHANGE_MODE") {
      controls.updateBrushControlVisibility();
    }

    if (detail.action.type === "scratch-paint/view/UPDATE_VIEW_BOUNDS") {
      controls.updatePixelModeVisibility();
    }

    const prevColor = detail.prev.scratchPaint?.color?.fillColor?.primary;
    const nextColor = detail.next.scratchPaint?.color?.fillColor?.primary;
    if (prevColor !== nextColor) {
      // If we're editing a palette color, update it
      if (state.editingPaletteIndex >= 0) {
        palette.updatePaletteColorFromFill(nextColor);
      } else {
        // Otherwise, just update selection
        palette.updatePaletteSelection(nextColor);
      }
    }

    const prevSize = detail.prev.scratchPaint?.bitBrushSize;
    const nextSize = detail.next.scratchPaint?.bitBrushSize;
    if (prevSize !== nextSize) {
      controls.updateBrushSelection(nextSize);
    }
  });

  // Addon lifecycle events
  addon.self.addEventListener("disabled", () => {
    controls.handleDisabled();
  });
  addon.self.addEventListener("reenabled", () => {
    controls.handleReenabled();
  });

  // Initialize all components
  controls.setupControls();
  palette.setupPalettePanel();
  palette.updatePaletteSelection();

  setTimeout(() => {
    vm.renderer.createBitmapSkin = wrapCreateBitmapSkin(vm.runtime, vm.renderer.createBitmapSkin);
    vm.addCostume = wrapAddCostumeWait(addon, vm.addCostume);
  }, 100);
}
