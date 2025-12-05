// bitmap-skin-pad.js
// Prevent Scratch from auto-resizing (trimming) bitmap skins when saving from the paint editor.

export function installBitmapSkinPad(addon, state) {
  const renderer = addon.tab.traps.vm?.renderer;
  if (!renderer || renderer.__saBitmapSkinPadInstalled) return;
  renderer.__saBitmapSkinPadInstalled = true;

  const originalUpdateBitmapSkin = renderer.updateBitmapSkin?.bind(renderer);
  if (typeof originalUpdateBitmapSkin !== "function") return;

  renderer.updateBitmapSkin = function (skinId, canvas, bitmapResolution, rotationCenter, ...rest) {
    if (!addon.self.disabled && state?.enabled && state.pendingSize?.width && state.pendingSize?.height) {
      const targetWidth = Math.max(canvas?.width || 0, state.pendingSize.width);
      const targetHeight = Math.max(canvas?.height || 0, state.pendingSize.height);

      if (canvas && (canvas.width !== targetWidth || canvas.height !== targetHeight)) {
        const dx = Math.floor((targetWidth - canvas.width) / 2);
        const dy = Math.floor((targetHeight - canvas.height) / 2);

        const padded = Object.assign(document.createElement("canvas"), { width: targetWidth, height: targetHeight });
        const ctx = padded.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas, dx, dy);

        const rc = rotationCenter || { x: canvas.width / 2, y: canvas.height / 2 };
        rotationCenter = { x: rc.x + dx, y: rc.y + dy };
        canvas = padded;
      }
    }

    return originalUpdateBitmapSkin(skinId, canvas, bitmapResolution, rotationCenter, ...rest);
  };
}
