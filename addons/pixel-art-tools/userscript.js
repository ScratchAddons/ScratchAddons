import { createPaletteModule } from "./modules/palette/index.js";
import { createCanvasAdjuster } from "./modules/canvas-adjuster.js";
import { createControlsModule } from "./modules/controls.js";
import { createAnimationPreview } from "./modules/animation-preview.js";
import { wrapAddCostumeWait } from "./modules/bitmap-loader.js";
import { createTextToolScaler } from "./modules/text-tool-scaler.js";
import { installRasterCropOverride } from "./modules/raster-crop-override.js";
import { installUpdateImageOverride } from "./modules/update-image-override.js";
import {
  eventTarget as compactEditorEventTarget,
  isCompactEditorActive,
} from "../editor-compact/state-events.js";

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

  /** @type {PixelArtState} */
  const state = {
    enabled: false,
    pixelModeDesired: false,
    palette: [],
    selectedPaletteIndex: -1,
    editingPaletteIndex: -1,
    pendingSize: { width: addon.settings.get("defaultWidth"), height: addon.settings.get("defaultHeight") },
    lastAppliedSize: {
      width: addon.settings.get("defaultWidth"),
      height: addon.settings.get("defaultHeight"),
    },
    restoreSizePending: false,
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
    paletteMessage: null,
    toggleButton: null,
    animationPanel: null,
  };

  const redux = addon.tab.redux;
  const updateCompactEditorState = () => {
    document.body.classList.toggle("sa-pixel-art-compact-editor", !addon.self.disabled && isCompactEditorActive());
  };

  // Initialize modules
  const canvasAdjuster = createCanvasAdjuster(addon, paper);
  const palette = createPaletteModule(addon, state, redux, msg);
  const animationPreview = createAnimationPreview(addon, state, msg);
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

    if (
      detail.action.type === "scratch-gui/navigation/ACTIVATE_TAB" ||
      detail.action.type === "scratch-gui/mode/SET_PLAYER" ||
      detail.action.type === "scratch-paint/formats/CHANGE_FORMAT"
    ) {
      updateCompactEditorState();
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

  // Settings change handler
  addon.settings.addEventListener("change", () => {
    state.pendingSize.width = addon.settings.get("defaultWidth");
    state.pendingSize.height = addon.settings.get("defaultHeight");
    if (state.widthInput) state.widthInput.value = state.pendingSize.width;
    if (state.heightInput) state.heightInput.value = state.pendingSize.height;
    controls.updatePixelModeVisibility();
  });

  // Initialize all components
  compactEditorEventTarget.addEventListener("change", updateCompactEditorState);
  updateCompactEditorState();
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
    vm.addCostume = wrapAddCostumeWait(addon, vm.addCostume, canvasAdjuster, state);
  }, 100);
}
