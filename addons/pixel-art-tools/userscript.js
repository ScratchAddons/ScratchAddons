import { createPaletteModule } from "./modules/palette/index.js";
import { createCanvasAdjuster } from "./modules/canvas-adjuster.js";
import { createControlsModule } from "./modules/controls.js";
import { createAnimationPreview } from "./modules/animation-preview.js";
import { wrapAddCostumeWait } from "./modules/bitmap-loader.js";
import { createTextToolScaler } from "./modules/text-tool-scaler.js";
import { installRasterCropOverride } from "./modules/raster-crop-override.js";
import { installUpdateImageOverride } from "./modules/update-image-override.js";
import { eventTarget as compactEditorEventTarget, isCompactEditorActive } from "../editor-compact/state-events.js";

/** @typedef {import("./modules/types.js").PixelArtState} PixelArtState */

/** @type {(api: import("../../addon-api/content-script/typedef").UserscriptUtilities) => Promise<void>} */
export default async function ({ addon, msg, console }) {
  const paper = await addon.tab.traps.getPaper();
  const vm = addon.tab.traps.vm;
  if (!addon.tab?.redux) {
    console.warn("pixel-art-tools: redux unavailable");
    return;
  }
  addon.tab.redux.initialize();
  await addon.tab.scratchClassReady();
  await addon.tab.loadScript("/libraries/thirdparty/cs/gif.js");
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");

  /** @type {PixelArtState} */
  const state = {
    enabled: false,
    pixelModeDesired: addon.settings.get("enableByDefault"),
    palette: [],
    projectPalettes: [],
    selectedPaletteId: null,
    paletteDropdown: null,
    palettePanelReady: null,
    teardownVmListeners: null,
    selectedPaletteIndex: -1,
    editingPaletteIndex: -1,
    pendingSize: { width: addon.settings.get("defaultWidth"), height: addon.settings.get("defaultHeight") },
    // Rollback target if Scratch tries to auto-crop the bitmap smaller than the
    // current pixel canvas during an update-image pass.
    lastSafeSize: {
      width: addon.settings.get("defaultWidth"),
      height: addon.settings.get("defaultHeight"),
    },
    restoreSafeSizePending: false,
    brushButtons: null,
    controlsGroup: null,
    sizeControls: null,
    palettePanel: null,
    paletteGrid: null,
    widthInput: null,
    heightInput: null,
    pixelGridOriginal: null,
    pixelGridOverlay: null,
    pixelCheckerboardSize: 1,
    paletteNotice: null,
    paletteMessage: null,
    toggleButton: null,
    animationPanel: null,
    updateImageActive: false,
  };

  const redux = addon.tab.redux;
  const updateCompactEditorState = () => {
    document.body.classList.toggle("sa-pixel-art-compact-editor", !addon.self.disabled && isCompactEditorActive());
  };

  // Initialize modules
  const canvasAdjuster = createCanvasAdjuster(addon, paper);
  const palette = createPaletteModule(addon, state, redux, msg, console);
  const animationPreview = createAnimationPreview(addon, state, msg, console);
  const controls = createControlsModule(addon, state, redux, msg, canvasAdjuster, palette, animationPreview, paper);
  const textToolScaler = createTextToolScaler(addon, paper);
  installRasterCropOverride(addon, state, paper);
  installUpdateImageOverride(addon, state, paper);

  // Main Redux event handler for paint events
  redux.addEventListener("statechanged", ({ detail }) => {
    if (!detail || !detail.prev || !detail.next) return;
    if (detail.action.type === "scratch-paint/modes/CHANGE_MODE") {
      controls.updateBrushControlVisibility();
      textToolScaler.onModeChanged(detail.action.mode);
    }

    if (
      detail.action.type === "scratch-paint/view/UPDATE_VIEW_BOUNDS" ||
      detail.action.type === "scratch-gui/navigation/ACTIVATE_TAB" ||
      detail.action.type === "scratch-gui/mode/SET_PLAYER"
    ) {
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
    document.body.classList.remove("sa-pixel-art-compact-editor");
    controls.handleDisabled();
  });
  addon.self.addEventListener("reenabled", () => {
    updateCompactEditorState();
    controls.handleReenabled();
  });

  // Initialize all components
  compactEditorEventTarget.addEventListener("change", updateCompactEditorState);
  updateCompactEditorState();
  controls.setupControls();
  vm.on("targetsUpdate", controls.onTargetsUpdate);
  palette.setupPalettePanel();
  palette.updatePaletteSelection();
  animationPreview.setupPanel();
  textToolScaler.onModeChanged(redux.state.scratchPaint?.mode);

  setTimeout(() => {
    vm.addCostume = wrapAddCostumeWait(addon, vm.addCostume, canvasAdjuster, state);
  }, 100);
}
