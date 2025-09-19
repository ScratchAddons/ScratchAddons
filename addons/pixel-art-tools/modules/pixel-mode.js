const DEFAULT_SIZE = 64;

export function createPixelModeModule(addon, state, redux, msg, canvasUtils, brushControls, palette) {
  const setPixelMode = (enabled, options = {}) => {
    if (state.enabled === enabled) return;
    state.enabled = enabled;
    document.body.classList.toggle("sa-pixel-art-mode-active", enabled);
    if (state.controlsGroup) state.controlsGroup.dataset.enabled = enabled ? "true" : "false";
    if (state.toggleButton) {
      state.toggleButton.dataset.active = enabled ? "true" : "false";
      state.toggleButton.setAttribute("aria-pressed", enabled ? "true" : "false");
    }
    // Show/hide palette panel based on pixel mode
    if (state.palettePanel) {
      state.palettePanel.style.display = enabled ? "block" : "none";
    }
    canvasUtils.applyPixelGrid(enabled);
    if (typeof canvasUtils.handleFormatChange === "function") {
      canvasUtils.handleFormatChange(redux.state?.scratchPaint?.format);
    }
    if (enabled && !options.skipCanvasUpdate) {
      canvasUtils.resizeBitmapCanvas(state.pendingSize.width, state.pendingSize.height);
    }
    if (!enabled) {
      palette.updatePaletteSelection();
    }
    // Update brush control visibility based on pixel mode and current paint mode
    brushControls.updateBrushControlVisibility();
  };

  const createControls = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "sa-pixel-art-controls";
    addon.tab.displayNoneWhileDisabled(wrapper);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "sa-pixel-art-toggle";
    toggle.title = msg("pixelModeButton");
    toggle.textContent = msg("pixelModeButton");
    toggle.dataset.active = "false";
    toggle.setAttribute("aria-pressed", "false");
    toggle.addEventListener("click", () => {
      setPixelMode(!state.enabled);
    });
    wrapper.appendChild(toggle);

    state.toggleButton = toggle;

    const sizeLabel = document.createElement("div");
    sizeLabel.className = "sa-pixel-art-size";

    const widthInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.min = "1";
    widthInput.max = "1024";
    widthInput.value = String(state.pendingSize.width);
    widthInput.addEventListener("change", () => {
      const value = Number.parseInt(widthInput.value, 10);
      if (!Number.isFinite(value)) return;
      state.pendingSize.width = Math.max(1, Math.min(1024, value));
      widthInput.value = String(state.pendingSize.width);
      if (state.enabled) canvasUtils.resizeBitmapCanvas(state.pendingSize.width, state.pendingSize.height);
    });

    const separator = document.createElement("span");
    separator.textContent = msg("sizeSeparator");

    const heightInput = document.createElement("input");
    heightInput.type = "number";
    heightInput.min = "1";
    heightInput.max = "1024";
    heightInput.value = String(state.pendingSize.height);
    heightInput.addEventListener("change", () => {
      const value = Number.parseInt(heightInput.value, 10);
      if (!Number.isFinite(value)) return;
      state.pendingSize.height = Math.max(1, Math.min(1024, value));
      heightInput.value = String(state.pendingSize.height);
      if (state.enabled) canvasUtils.resizeBitmapCanvas(state.pendingSize.width, state.pendingSize.height);
    });

    sizeLabel.appendChild(widthInput);
    sizeLabel.appendChild(separator);
    sizeLabel.appendChild(heightInput);

    wrapper.appendChild(sizeLabel);

    state.widthInput = widthInput;
    state.heightInput = heightInput;
    state.controlsGroup = wrapper;

    return wrapper;
  };

  const setupZoomControls = async () => {
    const controls = createControls();

    while (true) {
      // Wait for paint editor to be ready, only in bitmap mode
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

      addon.tab.appendToSharedSpace({
        space: "paintEditorZoomControls",
        element: controls,
        order: 1,
      });
    }
  };

  const handleDisabled = () => {
    if (state.controlsGroup) {
      state.controlsGroup.dataset.enabled = "false";
    }
    if (state.toggleButton) {
      state.toggleButton.dataset.active = "false";
      state.toggleButton.setAttribute("aria-pressed", "false");
    }
    if (state.brushButtons) {
      state.brushButtons.dataset.visible = "false";
    }
    if (state.palettePanel) {
      state.palettePanel.style.display = "none";
    }
    canvasUtils.applyPixelGrid(false);
    document.body.classList.remove("sa-pixel-art-mode-active");
    state.enabled = false;
  };

  const handleReenabled = () => {
    if (state.enabled) {
      if (state.toggleButton) {
        state.toggleButton.dataset.active = "true";
        state.toggleButton.setAttribute("aria-pressed", "true");
      }
      if (state.palettePanel) {
        state.palettePanel.style.display = "block";
      }
      canvasUtils.applyPixelGrid(true);
      canvasUtils.resizeBitmapCanvas(state.pendingSize.width, state.pendingSize.height);
      brushControls.updateBrushControlVisibility();
    }
  };

  return {
    setPixelMode,
    setupZoomControls,
    handleDisabled,
    handleReenabled,
  };
}
