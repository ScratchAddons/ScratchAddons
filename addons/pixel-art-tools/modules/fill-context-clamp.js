// Clamp bitmap fill operations to the pixel-art artboard.
// Tags transparent pixels outside artboard with sentinel color so flood fill stops at boundary.

export function createFillContextClamp(addon, paper, getAllowedRect) {
  let pixelModeActive = false;
  let fillScopeActive = false;
  let fillScopeRect = null;
  let installed = false;

  const sanitizeImageData = (imageData, startX, startY, rect) => {
    const { data, width, height } = imageData;
    const [rx, ry, rx2, ry2] = [
      Math.floor(rect.x),
      Math.floor(rect.y),
      Math.ceil(rect.x + rect.width),
      Math.ceil(rect.y + rect.height),
    ];
    for (let y = 0; y < height; y++) {
      const gy = startY + y;
      for (let x = 0; x < width; x++) {
        const gx = startX + x;
        if (gy >= ry && gy < ry2 && gx >= rx && gx < rx2) continue;
        const idx = (y * width + x) * 4;
        if (data[idx + 3] === 0) [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]] = [1, 2, 3, 0];
      }
    }
  };

  const createClampedContext = (ctx, rect) =>
    new Proxy(ctx, {
      get(target, prop) {
        if (prop === "getImageData")
          return (sx, sy, sw, sh) => {
            const img = target.getImageData(sx, sy, sw, sh);
            sanitizeImageData(img, sx, sy, rect);
            return img;
          };
        if (prop === "putImageData")
          return (...args) => {
            const [img, dx, dy, dirtyX = 0, dirtyY = 0] = args;
            sanitizeImageData(
              img,
              (dx || 0) + (args.length >= 7 ? dirtyX : 0),
              (dy || 0) + (args.length >= 7 ? dirtyY : 0),
              rect
            );
            return target.putImageData(...args);
          };
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
      },
    });

  const looksLikeFillTool = (tool) =>
    ["paint", "setColor", "setColor2", "setGradientType"].every((m) => typeof tool?.[m] === "function");

  const wrapFillTool = (tool) => {
    if (!looksLikeFillTool(tool) || tool.__saFillWrapped) return;
    tool.__saFillWrapped = true;
    const origPaint = tool.paint;
    tool.paint = function (evt) {
      if (addon.self.disabled || !pixelModeActive) return origPaint.call(this, evt);
      const rect = getAllowedRect();
      if (!rect) return origPaint.call(this, evt);
      fillScopeActive = true;
      fillScopeRect = rect;
      try {
        return origPaint.call(this, evt);
      } finally {
        fillScopeActive = false;
        fillScopeRect = null;
      }
    };
  };

  const installPatch = () => {
    if (installed || !paper?.Raster?.prototype?.getContext) return;
    installed = true;

    const origGetContext = paper.Raster.prototype.getContext;
    paper.Raster.prototype.getContext = function (...args) {
      const ctx = origGetContext.apply(this, args);
      return ctx && !addon.self.disabled && pixelModeActive && fillScopeActive && fillScopeRect
        ? createClampedContext(ctx, fillScopeRect)
        : ctx;
    };

    const origGetImageData = paper.Raster.prototype.getImageData;
    if (typeof origGetImageData === "function") {
      paper.Raster.prototype.getImageData = function (...args) {
        const img = origGetImageData.apply(this, args);
        if (!fillScopeActive || !fillScopeRect || !img?.data) return img;
        const [startX, startY] =
          args.length === 4
            ? [args[0] || 0, args[1] || 0]
            : [args[0]?.x ?? args[0]?.left ?? 0, args[0]?.y ?? args[0]?.top ?? 0];
        sanitizeImageData(img, startX, startY, fillScopeRect);
        return img;
      };
    }

    const origActivate = paper.Tool.prototype.activate;
    paper.Tool.prototype.activate = function (...args) {
      const res = origActivate.apply(this, args);
      wrapFillTool(this);
      return res;
    };
    if (paper.tool) wrapFillTool(paper.tool);
  };

  return {
    enable: () => {
      pixelModeActive = true;
      installPatch();
    },
    disable: () => {
      pixelModeActive = false;
      fillScopeActive = false;
      fillScopeRect = null;
    },
  };
}
