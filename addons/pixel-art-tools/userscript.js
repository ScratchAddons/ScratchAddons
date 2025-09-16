import { createPaletteModule } from "./modules/palette.js";
import { createCanvasUtilsModule } from "./modules/canvas-utils.js";
import { createBrushControlsModule } from "./modules/brush-controls.js";
import { createPixelModeModule } from "./modules/pixel-mode.js";

const DEFAULT_SIZE = 64;

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function ({ addon, msg, console }) {
  const paper = await addon.tab.traps.getPaper();
  if (!addon.tab?.redux) {
    console.warn("pixel-art-tools: redux unavailable");
    return;
  }
  addon.tab.redux.initialize();

  const state = {
    enabled: false,
    palette: [],
    selectedPaletteIndex: -1,
    editingPaletteIndex: -1,
    pendingSize: { width: DEFAULT_SIZE, height: DEFAULT_SIZE },
    brushButtons: null,
    controlsGroup: null,
    palettePanel: null,
    paletteGrid: null,
    widthInput: null,
    heightInput: null,
    backgroundScaling: null,
    backgroundPosition: null,
    paletteNotice: null,
    toggleButton: null,
  };

  const redux = addon.tab.redux;

  // Initialize modules
  const canvasUtils = createCanvasUtilsModule(paper, state);
  const palette = createPaletteModule(addon, state, redux, msg);
  const brushControls = createBrushControlsModule(addon, state, redux);
  const pixelMode = createPixelModeModule(addon, state, redux, msg, canvasUtils, brushControls, palette);

  // Main Redux event handler for paint events
  redux.addEventListener("statechanged", ({ detail }) => {
    if (!detail || !detail.prev || !detail.next) return;

    if (detail.action.type === "scratch-paint/modes/CHANGE_MODE") {
      brushControls.updateBrushControlVisibility();
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
      brushControls.updateBrushSelection(nextSize);
    }
  });

  // Addon lifecycle events
  addon.self.addEventListener("disabled", pixelMode.handleDisabled);
  addon.self.addEventListener("reenabled", pixelMode.handleReenabled);

  // Initialize all components
  pixelMode.setupZoomControls();
  palette.setupPalettePanel();
  brushControls.setupBrushControls();
  palette.updatePaletteSelection();
}
