const MAX_CANVAS_SIZE = 1024;
const MIN_CANVAS_SIZE = 1;

// --- helpers ---
const clamp = v => Math.max(MIN_CANVAS_SIZE, Math.min(MAX_CANVAS_SIZE, Math.round(v)));

const createCanvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return c;
};

const findLayer = (paper, key) => paper.project.layers.find(l => l?.data?.[key]) || null;

const getRaster = paper => {
  const layer = findLayer(paper, "isRasterLayer");
  return layer && layer.children.length ? layer.children[0] : null;
};

const insertAt = (layer, item, idx) => {
  const n = layer.children.length;
  if (Number.isInteger(idx) && idx >= 0 && idx <= n) layer.insertChild(idx, item);
  else layer.addChild(item);
};

const buildCheckerboardOverlay = (paper, raster) => {
  const { width, height } = raster.canvas;
  if (!width || !height) return null;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(217,227,242,0.55)";
  for (let y = 0; y < height; y++) {
    const start = (y & 1) ^ 1;
    for (let x = start; x < width; x += 2) ctx.fillRect(x, y, 1, 1);
  }

  const overlay = new paper.Raster(canvas);
  Object.assign(overlay, {
    smoothing: false,
    locked: true,
    guide: true,
    applyMatrix: false,
    position: paper.view.center.clone(),
    data: { isPixelGridOverlay: true }
  });
  return overlay;
};

// --- main module ---
export function createCanvasUtilsModule(paper, state) {
  const backgroundLayer = () => findLayer(paper, "isBackgroundGuideLayer");

  const detachOriginalBackground = () => {
    const layer = backgroundLayer();
    const original = layer?.bitmapBackground;
    if (!layer || !original) return false;

    if (!state.pixelGridOriginal) {
      state.pixelGridOriginal = {
        background: original,
        index: layer.children.indexOf(original),
        visible: original.visible !== false
      };
    }
    original.visible = false;
    if (original.parent === layer) original.remove();
    return true;
  };

  const restoreOriginalBackground = () => {
    const layer = backgroundLayer();
    if (!layer) return;

    state.pixelGridOverlay?.remove();
    state.pixelGridOverlay = null;

    const info = state.pixelGridOriginal;
    if (info?.background) {
      const { background, index, visible } = info;
      if (background.parent !== layer) insertAt(layer, background, index);
      background.visible = visible;
      layer.bitmapBackground = background;
    }
    state.pixelGridOriginal = null;
  };

  const ensureOverlay = () => {
    const layer = backgroundLayer();
    const ras = getRaster(paper);
    if (!layer || !ras || !detachOriginalBackground()) return null;

    const { width, height } = ras.canvas;
    let overlay = state.pixelGridOverlay;
    if (overlay && (overlay.canvas.width !== width || overlay.canvas.height !== height)) {
      overlay.remove();
      overlay = state.pixelGridOverlay = null;
    }

    if (!overlay) {
      overlay = buildCheckerboardOverlay(paper, ras);
      if (!overlay) return null;
      const idx = state.pixelGridOriginal?.index ?? layer.children.length;
      insertAt(layer, overlay, idx);
      state.pixelGridOverlay = overlay;
    } else if (overlay.parent !== layer) {
      layer.addChild(overlay);
    }

    overlay.visible = true;
    overlay.position = paper.view.center.clone();
    layer.bitmapBackground = overlay;
    return overlay;
  };

  const applyPixelGrid = enabled => {
    if (enabled) ensureOverlay();
    else restoreOriginalBackground();
  };

  const resizeBitmapCanvas = (width, height) => {
    const ras = getRaster(paper);
    if (!ras) return;

    const newW = clamp(width);
    const newH = clamp(height);

    const newCanvas = createCanvas(newW, newH);
    const ctx = newCanvas.getContext("2d");
    const old = ras.canvas;

    if (old) {
      const w = Math.min(newW, old.width);
      const h = Math.min(newH, old.height);
      ctx.drawImage(old, 0, 0, w, h, 0, 0, w, h);
    }

    ras.image = newCanvas;
    ras.position = paper.view.center.clone();

    if (state.enabled) ensureOverlay();
  };

  const handleFormatChange = format => {
    const val = typeof format === "string" ? format : format?.format || format?.name || "";
    const isBitmap = typeof val === "string" && val.toUpperCase().startsWith("BITMAP");
    if (!state.enabled) { restoreOriginalBackground(); return; }
    if (isBitmap) ensureOverlay();
    else restoreOriginalBackground();
  };

  return { applyPixelGrid, resizeBitmapCanvas, handleFormatChange };
}
