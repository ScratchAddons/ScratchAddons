const BRUSH_SIZES = [1, 2, 3, 4];

export function createBrushControlsModule(addon, state, redux) {
  const updateBrushSelection = (size) => {
    if (!state.brushButtons) return;
    [...state.brushButtons.children].forEach((button) => {
      const matches = Number.parseInt(button.dataset.size, 10) === size;
      button.dataset.selected = matches ? "true" : "false";
    });
  };

  const updateBrushControlVisibility = () => {
    if (!state.brushButtons) return;
    const mode = redux.state?.scratchPaint?.mode;
    const format = redux.state?.scratchPaint?.format;
    const isBrush = mode === "BIT_BRUSH" || mode === "BIT_LINE";
    const isBitmap = format && format.startsWith("BITMAP");

    // Show our custom brush controls only in bitmap mode with brush tools and pixel mode enabled
    const showCustomControls = isBrush && isBitmap && state.enabled;
    state.brushButtons.dataset.visible = showCustomControls ? "true" : "false";

    // Hide/show original number input based on whether we're showing custom controls
    const numberInput = document.querySelector("[class*='mode-tools'] input[type='number']");
    if (numberInput) {
      if (showCustomControls) {
        numberInput.classList.add("sa-pixel-art-hide-when-pixel");
      } else {
        numberInput.classList.remove("sa-pixel-art-hide-when-pixel");
      }
    }
  };

  const createBrushControls = () => {
    const container = document.createElement("div");
    container.className = "sa-pixel-art-brush";
    addon.tab.displayNoneWhileDisabled(container);
    container.dataset.visible = "false";

    BRUSH_SIZES.forEach((size) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sa-pixel-art-brush-button";
      button.dataset.size = String(size);
      button.addEventListener("click", () => {
        redux.dispatch({
          type: "scratch-paint/brush-mode/CHANGE_BIT_BRUSH_SIZE",
          brushSize: size,
        });
        updateBrushSelection(size);
      });
      const preview = document.createElement("span");
      preview.style.width = `${size * 6}px`;
      preview.style.height = `${size * 6}px`;
      preview.className = "sa-pixel-art-brush-preview";
      button.appendChild(preview);
      container.appendChild(button);
    });

    state.brushButtons = container;
    updateBrushSelection(redux.state?.scratchPaint?.bitBrushSize ?? BRUSH_SIZES[0]);
    updateBrushControlVisibility();

    return container;
  };

  const setupBrushControls = async () => {
    const brushControls = createBrushControls();

    const insertBrushControls = async () => {
      try {
        const container = await addon.tab.waitForElement("[class*='mode-tools']", {
          reduxCondition: (store) =>
            store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
        });
        if (!container) return;

        const numberInput = container.querySelector("input[type='number']");
        if (!numberInput || numberInput.closest(".sa-pixel-art-brush")) return;

        if (!container.contains(brushControls)) {
          container.appendChild(brushControls);
          updateBrushControlVisibility();
        }
      } catch (error) {
        console.error("pixel-art-tools: Error in setupBrushControls:", error);
      }
    };

    // Set up once initially
    insertBrushControls();

    // Re-setup on relevant Redux events
    redux.addEventListener("statechanged", ({ detail }) => {
      if (!detail?.action?.type) return;
      if (
        detail.action.type === "scratch-gui/navigation/ACTIVATE_TAB" ||
        detail.action.type === "scratch-paint/modes/CHANGE_MODE" ||
        detail.action.type === "scratch-paint/formats/CHANGE_FORMAT"
      ) {
        insertBrushControls();
      }
    });
  };

  return {
    updateBrushSelection,
    updateBrushControlVisibility,
    setupBrushControls,
  };
}
