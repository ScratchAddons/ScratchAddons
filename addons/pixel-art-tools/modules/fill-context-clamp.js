// fill-context-clamp.js
// Clamp bitmap fill operations to the pixel-art artboard without drawing visible guards.
// We tag transparent pixels outside the artboard with an invisible sentinel color during
// getImageData/putImageData, so flood fill (including gradients) stops at the boundary
// but gradients keep their real coordinates because we never move/resize the raster.

export function createFillContextClamp(addon, paper, getAllowedRect) {
  let pixelModeActive = false;
  let fillScopeActive = false;
  let fillScopeRect = null;
  let installed = false;

  const sanitizeImageData = (imageData, startX, startY, rect) => {
    // Rewrite only fully transparent pixels that are outside the artboard.
    // This makes flood-fill see a different color outside the rect, so it can't leak,
    // while leaving any drawn pixels untouched.
    const { data, width, height } = imageData;
    const rx = Math.floor(rect.x);
    const ry = Math.floor(rect.y);
    const rx2 = Math.ceil(rect.x + rect.width);
    const ry2 = Math.ceil(rect.y + rect.height);
    const sentinel = [1, 2, 3, 0];
    for (let y = 0; y < height; y++) {
      const gy = startY + y;
      const inY = gy >= ry && gy < ry2;
      for (let x = 0; x < width; x++) {
        const gx = startX + x;
        const inRect = inY && gx >= rx && gx < rx2;
        if (inRect) continue;
        const idx = (y * width + x) * 4;
        if (data[idx + 3] === 0) {
          data[idx + 0] = sentinel[0];
          data[idx + 1] = sentinel[1];
          data[idx + 2] = sentinel[2];
          data[idx + 3] = sentinel[3];
        }
      }
    }
  };

  const createClampedContext = (ctx, rect) =>
    new Proxy(ctx, {
      get(target, prop) {
        if (prop === "getImageData") {
          return (sx, sy, sw, sh) => {
            // Before the fill algorithm examines the buffer, tag outside pixels.
            const img = target.getImageData(sx, sy, sw, sh);
            sanitizeImageData(img, sx, sy, rect);
            return img;
          };
        }
        if (prop === "putImageData") {
          return (...args) => {
            const img = args[0];
            let dx = args[1] || 0;
            let dy = args[2] || 0;
            if (args.length >= 7) {
              dx += args[3] || 0;
              dy += args[4] || 0;
            }
            // When writing back, keep outside transparent but colored sentinel pixels intact.
            sanitizeImageData(img, dx, dy, rect);
            return target.putImageData(...args);
          };
        }
        const value = target[prop];
        if (typeof value === "function") return value.bind(target);
        return value;
      },
    });

  const looksLikeFillTool = (tool) =>
    typeof tool?.paint === "function" &&
    typeof tool.setColor === "function" &&
    typeof tool.setColor2 === "function" &&
    typeof tool.setGradientType === "function";

  const wrapFillTool = (tool) => {
    if (!looksLikeFillTool(tool) || tool.__saFillWrapped) return;
    tool.__saFillWrapped = true;
    const origPaint = tool.paint;
    tool.paint = function (evt) {
      if (addon.self.disabled || !pixelModeActive) return origPaint.call(this, evt);
      const rect = getAllowedRect();
      if (!rect) return origPaint.call(this, evt);
      // Mark this paint pass so our context/raster hooks can clamp it.
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
    const origGetImageData = paper.Raster.prototype.getImageData;

    paper.Raster.prototype.getContext = function (...args) {
      const ctx = origGetContext.apply(this, args);
      if (!ctx || addon.self.disabled || !pixelModeActive || !fillScopeActive || !fillScopeRect) return ctx;
      // Hand back a proxy context that pretends the world ends at the artboard.
      return createClampedContext(ctx, fillScopeRect);
    };

    if (typeof origGetImageData === "function") {
      paper.Raster.prototype.getImageData = function (...args) {
        const img = origGetImageData.apply(this, args);
        if (!fillScopeActive || !fillScopeRect || !img?.data) return img;
        // Clamp Raster#getImageData too; gradients call getHitBounds(raster) which uses this path.
        let startX = 0;
        let startY = 0;
        if (args.length === 4) {
          startX = args[0] || 0;
          startY = args[1] || 0;
        } else if (args[0] && typeof args[0] === "object") {
          startX = args[0].x ?? args[0].left ?? 0;
          startY = args[0].y ?? args[0].top ?? 0;
        }
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
    enable() {
      pixelModeActive = true;
      installPatch();
    },
    disable() {
      pixelModeActive = false;
      fillScopeActive = false;
      fillScopeRect = null;
    },
  };
}
