export function createAnimationPreview(addon, state, msg) {
  let panel = null;
  let previewImg = null;
  let intervalId = null;
  let currentFrame = -1;
  let fps = 12;
  let exporting = false;
  let paused = false;
  let hidden = addon.settings.get("hideAnimationPreview");
  let rangeStart = null;
  let rangeEnd = null;

  const el = (tag, props = {}, children = []) => {
    const e = Object.assign(document.createElement(tag), props);
    children.forEach((c) => (typeof c === "string" ? (e.textContent = c) : e.appendChild(c)));
    return e;
  };

  const getWorkerUrl = (() => {
    let promise;
    return () => (promise ||= fetch(addon.self.dir + "/../../../libraries/thirdparty/cs/gif.worker.js")
      .then((r) => r.text())
      .then((t) => URL.createObjectURL(new Blob([t], { type: "application/javascript" })))
      .catch(() => addon.self.dir + "/../../../libraries/thirdparty/cs/gif.worker.js"));
  })();

  const getCostumeImages = () => [...(document.querySelector("[class*='selector_list-area']")?.querySelectorAll("img[class*='sprite-image']") || [])];

  const applyRange = (images) => {
    const start = Math.max(1, rangeStart || 1);
    const end = Math.min(images.length, Math.max(start, rangeEnd || images.length));
    return images.slice(start - 1, end);
  };

  const captureFrames = async () => {
    const images = applyRange(getCostumeImages()).filter((img) => img.naturalWidth && img.naturalHeight);
    if (!images.length) return [];
    const { naturalWidth: width, naturalHeight: height } = images[0];
    const canvas = el("canvas", { width, height });
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    return images.map((img) => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const frame = el("canvas", { width, height });
      frame.getContext("2d").drawImage(canvas, 0, 0);
      return frame;
    });
  };

  const exportGif = async () => {
    if (exporting || typeof GIF === "undefined") return;
    exporting = true;
    try {
      const frames = await captureFrames();
      if (!frames.length) return (exporting = false);
      const gif = new window.GIF({
        workers: 2,
        quality: 1,
        width: frames[0].width,
        height: frames[0].height,
        workerScript: await getWorkerUrl(),
      });
      frames.forEach((frame) => gif.addFrame(frame, { delay: Math.max(20, Math.round(1000 / fps)), copy: true }));
      gif.on("finished", (blob) => {
        const url = URL.createObjectURL(blob);
        el("a", { href: url, download: "animation.gif" }).click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        exporting = false;
      });
      gif.on("abort", () => (exporting = false));
      gif.render();
    } catch (e) {
      console.warn("pixel-art-tools: GIF export failed", e);
      exporting = false;
    }
  };

  const updatePreview = () => {
    if (!panel || panel.style.display === "none") return;
    const images = applyRange(getCostumeImages());
    if (!images.length) return;
    currentFrame = (currentFrame + 1) % images.length;
    if (images[currentFrame]?.src && previewImg) previewImg.src = images[currentFrame].src;
  };

  const stopAnimation = () => intervalId && (clearInterval(intervalId), (intervalId = null));
  const startAnimation = () => (stopAnimation(), paused || (intervalId = setInterval(updatePreview, 1000 / fps)));
  const setFps = (v) => ((fps = Math.max(1, Math.min(60, v))), intervalId && startAnimation());

  const show = () => panel && !hidden && ((panel.style.display = "block"), paused || startAnimation());
  const hide = () => panel && ((panel.style.display = "none"), stopAnimation());

  const setupPanel = async () => {
    if (state.palettePanelReady) try { await state.palettePanelReady; } catch {}

    panel = el("section", { className: "sa-pixel-art-animation" });
    panel.style.display = state.enabled && !hidden ? "block" : "none";
    addon.tab.displayNoneWhileDisabled(panel);

    // Header (draggable when floating)
    const header = el("header", { className: "sa-pixel-art-animation-header" }, [msg("animationPreview") || "Preview"]);
    let dragStart = null;
    header.onmousedown = (e) => panel.dataset.floating && (dragStart = { x: e.clientX - panel.offsetLeft, y: e.clientY - panel.offsetTop });
    document.addEventListener("mousemove", (e) => dragStart && Object.assign(panel.style, { left: `${e.clientX - dragStart.x}px`, top: `${e.clientY - dragStart.y}px`, right: "auto" }));
    document.addEventListener("mouseup", () => (dragStart = null));
    panel.appendChild(header);

    // Preview image
    previewImg = el("img", { className: "sa-pixel-art-animation-preview", alt: "Animation preview", onclick: exportGif });

    // Play/pause toggle
    const toggleIcon = el("img", { alt: "", className: "sa-pixel-art-animation-toggle-icon", draggable: false });
    const toggleBtn = el("button", { type: "button", className: "sa-pixel-art-animation-toggle" }, [toggleIcon]);
    const updateToggle = () => {
      toggleIcon.src = `${addon.self.dir}/icons/${paused ? "play" : "pause"}.svg`;
      toggleBtn.title = toggleBtn.ariaLabel = msg(paused ? "animationPlay" : "animationPause") || (paused ? "Play" : "Pause");
      toggleBtn.dataset.paused = String(paused);
    };
    updateToggle();
    toggleBtn.onclick = (e) => (e.stopPropagation(), (paused = !paused), paused ? stopAnimation() : startAnimation(), updateToggle());

    // Export button
    const exportBtn = el("button", { type: "button", className: "sa-pixel-art-animation-export", onclick: (e) => (e.stopPropagation(), exportGif()) }, [msg("animationExport") || "Export GIF"]);

    const previewWrapper = el("div", { className: "sa-pixel-art-animation-preview-wrap" }, [previewImg, toggleBtn, exportBtn]);
    panel.appendChild(previewWrapper);

    // FPS slider
    const tooltip = el("div", { className: "sa-pixel-art-animation-tooltip" });
    const fpsLabel = el("span", {}, ["FPS"]);
    const renderFps = (v) => (fpsLabel.title = tooltip.textContent = `${v} FPS`);
    const fpsSlider = el("input", { type: "range", min: "1", max: "30", value: String(fps), className: "sa-pixel-art-animation-slider" });
    renderFps(fps);
    fpsSlider.onpointerdown = () => ((tooltip.dataset.show = "true"), renderFps(+fpsSlider.value));
    fpsSlider.oninput = (e) => (setFps(+e.target.value), renderFps(+e.target.value));
    fpsSlider.onpointerup = fpsSlider.onpointerleave = (e) => (!e.buttons || e.type === "pointerup") && delete tooltip.dataset.show;
    panel.appendChild(el("div", { className: "sa-pixel-art-animation-fps" }, [fpsLabel, fpsSlider, tooltip]));

    // Range controls
    const makeRangeInput = (setter) => {
      const input = el("input", { type: "number", min: "1", step: "1", placeholder: "" });
      input.onchange = () => {
        const val = input.value.trim();
        setter(val === "" ? null : Math.max(1, Math.floor(+val || 0)));
        if (val === "") input.value = "";
        currentFrame = -1;
        updatePreview();
      };
      return input;
    };
    const rangeRow = el("div", { className: "sa-pixel-art-animation-range", style: "display:none" }, [
      el("div", { className: "sa-pixel-art-animation-range-group" }, [el("span", { className: "sa-pixel-art-animation-range-label" }, [msg("animationRangeStart") || "Start"]), makeRangeInput((v) => (rangeStart = v))]),
      el("div", { className: "sa-pixel-art-animation-range-group" }, [el("span", { className: "sa-pixel-art-animation-range-label" }, [msg("animationRangeEnd") || "End"]), makeRangeInput((v) => (rangeEnd = v))]),
    ]);
    const rangeToggle = el("button", { type: "button", className: "sa-pixel-art-animation-range-toggle", ariaExpanded: "false", title: msg("animationRangeToggle") || "Animation Range" }, [
      el("img", { src: `${addon.self.dir}/icons/range-toggle.svg`, alt: "", className: "sa-pixel-art-animation-range-icon" }),
    ]);
    rangeToggle.onclick = () => {
      const open = rangeRow.style.display !== "flex";
      rangeRow.style.display = open ? "flex" : "none";
      rangeToggle.classList.toggle("sa-expanded", open);
      rangeToggle.ariaExpanded = String(open);
    };
    const rangeWrapper = el("div", { className: "sa-pixel-art-animation-range-wrapper" }, [rangeRow, rangeToggle]);
    panel.appendChild(rangeWrapper);

    state.animationPanel = panel;
    if (state.enabled && !hidden) startAnimation();

    // Floating position
    const updateFloat = () => {
      const host = document.querySelector("[class*='paper-canvas_paper-canvas']")?.parentElement;
      if (!host) return;
      panel.dataset.floating = "true";
      if (panel.parentElement !== host) host.appendChild(panel);
      const palette = state.palettePanel;
      const top = palette?.dataset?.floating === "true" && palette.parentElement === host ? (palette.offsetTop || 0) + (palette.offsetHeight || 0) + 10 : 10;
      Object.assign(panel.style, { right: "10px", top: `${top}px`, left: "auto" });
    };
    window.addEventListener("resize", updateFloat);
    updateFloat();

    while (true) {
      await addon.tab.waitForElement("[class*='paint-editor_mode-selector']", {
        markAsSeen: false,
        reduxEvents: ["scratch-gui/navigation/ACTIVATE_TAB", "scratch-gui/targets/UPDATE_TARGET_LIST", "scratch-paint/formats/CHANGE_FORMAT"],
        reduxCondition: (store) => store.scratchGui.editorTab.activeTabIndex === 1 && !store.scratchGui.mode.isPlayerOnly,
      });
      addon.tab.appendToSharedSpace({ space: "paintEditorModeSelector", element: panel, order: 2 });
      updateFloat();
      state.enabled ? show() : hide();
    }
  };

  addon.settings.addEventListener("change", () => {
    const next = addon.settings.get("hideAnimationPreview");
    if (next !== hidden) (hidden = next) ? hide() : show();
  });

  return { setupPanel, show, hide };
}
