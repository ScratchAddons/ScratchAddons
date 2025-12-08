const BRUSH_SIZES = [1, 2, 3, 4];

export function createControlsModule(addon, state, redux, msg, canvasAdjuster, palette, animationPreview) {
  const isBitmap = () => redux.state.scratchPaint?.format?.startsWith("BITMAP");
  state.canvasSizeLocked = state.canvasSizeLocked || false;

  const getCostumeSize = () => {
    const vm = addon.tab.traps.vm;
    const target = vm.editingTarget || vm.runtime.getEditingTarget();
    const costume = target?.sprite?.costumes?.[target.currentCostume];
    if (!costume) return null;
    // bitmapResolution 1 reports half size which happens in case of vector so double it.
    const mul = costume.bitmapResolution === 1 ? 2 : 1;
    return {
      width: Math.round(costume.size[0] * mul),
      height: Math.round(costume.size[1] * mul),
    };
  };

  const updatePixelModeState = (enabled) => {
    state.enabled = enabled;
    document.body.classList.toggle("sa-pixel-art-mode-active", enabled);
    Object.assign(state.controlsGroup.dataset, { enabled });
    Object.assign(state.toggleButton.dataset, { active: enabled });
    state.toggleButton.setAttribute("aria-pressed", enabled);
    state.palettePanel.style.display = enabled ? "block" : "none";
    state.sizeControls.style.display = enabled ? "flex" : "none";
    if (animationPreview) {
      enabled ? animationPreview.show() : animationPreview.hide();
    }
  };

  const setPixelMode = (enabled) => {
    if (state.enabled === enabled) return;
    state.pixelModeDesired = enabled;
    state.canvasSizeLocked = false;
    updatePixelModeState(enabled);
    if (enabled) {
      canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
      // Set brush size to 1 when entering pixel mode
      redux.dispatch({ type: "scratch-paint/brush-mode/CHANGE_BIT_BRUSH_SIZE", brushSize: 1 });
      updateBrushSelection(1);
    } else {
      canvasAdjuster.disable();
      palette.updatePaletteSelection();
    }
    updateBrushControlVisibility();
  };

  const updateBrushSelection = (size) => {
    [...state.brushButtons.children].forEach((btn) => (btn.dataset.selected = +btn.dataset.size === size));
  };

  const updateBrushControlVisibility = async () => {
    const { mode, format } = redux.state.scratchPaint;
    const show = (mode === "BIT_BRUSH" || mode === "BIT_LINE") && format?.startsWith("BITMAP") && state.enabled;
    state.brushButtons.dataset.visible = show;
    // If we need to hide the native input, wait for it to render first
    if (show) {
      const input = await addon.tab.waitForElement("[class*='mode-tools'] input[type='number']", {
        reduxCondition: (store) => store.scratchPaint?.mode === mode,
      });
      input.classList.add("sa-pixel-art-hide-when-pixel");
    } else {
      document
        .querySelector("[class*='mode-tools'] input[type='number']")
        ?.classList.remove("sa-pixel-art-hide-when-pixel");
    }
  };

  const updatePixelModeVisibility = () => {
    const isCurrentlyBitmap = isBitmap();
    state.controlsGroup.style.display = isCurrentlyBitmap ? "flex" : "none";
    state.toggleButton.style.display = isCurrentlyBitmap ? "block" : "none";

    if (!isCurrentlyBitmap && state.enabled) {
      updatePixelModeState(false);
      canvasAdjuster.disable();
      updateBrushControlVisibility();
    } else if (isCurrentlyBitmap && state.pixelModeDesired && !state.enabled) {
      setPixelMode(true);
    } else if (isCurrentlyBitmap) {
      if (state.enabled && state.canvasSizeLocked) {
        canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
        return;
      }
      const costumeSize = getCostumeSize();
      if (costumeSize) {
        const defaultWidth = addon.settings.get("defaultWidth");
        const defaultHeight = addon.settings.get("defaultHeight");
        const useWidth = costumeSize.width >= defaultWidth ? costumeSize.width : defaultWidth;
        const useHeight = costumeSize.height >= defaultHeight ? costumeSize.height : defaultHeight;

        Object.assign(state.pendingSize, { width: useWidth, height: useHeight });
        state.widthInput.value = useWidth;
        state.heightInput.value = useHeight;
        if (state.enabled) canvasAdjuster.enable(useWidth, useHeight);
      }
    }
  };

  const createInput = (dimension) => {
    const input = Object.assign(document.createElement("input"), {
      type: "number",
      min: "1",
      max: "1024",
      value: state.pendingSize[dimension],
    });
    input.onchange = () => {
      const value = Math.max(1, Math.min(1024, +input.value || 1));
      state.pendingSize[dimension] = value;
      input.value = value;
      state.canvasSizeLocked = true;
      if (state.enabled) canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
    };
    return input;
  };

  const setupControls = async () => {
    const wrapper = Object.assign(document.createElement("div"), { className: "sa-pixel-art-controls" });
    wrapper.dataset.enabled = false;
    wrapper.style.display = "none";
    addon.tab.displayNoneWhileDisabled(wrapper);

    const toggle = Object.assign(document.createElement("button"), {
      type: "button",
      className: "sa-pixel-art-toggle",
      title: msg("pixelModeButton"),
      textContent: msg("pixelModeButton"),
    });
    toggle.dataset.active = false;
    toggle.setAttribute("aria-pressed", false);
    toggle.onclick = () => setPixelMode(!state.enabled);

    const sizeDiv = Object.assign(document.createElement("div"), { className: "sa-pixel-art-size" });
    sizeDiv.style.display = "none";
    const separator = Object.assign(document.createElement("span"), { textContent: "x" });
    const widthInput = createInput("width");
    const heightInput = createInput("height");

    sizeDiv.append(widthInput, separator, heightInput);
    wrapper.append(toggle, sizeDiv);

    Object.assign(state, {
      toggleButton: toggle,
      controlsGroup: wrapper,
      sizeControls: sizeDiv,
      widthInput,
      heightInput,
    });

    const brushContainer = Object.assign(document.createElement("div"), { className: "sa-pixel-art-brush" });
    brushContainer.dataset.visible = false;
    addon.tab.displayNoneWhileDisabled(brushContainer);

    BRUSH_SIZES.forEach((size) => {
      const button = Object.assign(document.createElement("button"), {
        type: "button",
        className: "sa-pixel-art-brush-button",
      });
      button.dataset.size = size;
      button.onclick = () => {
        redux.dispatch({ type: "scratch-paint/brush-mode/CHANGE_BIT_BRUSH_SIZE", brushSize: size });
        updateBrushSelection(size);
      };
      const preview = Object.assign(document.createElement("span"), { className: "sa-pixel-art-brush-preview" });
      Object.assign(preview.style, { width: `${size * 6}px`, height: `${size * 6}px` });
      button.appendChild(preview);
      brushContainer.appendChild(button);
    });

    state.brushButtons = brushContainer;
    updateBrushSelection(redux.state.scratchPaint?.bitBrushSize ?? 1);
    updateBrushControlVisibility();

    let hasAppliedZoomClasses = false;
    while (true) {
      await addon.tab.waitForElement("[class^='paint-editor_zoom-controls']", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/navigation/ACTIVATE_TAB",
          "scratch-gui/targets/UPDATE_TARGET_LIST",
          "scratch-paint/formats/CHANGE_FORMAT",
        ],
        reduxCondition: (store) =>
          store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });

      addon.tab.appendToSharedSpace({ space: "paintEditorZoomControls", element: wrapper, order: 1 });

      if (!hasAppliedZoomClasses) {
        hasAppliedZoomClasses = true;
        const zoomControlsContainer = await addon.tab.waitForElement("[class^='paint-editor_zoom-controls']");
        const groupClass = zoomControlsContainer?.firstChild?.className;
        const buttonClass = zoomControlsContainer?.firstChild?.firstChild?.className;
        if (groupClass) wrapper.classList.add(...groupClass.split(/\s+/).filter(Boolean));
        if (buttonClass) state.toggleButton.classList.add(...buttonClass.split(/\s+/).filter(Boolean));
      }

      const container = await addon.tab.waitForElement("[class*='mode-tools']");
      if (!container.contains(brushContainer)) {
        container.appendChild(brushContainer);
      }
      updateBrushControlVisibility();

      updatePixelModeVisibility();
    }
  };

  const handleDisabled = () => {
    updatePixelModeState(false);
    state.brushButtons.dataset.visible = false;
    document.body.classList.remove("sa-pixel-art-mode-active");
  };

  const handleReenabled = () => {
    if (!state.enabled) return;
    updatePixelModeState(true);
    canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
    updateBrushControlVisibility();
  };

  return {
    setPixelMode,
    updateBrushSelection,
    updateBrushControlVisibility,
    updatePixelModeVisibility,
    setupControls,
    handleDisabled,
    handleReenabled,
  };
}
