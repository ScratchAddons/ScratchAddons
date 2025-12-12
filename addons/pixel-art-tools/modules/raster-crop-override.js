// raster-crop-override.js
// Override Raster#getImageData during pixel mode to bypass Scratch's auto-crop (getHitBounds).

export function installRasterCropOverride(addon, state, paper) {
  if (!paper?.Raster || paper.Raster.__saRasterCropOverrideInstalled) return;
  paper.Raster.__saRasterCropOverrideInstalled = true;

  const shouldOverride = () => state?.enabled && addon.settings.get("preventTrim");

  const originalGetImageData = paper.Raster.prototype.getImageData;
  if (typeof originalGetImageData !== "function") return;

  paper.Raster.prototype.getImageData = function (...args) {
    // getImageData is called twice in update-image-hoc:
    // 1) full canvas to compute bounds (https://github.com/scratchfoundation/scratch-paint/blob/ba45b03ee2913446fa71e6abd2e681188b7bcc9b/src/hocs/update-image-hoc.jsx#L97)
    // 2) cropped to those bounds (https://github.com/scratchfoundation/scratch-paint/blob/ba45b03ee2913446fa71e6abd2e681188b7bcc9b/src/hocs/update-image-hoc.jsx#L106)
    // In step 2 we swap in our own rect that preserves the pixel-mode canvas.
    if (addon.self.disabled || !shouldOverride()) return originalGetImageData.apply(this, args);

    let rect = args[0];
    const isFirstStage = rect && typeof rect === "object" && "_width" in rect;

    if (!isFirstStage) {
      const full = originalGetImageData.call(this); // full canvas
      const canvasWidth = full?.width || this.width || 0;
      const canvasHeight = full?.height || this.height || 0;
      const targetW = Math.min(state.pendingSize?.width || canvasWidth, canvasWidth);
      const targetH = Math.min(state.pendingSize?.height || canvasHeight, canvasHeight);
      // Keep the origin from the hitBounds rect to avoid shifting content; only clamp the size.
      const x = rect?.x || 0;
      const y = rect?.y || 0;
      const wouldCrop = rect && (rect.width > targetW || rect.height > targetH);
      if (wouldCrop && state?.lastAppliedSize) {
        // Revert to the last applied size; do not shrink below current content.
        state.pendingSize = { ...state.lastAppliedSize };
        state.restoreSizePending = true;
        return originalGetImageData.apply(this, args);
      }
      rect = { x, y, width: targetW, height: targetH };
      return originalGetImageData.call(this, rect);
    }

    return originalGetImageData.apply(this, args);
  };
}
