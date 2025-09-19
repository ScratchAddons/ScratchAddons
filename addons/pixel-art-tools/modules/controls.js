const BRUSH_SIZES = [1, 2, 3, 4];

export function createControlsModule(addon, state, redux, msg, canvasAdjuster, palette) {
  const isBitmap = () => redux.state.scratchPaint?.format?.startsWith("BITMAP");
  
  const updatePixelModeState = (enabled) => {
    state.enabled = enabled;
    document.body.classList.toggle("sa-pixel-art-mode-active", enabled);
    Object.assign(state.controlsGroup.dataset, { enabled });
    Object.assign(state.toggleButton.dataset, { active: enabled });
    state.toggleButton.setAttribute("aria-pressed", enabled);
    state.palettePanel.style.display = enabled ? "block" : "none";
    state.sizeControls.style.display = enabled ? "flex" : "none";
  };

  const setPixelMode = (enabled) => {
    if (state.enabled === enabled) return;
    state.pixelModeDesired = enabled;
    updatePixelModeState(enabled);
    if (enabled) canvasAdjuster.setPixelModeBackground(state.pendingSize.width, state.pendingSize.height);
    else palette.updatePaletteSelection();
    updateBrushControlVisibility();
  };

  const updateBrushSelection = (size) => {
    [...state.brushButtons.children].forEach(btn => btn.dataset.selected = +btn.dataset.size === size);
  };

  const updateBrushControlVisibility = () => {
    const { mode, format } = redux.state.scratchPaint;
    const show = (mode === "BIT_BRUSH" || mode === "BIT_LINE") && format?.startsWith("BITMAP") && state.enabled;
    state.brushButtons.dataset.visible = show;
    document.querySelector("[class*='mode-tools'] input[type='number']")?.classList.toggle("sa-pixel-art-hide-when-pixel", show);
  };

  const updatePixelModeVisibility = () => {
    const isCurrentlyBitmap = isBitmap();
    state.toggleButton.style.display = isCurrentlyBitmap ? "block" : "none";
    
    if (!isCurrentlyBitmap && state.enabled) {
      updatePixelModeState(false);
      updateBrushControlVisibility();
    } else if (isCurrentlyBitmap && state.pixelModeDesired && !state.enabled) {
      setPixelMode(true);
    }
  };

  const createInput = (dimension) => {
    const input = Object.assign(document.createElement("input"), {
      type: "number", min: "1", max: "1024", value: state.pendingSize[dimension]
    });
    input.onchange = () => {
      const value = Math.max(1, Math.min(1024, +input.value || 1));
      state.pendingSize[dimension] = value;
      input.value = value;
      if (state.enabled) canvasAdjuster.setPixelModeBackground(state.pendingSize.width, state.pendingSize.height);
    };
    return input;
  };

  const setupControls = async () => {
    const wrapper = Object.assign(document.createElement("div"), { className: "sa-pixel-art-controls" });
    wrapper.dataset.enabled = false;
    addon.tab.displayNoneWhileDisabled(wrapper);

    const toggle = Object.assign(document.createElement("button"), {
      type: "button", className: "sa-pixel-art-toggle", title: msg("pixelModeButton"), textContent: msg("pixelModeButton")
    });
    toggle.dataset.active = false;
    toggle.setAttribute("aria-pressed", false);
    toggle.onclick = () => setPixelMode(!state.enabled);

    const sizeDiv = Object.assign(document.createElement("div"), { className: "sa-pixel-art-size" });
    sizeDiv.style.display = "none";
    const separator = Object.assign(document.createElement("span"), { textContent: msg("sizeSeparator") });
    const widthInput = createInput("width");
    const heightInput = createInput("height");

    sizeDiv.append(widthInput, separator, heightInput);
    wrapper.append(toggle, sizeDiv);
    
    Object.assign(state, { toggleButton: toggle, controlsGroup: wrapper, sizeControls: sizeDiv, widthInput, heightInput });

    const brushContainer = Object.assign(document.createElement("div"), { className: "sa-pixel-art-brush" });
    brushContainer.dataset.visible = false;
    addon.tab.displayNoneWhileDisabled(brushContainer);

    BRUSH_SIZES.forEach(size => {
      const button = Object.assign(document.createElement("button"), { type: "button", className: "sa-pixel-art-brush-button" });
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

    while (true) {
      await addon.tab.waitForElement("[class^='paint-editor_zoom-controls']", {
        markAsSeen: true,
        reduxEvents: ["scratch-gui/navigation/ACTIVATE_TAB", "scratch-gui/targets/UPDATE_TARGET_LIST", "scratch-paint/formats/CHANGE_FORMAT"],
        reduxCondition: (store) => store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });

      addon.tab.appendToSharedSpace({ space: "paintEditorZoomControls", element: wrapper, order: 1 });
      
      const container = await addon.tab.waitForElement("[class*='mode-tools']");
      if (!container.contains(brushContainer)) {
        container.appendChild(brushContainer);
        updateBrushControlVisibility();
      }
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
    canvasAdjuster.setPixelModeBackground(state.pendingSize.width, state.pendingSize.height);
    updateBrushControlVisibility();
  };

  return { setPixelMode, updateBrushSelection, updateBrushControlVisibility, updatePixelModeVisibility, setupControls, handleDisabled, handleReenabled };
}