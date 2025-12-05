// animation-preview.js
export function createAnimationPreview(addon, state, msg) {
  let panel = null;
  let previewImg = null;
  let intervalId = null;
  let currentFrame = -1;
  let fps = 12;
  let exporting = false;
  let rangeStart = null;
  let rangeEnd = null;
  const resolveExtUrl = (path) => {
    const clean = path.replace(/^\//, "");
    if (chrome?.runtime?.getURL) return chrome.runtime.getURL(clean);
    if (addon?.self?.dir) return new URL(`../../${clean}`, `${addon.self.dir}/`).href;
    return path;
  };
  const gifLibPath = "/libraries/thirdparty/cs/gif.js";
  const gifWorkerPath = "/libraries/thirdparty/cs/gif.worker.js";
  let gifWorkerBlobUrl = null;

  const applyRange = (images) => {
    if (!rangeStart && !rangeEnd) return images;
    const start = rangeStart ? Math.max(1, rangeStart) : 1;
    const end = rangeEnd ? rangeEnd : images.length;
    const clampedEnd = Math.min(images.length, Math.max(start, end));
    return images.slice(start - 1, clampedEnd);
  };

  const captureFrames = async () => {
    const images = applyRange(getCostumeImages());
    if (!images.length) return [];
    const width = images[0].naturalWidth || images[0].width;
    const height = images[0].naturalHeight || images[0].height;
    if (!width || !height) return [];

    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    return images
      .filter((img) => img.naturalWidth && img.naturalHeight)
      .map((img) => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const frameCanvas = Object.assign(document.createElement("canvas"), { width, height });
        frameCanvas.getContext("2d", { willReadFrequently: true }).drawImage(canvas, 0, 0);
        return frameCanvas;
      });
  };

  let loadGifLibPromise = null;
  const ensureGifLib = () => {
    if (typeof GIF !== "undefined") return Promise.resolve();
    if (!loadGifLibPromise) {
      loadGifLibPromise = addon.tab.loadScript(gifLibPath);
    }
    return loadGifLibPromise;
  };

  let ensureWorkerPromise = null;
  const ensureGifWorkerUrl = () => {
    if (gifWorkerBlobUrl) return Promise.resolve(gifWorkerBlobUrl);
    if (!ensureWorkerPromise) {
      const workerUrl = resolveExtUrl(gifWorkerPath);
      ensureWorkerPromise = fetch(workerUrl)
        .then((res) => (res.ok ? res.text() : null))
        .then((text) => {
          gifWorkerBlobUrl = text ? URL.createObjectURL(new Blob([text], { type: "application/javascript" })) : workerUrl;
          return gifWorkerBlobUrl;
        })
        .catch(() => workerUrl);
    }
    return ensureWorkerPromise;
  };

  const exportGif = async () => {
    if (exporting) return;
    exporting = true;
    try {
      await ensureGifLib();
      if (typeof GIF === "undefined") return;
      const workerUrl = await ensureGifWorkerUrl();
      const frames = await captureFrames();
      if (!frames.length) return;
      const delay = Math.max(20, Math.round(1000 / fps));
      const gif = new window.GIF({
        workers: 2,
        quality: 1,
        width: frames[0].width,
        height: frames[0].height,
        workerScript: workerUrl,
      });
      frames.forEach((frame) => gif.addFrame(frame, { delay, copy: true }));
      const finish = () => {
        exporting = false;
      };
      gif.on("finished", (blob) => {
        const url = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement("a"), {
          href: url,
          download: "animation.gif",
        });
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        finish();
      });
      gif.on("abort", finish);
      gif.render();
    } catch (e) {
      console.warn("pixel-art-tools: GIF export failed", e);
      exporting = false;
    }
  };

  const getCostumeImages = () => {
    // Get costume thumbnails from the costume list in the paint editor
    const costumeList = document.querySelector("[class*='selector_list-area']");
    if (!costumeList) return [];
    return [...costumeList.querySelectorAll("img[class*='sprite-image']")];
  };

  const updatePreview = () => {
    if (!panel || panel.style.display === "none") return;
    const images = applyRange(getCostumeImages());
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

    // Preview image + export overlay
    const previewWrapper = Object.assign(document.createElement("div"), { className: "sa-pixel-art-animation-preview-wrap" });
    previewImg = Object.assign(document.createElement("img"), {
      className: "sa-pixel-art-animation-preview",
      alt: "Animation preview",
    });
    previewImg.onclick = exportGif;

    const exportBtn = Object.assign(document.createElement("button"), {
      type: "button",
      className: "sa-pixel-art-animation-export",
      textContent: msg("animationExport") || "Export GIF",
    });
    exportBtn.onclick = (e) => {
      e.stopPropagation();
      exportGif();
    };

    previewWrapper.append(previewImg, exportBtn);
    panel.appendChild(previewWrapper);

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
    const renderFpsLabel = (value) => {
      const label = `${value} FPS`;
      fpsLabel.title = fpsSlider.title = tooltip.textContent = label;
    };
    const showTooltip = (value) => {
      renderFpsLabel(value);
      tooltip.dataset.show = "true";
    };
    const hideTooltip = () => delete tooltip.dataset.show;
    renderFpsLabel(fps);
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

    const rangeWrapper = Object.assign(document.createElement("div"), {
      className: "sa-pixel-art-animation-range-wrapper",
    });

    const rangeToggle = Object.assign(document.createElement("button"), {
      type: "button",
      className: "sa-pixel-art-animation-range-toggle",
      ariaExpanded: "false",
      title: msg("animationRangeToggle") || "Animation range",
    });
    rangeToggle.innerHTML =
      '<svg viewBox="0 0 16 16" role="img" aria-hidden="true" focusable="false" class="sa-pixel-art-animation-range-icon"><path d="M4 6.5 8 10l4-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const rangeRow = Object.assign(document.createElement("div"), { className: "sa-pixel-art-animation-range" });
    const makeRangeInput = (onChange) => {
      const input = Object.assign(document.createElement("input"), {
        type: "number",
        min: "1",
        step: "1",
        placeholder: "",
      });
      input.onchange = () => {
        const val = input.value.trim();
        const parsed = val === "" ? null : Math.max(1, Math.floor(+val || 0));
        if (parsed === null) input.value = "";
        onChange(parsed);
        currentFrame = -1;
        updatePreview();
      };
      return input;
    };

    const startGroup = Object.assign(document.createElement("div"), { className: "sa-pixel-art-animation-range-group" });
    const endGroup = Object.assign(document.createElement("div"), { className: "sa-pixel-art-animation-range-group" });

    const startLabel = Object.assign(document.createElement("span"), {
      textContent: msg("animationRangeStart") || "Start",
      className: "sa-pixel-art-animation-range-label",
    });
    const endLabel = Object.assign(document.createElement("span"), {
      textContent: msg("animationRangeEnd") || "End",
      className: "sa-pixel-art-animation-range-label",
    });

    const startInput = makeRangeInput((val) => (rangeStart = val));
    const endInput = makeRangeInput((val) => (rangeEnd = val));

    startGroup.append(startLabel, startInput);
    endGroup.append(endLabel, endInput);

    rangeRow.append(startGroup, endGroup);
      rangeRow.style.display = "none";

    rangeToggle.onclick = () => {
      const expanded = rangeRow.style.display === "flex";
      rangeRow.style.display = expanded ? "none" : "flex";
      rangeToggle.classList.toggle("sa-expanded", !expanded);
      rangeWrapper.classList.toggle("sa-range-open", !expanded);
      rangeToggle.setAttribute("aria-expanded", String(!expanded));
    };

    rangeWrapper.append(rangeRow, rangeToggle);
    panel.append(rangeWrapper);

    state.animationPanel = panel;
    if (state.enabled) startAnimation();

    // Always float; stack under palette if palette is floating
    const updateFloat = () => {
      const canvas = document.querySelector("[class*='paper-canvas_paper-canvas']");
      const host = canvas?.parentElement;
      if (!host) return;
      panel.dataset.floating = "true";
      if (panel.parentElement !== host) host.appendChild(panel);

      const margin = 10;
      let top = margin;
      const palette = state.palettePanel;
      const paletteFloating = palette?.dataset?.floating === "true" && palette.parentElement === host;
      if (paletteFloating) {
        top = (palette.offsetTop || 0) + (palette.offsetHeight || 0) + margin;
      }

      Object.assign(panel.style, { right: `${margin}px`, top: `${top}px`, left: "auto" });
    };
    window.addEventListener("resize", updateFloat);
    updateFloat();

    while (true) {
      await addon.tab.waitForElement("[class*='paint-editor_mode-selector']", {
        markAsSeen: false, // Palette already uses markAsSeen:true, can't both mark same element
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
