export function createCanvasUtilsModule(paper, state) {
  const getBackground = () => {
    for (const layer of paper.project.layers) {
      if (layer?.data?.isBackgroundGuideLayer) {
        return layer.bitmapBackground;
      }
    }
    return null;
  };

  const applyPixelGrid = (enabled) => {
    const background = getBackground();
    if (!background) return;
    if (enabled) {
      if (!state.backgroundScaling) {
        state.backgroundScaling = background.scaling.clone();
      }
      if (!state.backgroundPosition) {
        state.backgroundPosition = background.position.clone();
      }
      background.scaling = new paper.Point(1, 1);
      background.position = paper.view.center;
    } else if (state.backgroundScaling) {
      background.scaling = state.backgroundScaling;
      background.position = state.backgroundPosition;
    }
  };

  const getRaster = () => {
    for (const layer of paper.project.layers) {
      if (layer?.data?.isRasterLayer) {
        return layer.children[0];
      }
    }
    return null;
  };

  const resizeBitmapCanvas = (width, height) => {
    const raster = getRaster();
    if (!raster) return;
    width = Math.max(1, Math.min(1024, Math.round(width)));
    height = Math.max(1, Math.min(1024, Math.round(height)));
    const newCanvas = document.createElement("canvas");
    newCanvas.width = width;
    newCanvas.height = height;
    const ctx = newCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const oldCanvas = raster.canvas;
    if (oldCanvas) {
      ctx.drawImage(
        oldCanvas,
        0,
        0,
        Math.min(width, oldCanvas.width),
        Math.min(height, oldCanvas.height),
        0,
        0,
        Math.min(width, oldCanvas.width),
        Math.min(height, oldCanvas.height)
      );
    }
    raster.image = newCanvas;
    raster.position = paper.view.center;
  };

  return {
    applyPixelGrid,
    resizeBitmapCanvas,
  };
}
