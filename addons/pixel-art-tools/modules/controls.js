import { createElement as el } from "./create-element.js";

const BRUSH_SIZES = [1, 2, 3, 4];

/** @typedef {import("./types.js").PixelArtState} PixelArtState */

/**
 * @param {PixelArtState} state
 */
export function createControlsModule(
  addon,
  state,
  redux,
  msg,
  canvasAdjuster,
  palette,
  animationPreview,
  paper = null
) {
  let lastCostumeKey = null;
  let sizeDirty = false;

  const isBitmap = () => redux.state.scratchPaint?.format?.startsWith("BITMAP");
  const isCostumeEditorActive = () =>
    redux.state.scratchGui?.editorTab?.activeTabIndex === 1 && !redux.state.scratchGui?.mode?.isPlayerOnly;

  // Read the active costume once so pixel mode can derive its default canvas size
  // from the real bitmap dimensions and notice when Scratch has switched costumes.
  const getCostumeInfo = () => {
    const vm = addon.tab.traps.vm;
    // There may be no editing target while a project is loading or being replaced.
    const target = vm.editingTarget;
    const targetId = target?.id || null;
    const costumeIndex = target?.currentCostume ?? null;
    const costume = target?.sprite?.costumes?.[target.currentCostume];
    if (!costume?.size) return { key: null, size: null };
    // Scratch reports resolution-1 bitmaps at half the pixel dimensions we want
    // to use as the pixel-mode canvas baseline, so normalize them here.
    const mul = costume.bitmapResolution === 1 ? 2 : 1;
    const size = { width: Math.round(costume.size[0] * mul), height: Math.round(costume.size[1] * mul) };
    // Treat the active costume as changed if Scratch switches slots or replaces
    // the underlying asset in-place without moving it in the costume list.
    const key = `${targetId}:${costumeIndex}:${costume.md5}:${size.width}:${size.height}`;
    return { key, size };
  };

  const updatePixelModeState = (enabled) => {
    state.enabled = enabled;
    document.body.classList.toggle("sa-pixel-art-mode-active", enabled);
    Object.assign(state.controlsGroup.dataset, { enabled });
    Object.assign(state.toggleButton.dataset, { active: enabled });
    state.toggleButton.setAttribute("aria-pressed", enabled);
    // displayNoneWhileDisabled handles the addon lifecycle; these classes handle
    // pixel mode independently, including vector costumes and other editor tabs.
    state.palettePanel.classList.toggle("sa-pixel-art-hidden", !enabled);
    state.sizeControls.classList.toggle("sa-pixel-art-hidden", !enabled);
    animationPreview?.[enabled ? "show" : "hide"]();
  };

  const updateBrushSelection = (size) =>
    [...state.brushButtons.children].forEach((btn) => (btn.dataset.selected = +btn.dataset.size === size));

  const setPixelMode = (enabled) => {
    state.pixelModeDesired = enabled;
    if (enabled && !canvasAdjuster.isReady()) return;
    if (state.enabled === enabled) return;
    updatePixelModeState(enabled);
    if (enabled) {
      state.lastSafeSize = { width: state.pendingSize.width, height: state.pendingSize.height };
      canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height, { fitView: true });
      redux.dispatch({ type: "scratch-paint/brush-mode/CHANGE_BIT_BRUSH_SIZE", brushSize: 1 });
      updateBrushSelection(1);
    } else {
      canvasAdjuster.disable();
      palette.updatePaletteSelection();
    }
    updateBrushControlVisibility();
  };

  const updateBrushControlVisibility = async () => {
    const { mode, format } = redux.state.scratchPaint;
    const show = (mode === "BIT_BRUSH" || mode === "BIT_LINE") && format?.startsWith("BITMAP") && state.enabled;
    state.brushButtons.dataset.visible = show;
    if (show) {
      const input = await addon.tab.waitForElement("[class*='mode-tools'] input[type='number']", {
        reduxCondition: (s) => s.scratchPaint?.mode === mode,
      });
      input.classList.add("sa-pixel-art-hide-when-pixel");
    } else {
      document
        .querySelector("[class*='mode-tools'] input[type='number']")
        ?.classList.remove("sa-pixel-art-hide-when-pixel");
    }
  };

  const computeDesiredSize = (size) => {
    return size
      ? { width: Math.max(1, size.width), height: Math.max(1, size.height) }
      : { width: addon.settings.get("defaultWidth"), height: addon.settings.get("defaultHeight") };
  };

  const applySizeToInputs = (width, height) => {
    Object.assign(state.pendingSize, { width, height });
    if (state.widthInput) state.widthInput.value = width;
    if (state.heightInput) state.heightInput.value = height;
  };

  const updatePixelModeVisibility = () => {
    if (!state.controlsGroup) return;
    if (addon.self.disabled || !isCostumeEditorActive() || !canvasAdjuster.isReady()) {
      canvasAdjuster.disable();
      updatePixelModeState(false);
      updateBrushControlVisibility();
      return;
    }
    const bitmap = isBitmap();
    state.controlsGroup.classList.toggle("sa-pixel-art-hidden", !bitmap);

    if (!bitmap && state.enabled) {
      updatePixelModeState(false);
      canvasAdjuster.disable();
      updateBrushControlVisibility();
    } else if (state.restoreSafeSizePending && state.lastSafeSize) {
      // raster-crop-override can request a one-shot rollback to the last safe
      // applied size if Scratch tries to auto-shrink the canvas around content.
      state.restoreSafeSizePending = false;
      const { width, height } = state.lastSafeSize;
      applySizeToInputs(width, height);
      if (state.enabled) {
        canvasAdjuster.enable(width, height);
      }
    } else if (bitmap) {
      const { key, size } = getCostumeInfo();
      const desired = computeDesiredSize(size);

      // UPDATE_VIEW_BOUNDS runs before the VM finishes encoding the bitmap.
      // Only sync when the costume data changes, not on every view update with
      // the old dimensions. targetsUpdate notifies us when encoding completes,
      // regardless of image size or device speed.
      const costumeChanged = key && key !== lastCostumeKey;

      if (state.pixelModeDesired && !state.enabled) {
        if (costumeChanged) {
          applySizeToInputs(desired.width, desired.height);
          sizeDirty = false;
        }
        lastCostumeKey = key;
        setPixelMode(true);
        return;
      }

      if (costumeChanged) {
        applySizeToInputs(desired.width, desired.height);
        sizeDirty = false;
      }
      lastCostumeKey = key;

      if (state.enabled) {
        canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
        state.lastSafeSize = { width: state.pendingSize.width, height: state.pendingSize.height };
      }
    }
  };

  const onTargetsUpdate = () => {
    // Running scripts also emit targetsUpdate for position and other sprite
    // properties. Only refresh for costume changes while the editor is mounted.
    if (addon.self.disabled || !isCostumeEditorActive() || !isBitmap() || !canvasAdjuster.isReady()) return;
    if (state.restoreSafeSizePending || getCostumeInfo().key !== lastCostumeKey) {
      updatePixelModeVisibility();
    }
  };

  const createInput = (dimension) => {
    const input = el("input", {
      type: "number",
      min: "2",
      max: "1024",
      step: "2",
      value: state.pendingSize[dimension],
      className: addon.tab.scratchClass("input_input-form", "input_input-small"),
    });

    const normalizeAndStore = () => {
      if (input.value === "") {
        sizeDirty = true;
        return;
      }
      const parsed = Number(input.value);
      if (!Number.isFinite(parsed)) return;
      state.pendingSize[dimension] = parsed;
      sizeDirty = true;
    };

    const commitSizeIfDirty = () => {
      if (!sizeDirty) return;
      sizeDirty = false;
      if (input.value === "") {
        input.value = state.pendingSize[dimension];
        return;
      }
      let value = Math.max(1, Math.min(1024, +input.value || 1));
      // Let users type freely, then snap on commit so the stored half-size stays valid.
      // Scratch stores these bitmap costumes at half the pixel-mode canvas size.
      // That means the visible canvas dimensions must stay even, otherwise the
      // stored costume size would need fractional halving that Scratch cannot represent.
      if (state.enabled && isBitmap() && value % 2 === 1) value = Math.min(1024, value + 1);
      state.pendingSize[dimension] = value;
      input.value = value;
      lastCostumeKey = getCostumeInfo().key;
      if (state.enabled) {
        canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
        state.lastSafeSize = { width: state.pendingSize.width, height: state.pendingSize.height };
        if (isBitmap() && typeof paper?.tool?.onUpdateImage === "function") {
          // Capture the current costume immediately; deferring this could commit
          // the resize to a different costume if the user switches in the meantime.
          paper.tool.onUpdateImage();
        }
      }
    };

    input.oninput = normalizeAndStore;
    input.onchange = commitSizeIfDirty;
    input.onblur = commitSizeIfDirty;
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitSizeIfDirty();
        input.blur();
      }
    };
    return input;
  };

  const setupControls = async () => {
    const wrapper = el("div", {
      className: addon.tab.scratchClass("button-group_button-group", {
        others: "sa-pixel-art-controls sa-pixel-art-hidden",
      }),
    });
    wrapper.dataset.enabled = false;
    addon.tab.displayNoneWhileDisabled(wrapper);

    const toggleIcon = el("img", {
      src: `${addon.self.dir}/icons/pixel-mode.svg`,
      alt: "",
      className: addon.tab.scratchClass("paint-editor_button-group-button-icon", {
        others: "sa-pixel-art-toggle-icon",
      }),
      draggable: false,
    });
    const toggle = el(
      "button",
      {
        type: "button",
        className: addon.tab.scratchClass("button_button", "paint-editor_button-group-button", {
          others: "sa-pixel-art-toggle",
        }),
        title: msg("pixelModeButton"),
        ariaLabel: msg("pixelModeButton"),
      },
      [toggleIcon]
    );
    toggle.dataset.active = false;
    toggle.onclick = () => setPixelMode(!state.enabled);
    toggle.setAttribute("aria-pressed", false);

    const sizeDiv = el("div", { className: "sa-pixel-art-size sa-pixel-art-hidden" });
    const widthInput = createInput("width");
    const heightInput = createInput("height");
    sizeDiv.append(widthInput, el("span", {}, ["x"]), heightInput);

    wrapper.append(sizeDiv, el("div", { className: "sa-pixel-art-toggle-wrapper" }, [toggle]));
    Object.assign(state, {
      toggleButton: toggle,
      controlsGroup: wrapper,
      sizeControls: sizeDiv,
      widthInput,
      heightInput,
    });

    const brushContainer = el("div", { className: "sa-pixel-art-brush" });
    brushContainer.dataset.visible = false;
    addon.tab.displayNoneWhileDisabled(brushContainer);

    BRUSH_SIZES.forEach((size) => {
      const preview = el("span", { className: "sa-pixel-art-brush-preview" });
      Object.assign(preview.style, { width: `${size * 5}px`, height: `${size * 5}px` });
      const btn = el("button", { type: "button", className: "sa-pixel-art-brush-button" }, [preview]);
      btn.dataset.size = size;
      btn.onclick = () => {
        redux.dispatch({ type: "scratch-paint/brush-mode/CHANGE_BIT_BRUSH_SIZE", brushSize: size });
        updateBrushSelection(size);
      };
      brushContainer.appendChild(btn);
    });

    state.brushButtons = brushContainer;
    updateBrushSelection(redux.state.scratchPaint?.bitBrushSize ?? 1);
    updateBrushControlVisibility();

    while (true) {
      const zoomControls = await addon.tab.waitForElement("[class*='paint-editor_zoom-controls_']", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/navigation/ACTIVATE_TAB",
          "scratch-gui/targets/UPDATE_TARGET_LIST",
          "scratch-paint/formats/CHANGE_FORMAT",
        ],
        reduxCondition: (store) =>
          store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });

      const resetButton = zoomControls.querySelectorAll("[class*='paint-editor_button-group-button_']")[1];
      resetButton.addEventListener("click", () => {
        if (addon.self.disabled || !state.enabled) return;
        // Fit on the next frame, after Scratch's own reset and selection updates.
        canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height, { fitView: true });
      });

      // This space uses row-reverse: order 3 places pixel controls to the left
      // of paint snapping (2) and onion skinning (1), regardless of load order.
      addon.tab.appendToSharedSpace({ space: "paintEditorZoomControls", element: wrapper, order: 3 });

      const container = await addon.tab.waitForElement("[class*='mode-tools']");
      if (!container.contains(brushContainer)) container.appendChild(brushContainer);
      updateBrushControlVisibility();
      updatePixelModeVisibility();
    }
  };

  const handleDisabled = () => {
    state.pixelModeDesired = false;
    canvasAdjuster.disable();
    updatePixelModeState(false);
    if (state.brushButtons) state.brushButtons.dataset.visible = false;
    document.body.classList.remove("sa-pixel-art-mode-active");
  };
  const handleReenabled = () => {
    state.pixelModeDesired = addon.settings.get("enableByDefault");
    updatePixelModeState(false);
    canvasAdjuster.disable();
    updateBrushControlVisibility();
    updatePixelModeVisibility();
  };

  return {
    setPixelMode,
    updateBrushSelection,
    updateBrushControlVisibility,
    updatePixelModeVisibility,
    onTargetsUpdate,
    setupControls,
    handleDisabled,
    handleReenabled,
  };
}
