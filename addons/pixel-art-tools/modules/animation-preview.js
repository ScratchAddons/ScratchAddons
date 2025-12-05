// animation-preview.js
export function createAnimationPreview(addon, state, msg) {
  let panel = null;
  let previewImg = null;
  let intervalId = null;
  let currentFrame = -1;
  let fps = 12;

  const getCostumeImages = () => {
    // Get costume thumbnails from the costume list in the paint editor
    const costumeList = document.querySelector("[class*='selector_list-area']");
    if (!costumeList) return [];
    return [...costumeList.querySelectorAll("img[class*='sprite-image']")];
  };

  const updatePreview = () => {
    if (!panel || panel.style.display === "none") return;
    const images = getCostumeImages();
    if (!images.length) return;
    currentFrame = (currentFrame + 1) % images.length;
    const src = images[currentFrame]?.src;
    if (src && previewImg) previewImg.src = src;
  };

  const startAnimation = () => {
    stopAnimation();
    intervalId = setInterval(updatePreview, 1000 / fps);
  };

  const stopAnimation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const setFps = (newFps) => {
    fps = Math.max(1, Math.min(60, newFps));
    if (intervalId) startAnimation();
  };

  const setupPanel = async () => {
    if (state.palettePanelReady) {
      try {
        await state.palettePanelReady;
      } catch {}
    }

    panel = Object.assign(document.createElement("section"), { className: "sa-pixel-art-animation" });
    panel.style.display = state.enabled ? "block" : "none";
    addon.tab.displayNoneWhileDisabled(panel);

    const header = Object.assign(document.createElement("header"), {
      className: "sa-pixel-art-animation-header",
      textContent: msg("animationPreview") || "Preview",
    });
    panel.appendChild(header);

    // Draggable when floating
    let dragStart = null;
    header.onmousedown = (e) => panel.dataset.floating && (dragStart = { x: e.clientX - panel.offsetLeft, y: e.clientY - panel.offsetTop });
    document.addEventListener("mousemove", (e) => dragStart && Object.assign(panel.style, { left: `${e.clientX - dragStart.x}px`, top: `${e.clientY - dragStart.y}px`, right: "auto" }));
    document.addEventListener("mouseup", () => (dragStart = null));

    // Preview image
    previewImg = Object.assign(document.createElement("img"), {
      className: "sa-pixel-art-animation-preview",
      alt: "Animation preview",
    });
    panel.appendChild(previewImg);

    // FPS control
    const fpsRow = Object.assign(document.createElement("div"), { className: "sa-pixel-art-animation-fps" });
    const fpsLabel = Object.assign(document.createElement("span"), { textContent: "FPS" });
    const tooltip = Object.assign(document.createElement("div"), { className: "sa-pixel-art-animation-tooltip" });
    const fpsSlider = Object.assign(document.createElement("input"), {
      type: "range",
      min: "1",
      max: "30",
      value: String(fps),
      className: "sa-pixel-art-animation-slider",
    });
    const updateFpsTooltip = (value) => {
      const label = `${value} FPS`;
      fpsLabel.title = label;
      fpsSlider.title = label;
      tooltip.textContent = label;
    };
    const showTooltip = (value) => {
      updateFpsTooltip(value);
      tooltip.dataset.show = "true";
    };
    const hideTooltip = () => {
      delete tooltip.dataset.show;
    };
    updateFpsTooltip(fps);
    fpsSlider.onpointerdown = () => showTooltip(+fpsSlider.value);
    fpsSlider.oninput = (e) => {
      const value = +e.target.value;
      setFps(value);
      showTooltip(value);
    };
    fpsSlider.onpointerup = hideTooltip;
    fpsSlider.onpointerleave = (e) => {
      if (!e.buttons) hideTooltip();
    };
    fpsRow.append(fpsLabel, fpsSlider);
    fpsRow.appendChild(tooltip);
    panel.appendChild(fpsRow);

    state.animationPanel = panel;
    if (state.enabled) startAnimation();

    // Float logic - position below palette if palette is floating
    const updateFloat = () => {
      const shouldFloat = window.innerWidth < 1256;
      const canvas = document.querySelector("[class*='paper-canvas_paper-canvas']");
      if (shouldFloat && canvas) {
        panel.dataset.floating = "true";
        canvas.parentElement.appendChild(panel);
        // Position below palette if it exists
        const paletteBottom = state.palettePanel?.offsetTop + state.palettePanel?.offsetHeight;
        const top = paletteBottom ? paletteBottom + 10 : 10;
        Object.assign(panel.style, { right: "10px", top: `${top}px`, left: "auto" });
      } else {
        delete panel.dataset.floating;
        Object.assign(panel.style, { left: "", top: "", right: "" });
        document.querySelector("[class*='paint-editor_mode-selector']")?.appendChild(panel);
      }
    };
    window.addEventListener("resize", updateFloat);
    updateFloat();

    while (true) {
      await addon.tab.waitForElement("[class*='paint-editor_mode-selector']", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/navigation/ACTIVATE_TAB",
          "scratch-gui/targets/UPDATE_TARGET_LIST",
          "scratch-paint/formats/CHANGE_FORMAT",
        ],
        reduxCondition: (store) =>
          store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });

      addon.tab.appendToSharedSpace({ space: "paintEditorModeSelector", element: panel, order: 2 });
      updateFloat();
      state.enabled ? show() : hide();
    }
  };

  const show = () => {
    if (panel) {
      panel.style.display = "block";
      startAnimation();
    }
  };

  const hide = () => {
    if (panel) {
      panel.style.display = "none";
      stopAnimation();
    }
  };

  return {
    setupPanel,
    show,
    hide,
  };
}
