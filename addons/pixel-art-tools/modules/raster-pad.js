// raster-pad.js
// Prevent trimming by making sure getImageData reports opaque corners when pixel mode is active.

export function installRasterPad(addon, state, paper) {
  if (!paper?.Raster || paper.Raster.__saRasterPadInstalled) return;
  paper.Raster.__saRasterPadInstalled = true;

  const originalGetImageData = paper.Raster.prototype.getImageData;
  if (typeof originalGetImageData !== "function") return;

  paper.Raster.prototype.getImageData = function (...args) {
    const imgData = originalGetImageData.apply(this, args);
    if (
      addon.self.disabled ||
      !state?.enabled ||
      !imgData ||
      !imgData.data ||
      imgData.width <= 1 ||
      imgData.height <= 1
    ) {
      return imgData;
    }

    const { width, height, data } = imgData;
    const targetW = Math.min(state.pendingSize?.width || width, width);
    const targetH = Math.min(state.pendingSize?.height || height, height);
    const offsetX = Math.max(0, Math.floor((width - targetW) / 2));
    const offsetY = Math.max(0, Math.floor((height - targetH) / 2));

    const setOpaque = (x, y) => {
      const idx = (y * width + x) * 4;
      data[idx + 0] = data[idx + 0] || 1;
      data[idx + 1] = data[idx + 1] || 1;
      data[idx + 2] = data[idx + 2] || 1;
      data[idx + 3] = Math.max(data[idx + 3], 1); // near-invisible alpha
    };

    setOpaque(offsetX, offsetY);
    setOpaque(offsetX + targetW - 1, offsetY + targetH - 1);
    return imgData;
  };
}
