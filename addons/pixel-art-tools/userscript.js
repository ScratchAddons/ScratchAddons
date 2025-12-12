import { createPaletteModule } from "./modules/palette/index.js";
import { createCanvasAdjuster } from "./modules/canvas-adjuster.js";
import { createControlsModule } from "./modules/controls.js";
import { createAnimationPreview } from "./modules/animation-preview.js";
import { wrapAddCostumeWait } from "./modules/bitmap-loader.js";
import { createTextToolScaler } from "./modules/text-tool-scaler.js";
import { installRasterCropOverride } from "./modules/raster-crop-override.js";

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function ({ addon, msg, console }) {
  const paper = await addon.tab.traps.getPaper();
  const vm = addon.tab.traps.vm;
  if (!addon.tab?.redux) {
    console.warn("pixel-art-tools: redux unavailable");
    return;
  }
  addon.tab.redux.initialize();
  await addon.tab.loadScript("/libraries/thirdparty/cs/gif.js");

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
    animationPanel: null,
  };

  const redux = addon.tab.redux;

  // Initialize modules
  const canvasAdjuster = createCanvasAdjuster(addon, paper);
  const palette = createPaletteModule(addon, state, redux, msg);
  const animationPreview = createAnimationPreview(addon, state, msg);
  const controls = createControlsModule(
    addon,
    state,
    redux,
    msg,
    canvasAdjuster,
    palette,
    animationPreview,
    paper
  );
  const textToolScaler = createTextToolScaler(addon, paper);
  installRasterCropOverride(addon, state, paper);

  // Main Redux event handler for paint events
  redux.addEventListener("statechanged", ({ detail }) => {
    if (!detail || !detail.prev || !detail.next) return;
    if (detail.action.type === "scratch-paint/modes/CHANGE_MODE") {
      controls.updateBrushControlVisibility();
      textToolScaler.onModeChanged(detail.action.mode);
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

  // Settings change handler
  addon.settings.addEventListener("change", () => {
    state.pendingSize.width = addon.settings.get("defaultWidth");
    state.pendingSize.height = addon.settings.get("defaultHeight");
    if (state.widthInput) state.widthInput.value = state.pendingSize.width;
    if (state.heightInput) state.heightInput.value = state.pendingSize.height;
    controls.updatePixelModeVisibility();
  });

  // Initialize all components
  controls.setupControls();
  palette.setupPalettePanel();
  palette.updatePaletteSelection();
  animationPreview.setupPanel();
  textToolScaler.onModeChanged(redux.state.scratchPaint?.mode);

  // Auto-add colors to palette when drawing
  const DRAWING_MODES = ["BIT_BRUSH", "BIT_LINE", "BIT_RECT", "BIT_OVAL", "BIT_FILL"];
  paper.view.on("mouseup", () => {
    if (addon.self.disabled || !state.enabled) return;
    const mode = redux.state.scratchPaint?.mode;
    if (DRAWING_MODES.includes(mode)) {
      palette.addPaletteColor(null, { silent: true });
    }
  });

  setTimeout(() => {
    vm.addCostume = wrapAddCostumeWait(addon, vm.addCostume, canvasAdjuster);
  }, 100);
}
