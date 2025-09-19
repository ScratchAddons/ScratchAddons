const MAX_CANVAS_SIZE = 1024;
const MIN_CANVAS_SIZE = 1;

export function createCanvasUtilsModule(paper, state) {
  const clampSize = (value) => Math.max(MIN_CANVAS_SIZE, Math.min(MAX_CANVAS_SIZE, Math.round(value)));

  const createCanvasElement = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return canvas;
  };

  const getBackgroundLayer = () => {
    for (const layer of paper.project.layers) {
      if (layer?.data?.isBackgroundGuideLayer) {
        return layer;
      }
    }
    return null;
  };

  const getRaster = () => {
    for (const layer of paper.project.layers) {
      if (layer?.data?.isRasterLayer) {
        if (layer.children.length === 0) return null;
        return layer.children[0];
      }
    }
    return null;
  };

  const detachOriginalBackground = () => {
    const backgroundLayer = getBackgroundLayer();
    const original = backgroundLayer?.bitmapBackground;
    if (!backgroundLayer || !original) {
      return false;
    }

    if (!state.pixelGridOriginal) {
      state.pixelGridOriginal = {
        background: original,
        index: backgroundLayer.children.indexOf(original),
        visible: original.visible !== false,
      };
    }

    original.visible = false;
    if (original.parent === backgroundLayer) {
      original.remove();
    }
    return true;
  };

  const restoreOriginalBackground = () => {
    const backgroundLayer = getBackgroundLayer();
    if (!backgroundLayer) return;

    if (state.pixelGridOverlay) {
      state.pixelGridOverlay.remove();
      state.pixelGridOverlay = null;
    }

    const originalInfo = state.pixelGridOriginal;
    if (originalInfo && originalInfo.background) {
      const { background, index, visible } = originalInfo;
      if (background.parent !== backgroundLayer) {
        if (typeof index === "number" && index >= 0 && index <= backgroundLayer.children.length) {
          backgroundLayer.insertChild(index, background);
        } else {
          backgroundLayer.addChild(background);
        }
      }
      background.visible = visible;
      backgroundLayer.bitmapBackground = background;
    }

    state.pixelGridOriginal = null;
  };

  const buildCheckerboardOverlay = () => {
    const raster = getRaster();
    const backgroundLayer = getBackgroundLayer();
    if (!raster || !backgroundLayer) return null;

    const width = raster.canvas.width;
    const height = raster.canvas.height;
    if (!width || !height) return null;

    const canvas = createCanvasElement(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(217, 227, 242, 0.55)";
    for (let y = 0; y < height; y++) {
      const start = (y & 1) === 0 ? 1 : 0;
      for (let x = start; x < width; x += 2) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const overlay = new paper.Raster(canvas);
    overlay.smoothing = false;
    overlay.locked = true;
    overlay.guide = true;
    overlay.applyMatrix = false;
    overlay.data.isPixelGridOverlay = true;
    overlay.position = paper.view.center.clone();
    return overlay;
  };

  const ensureOverlay = () => {
    const backgroundLayer = getBackgroundLayer();
    const raster = getRaster();
    if (!backgroundLayer || !raster) return null;

    if (!detachOriginalBackground()) {
      return null;
    }

    const neededWidth = raster.canvas.width;
    const neededHeight = raster.canvas.height;

    let overlay = state.pixelGridOverlay;
    if (overlay) {
      if (overlay.canvas.width !== neededWidth || overlay.canvas.height !== neededHeight) {
        overlay.remove();
        overlay = null;
        state.pixelGridOverlay = null;
      }
    }

    if (!overlay) {
      overlay = buildCheckerboardOverlay();
      if (!overlay) return null;
      const insertIndex = state.pixelGridOriginal?.index ?? backgroundLayer.children.length;
      if (typeof insertIndex === "number" && insertIndex >= 0 && insertIndex <= backgroundLayer.children.length) {
        backgroundLayer.insertChild(insertIndex, overlay);
      } else {
        backgroundLayer.addChild(overlay);
      }
      state.pixelGridOverlay = overlay;
    } else if (overlay.parent !== backgroundLayer) {
      backgroundLayer.addChild(overlay);
    }

    overlay.visible = true;
    overlay.position = paper.view.center.clone();
    backgroundLayer.bitmapBackground = overlay;
    return overlay;
  };

  const applyPixelGrid = (enabled) => {
    if (enabled) {
      ensureOverlay();
    } else {
      restoreOriginalBackground();
    }
  };

  const resizeBitmapCanvas = (width, height) => {
    const raster = getRaster();
    if (!raster) return;

    const newWidth = clampSize(width);
    const newHeight = clampSize(height);

    const newCanvas = createCanvasElement(newWidth, newHeight);
    const ctx = newCanvas.getContext("2d");
    const oldCanvas = raster.canvas;
    if (oldCanvas) {
      const copyW = Math.min(newWidth, oldCanvas.width);
      const copyH = Math.min(newHeight, oldCanvas.height);
      ctx.drawImage(oldCanvas, 0, 0, copyW, copyH, 0, 0, copyW, copyH);
    }

    raster.image = newCanvas;
    raster.position = paper.view.center.clone();

    if (state.enabled) {
      ensureOverlay();
    }
  };

  const handleFormatChange = (format) => {
    const formatValue = typeof format === "string" ? format : format?.format || format?.name || "";
    const isBitmapFormat = typeof formatValue === "string" && formatValue.toUpperCase().startsWith("BITMAP");

    if (!state.enabled) {
      restoreOriginalBackground();
      return;
    }

    if (isBitmapFormat) {
      ensureOverlay();
    } else {
      restoreOriginalBackground();
    }
  };

  return {
    applyPixelGrid,
    resizeBitmapCanvas,
    handleFormatChange,
  };
}
