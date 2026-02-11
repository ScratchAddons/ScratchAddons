const BRUSH_SIZES = [1, 2, 3, 4];

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
  let lastUserSizeChangeAt = 0;
  let lastCostumeKey = null;
  let skipNextViewBounds = false;
  let onUpdateImageTimer = null;
  let sizeDirty = false;

  const el = (tag, props = {}, children = []) => {
    const e = Object.assign(document.createElement(tag), props);
    children.forEach((c) => (typeof c === "string" ? (e.textContent = c) : e.appendChild(c)));
    return e;
  };

  const isBitmap = () => redux.state.scratchPaint?.format?.startsWith("BITMAP");

  const getCostumeInfo = () => {
    const vm = addon.tab.traps.vm;
    const target = vm.editingTarget || vm.runtime.getEditingTarget();
    const targetId = target?.id || null;
    const costumeIndex = target?.currentCostume ?? null;
    const costume = target?.sprite?.costumes?.[target.currentCostume];
    if (!costume) return { key: null, size: null, bitmapResolution: null };
    const mul = costume.bitmapResolution === 1 ? 2 : 1;
    const size = { width: Math.round(costume.size[0] * mul), height: Math.round(costume.size[1] * mul) };
    const key = `${targetId}:${costumeIndex}:${costume.md5 || costume.md5ext || ""}:${costume.bitmapResolution || ""}`;
    return { key, size, bitmapResolution: costume.bitmapResolution ?? null };
  };

  const updatePixelModeState = (enabled) => {
    state.enabled = enabled;
    document.body.classList.toggle("sa-pixel-art-mode-active", enabled);
    Object.assign(state.controlsGroup.dataset, { enabled });
    Object.assign(state.toggleButton.dataset, { active: enabled });
    state.toggleButton.setAttribute("aria-pressed", enabled);
    state.palettePanel.style.display = enabled ? "block" : "none";
    state.sizeControls.style.display = enabled ? "flex" : "none";
    animationPreview?.[enabled ? "show" : "hide"]();
  };

  const updateBrushSelection = (size) =>
    [...state.brushButtons.children].forEach((btn) => (btn.dataset.selected = +btn.dataset.size === size));

  const setPixelMode = (enabled) => {
    if (state.enabled === enabled) return;
    state.pixelModeDesired = enabled;
    updatePixelModeState(enabled);
    if (enabled) {
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

  const computeDesiredSize = () => {
    const { size } = getCostumeInfo();
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
    const bitmap = isBitmap();
    state.controlsGroup.style.display = bitmap ? "flex" : "none";
    state.toggleButton.style.display = bitmap ? "block" : "none";

    if (!bitmap && state.enabled) {
      updatePixelModeState(false);
      canvasAdjuster.disable();
      updateBrushControlVisibility();
    } else if (state.restoreSizePending && state.lastAppliedSize) {
      state.restoreSizePending = false;
      const { width, height } = state.lastAppliedSize;
      applySizeToInputs(width, height);
      if (state.enabled) canvasAdjuster.enable(width, height);
    } else if (bitmap) {
      const { key, size } = getCostumeInfo();
      const desired = size
        ? { width: Math.max(1, size.width), height: Math.max(1, size.height) }
        : { width: addon.settings.get("defaultWidth"), height: addon.settings.get("defaultHeight") };

      const recentlyUserChanged = Date.now() - lastUserSizeChangeAt < 600;
      const costumeChanged = key && key !== lastCostumeKey;
      const desiredDiffers = desired.width !== state.pendingSize.width || desired.height !== state.pendingSize.height;

      if (state.pixelModeDesired && !state.enabled) {
        applySizeToInputs(desired.width, desired.height);
        lastCostumeKey = key;
        setPixelMode(true);
        return;
      }

      if (state.enabled && skipNextViewBounds) {
        skipNextViewBounds = false;
        if (key) lastCostumeKey = key;
        canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
        return;
      }

      if (costumeChanged || (!recentlyUserChanged && desiredDiffers)) {
        applySizeToInputs(desired.width, desired.height);
        lastCostumeKey = key;
      } else if (key) {
        lastCostumeKey = key;
      }

      if (state.enabled) {
        canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
        state.lastAppliedSize = { width: state.pendingSize.width, height: state.pendingSize.height };
      }
    }
  };

  const createInput = (dimension) => {
    const input = el("input", {
      type: "number",
      min: "2",
      max: "1024",
      step: "2",
      value: state.pendingSize[dimension],
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
      // Pixel mode bitmap sizes effectively move in even steps; snap on commit only.
      if (state.enabled && isBitmap() && value % 2 === 1) value = Math.min(1024, value + 1);
      state.pendingSize[dimension] = value;
      input.value = value;
      lastUserSizeChangeAt = Date.now();
      if (state.enabled) {
        canvasAdjuster.enable(state.pendingSize.width, state.pendingSize.height);
        state.lastAppliedSize = { width: state.pendingSize.width, height: state.pendingSize.height };
        if (isBitmap() && typeof paper?.tool?.onUpdateImage === "function") {
          skipNextViewBounds = true;
          if (onUpdateImageTimer) clearTimeout(onUpdateImageTimer);
          onUpdateImageTimer = setTimeout(() => {
            onUpdateImageTimer = null;
            try {
              paper.tool.onUpdateImage();
            } catch {}
          }, 0);
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
    const wrapper = el("div", { className: "sa-pixel-art-controls" });
    wrapper.dataset.enabled = false;
    wrapper.style.display = "none";
    addon.tab.displayNoneWhileDisabled(wrapper);

    const toggleIcon = el("img", {
      src: `${addon.self.dir}/icons/pixel-mode.svg`,
      alt: "",
      className: "sa-pixel-art-toggle-icon",
      draggable: false,
    });
    const toggle = el(
      "button",
      {
        type: "button",
        className: "sa-pixel-art-toggle button_button_LhMbA paint-editor_button-group-button_ZLJcQ",
        title: msg("pixelModeButton"),
        ariaLabel: msg("pixelModeButton"),
      },
      [toggleIcon]
    );
    toggle.dataset.active = false;
    toggle.onclick = () => setPixelMode(!state.enabled);
    toggle.setAttribute("aria-pressed", false);

    const sizeDiv = el("div", { className: "sa-pixel-art-size", style: "display:none" });
    const widthInput = createInput("width");
    const heightInput = createInput("height");
    sizeDiv.append(widthInput, el("span", {}, ["x"]), heightInput);

    wrapper.append(el("div", { className: "sa-pixel-art-toggle-wrapper" }, [toggle]), sizeDiv);
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
      Object.assign(preview.style, { width: `${size * 6}px`, height: `${size * 6}px` });
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
        const zoomControls = await addon.tab.waitForElement("[class^='paint-editor_zoom-controls']");
        const groupClass = zoomControls?.firstChild?.className;
        const buttonClass = zoomControls?.firstChild?.firstChild?.className;
        if (groupClass) wrapper.classList.add(...groupClass.split(/\s+/).filter(Boolean));
        if (buttonClass) toggle.classList.add(...buttonClass.split(/\s+/).filter(Boolean));
      }

      const container = await addon.tab.waitForElement("[class*='mode-tools']");
      if (!container.contains(brushContainer)) container.appendChild(brushContainer);
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
