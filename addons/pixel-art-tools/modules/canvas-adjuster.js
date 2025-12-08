// canvas-adjuster.js
export function createCanvasAdjuster(addon, paper) {
  const getBgLayer = () => paper.project.layers.find((l) => l?.data?.isBackgroundGuideLayer);
  const getOutlineLayer = () => paper.project.layers.find((l) => l?.data?.isOutlineLayer);
  const getGuideLayer = () => paper.project.layers.find((l) => l?.data?.isGuideLayer);
  const getRasterItem = () => {
    const rasterLayer = paper.project.layers.find((l) => l?.data?.isRasterLayer);
    return rasterLayer?.children?.[0] || null;
  };
  let pixelModeActive = false;
  let fillScopeActive = false;
  let fillScopeRect = null;

  let originalBg = null,
    originalOutline = null;
  let bgCenter = null,
    outlineCenter = null;
  let clickHiderAttached = false;
  let gateInstalled = false;
  let helpersHidden = false;
  let fillPatchInstalled = false;

  const sanitizeImageData = (imageData, startX, startY, rect) => {
    const { data } = imageData;
    const { width, height } = imageData;
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
        // Only change empty pixels so we don't alter drawn content
        if (data[idx + 3] === 0) {
          data[idx + 0] = sentinel[0];
          data[idx + 1] = sentinel[1];
          data[idx + 2] = sentinel[2];
          data[idx + 3] = sentinel[3];
        }
      }
    }
  };

  const createClampedContext = (ctx, rect) => {
    return new Proxy(ctx, {
      get(target, prop) {
        if (prop === "getImageData") {
          return (sx, sy, sw, sh) => {
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
            // Optional dirty rect signature: putImageData(img, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)
            if (args.length >= 7) {
              dx += args[3] || 0;
              dy += args[4] || 0;
            }
            sanitizeImageData(img, dx, dy, rect);
            return target.putImageData(...args);
          };
        }
        const value = target[prop];
        if (typeof value === "function") return value.bind(target);
        return value;
      },
    });
  };

  const installFillContextPatch = () => {
    if (fillPatchInstalled || !paper?.Raster?.prototype?.getContext) return;
    fillPatchInstalled = true;
    const origGetContext = paper.Raster.prototype.getContext;
    const origGetImageData = paper.Raster.prototype.getImageData;

    paper.Raster.prototype.getContext = function (...args) {
      const ctx = origGetContext.apply(this, args);
      if (!ctx || addon.self.disabled || !pixelModeActive || !fillScopeActive || !fillScopeRect) return ctx;
      return createClampedContext(ctx, fillScopeRect);
    };

    if (typeof origGetImageData === "function") {
      paper.Raster.prototype.getImageData = function (...args) {
        const img = origGetImageData.apply(this, args);
        if (!fillScopeActive || !fillScopeRect || !img?.data) return img;
        // args[0] might be a Rectangle or x,y,width,height
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
  };

  const makeChecker = (w, h, size) => {
    const cols = Math.ceil(w / size),
      rows = Math.ceil(h / size);
    const base = new paper.Shape.Rectangle([0, 0], [cols, rows]);
    base.fillColor = "#fff";
    const pts = [];
    let x = 0,
      y = 0;
    while (x < cols) {
      pts.push([x, y]);
      x++;
      pts.push([x, y]);
      y = y ? 0 : rows;
    }
    y = rows - 1;
    x = cols;
    while (y > 0) {
      pts.push([x, y]);
      x = x ? 0 : cols;
      pts.push([x, y]);
      y--;
    }
    const path = new paper.Path(pts);
    path.fillRule = "evenodd";
    path.fillColor = "#D9E3F2";
    const mask = new paper.Shape.Rectangle(new paper.Rectangle(0, 0, w / size, h / size));
    mask.clipMask = true;
    const g = new paper.Group([base, path, mask]);
    g.scale(size);
    return g;
  };

  const makeOutline = (w, h) => {
    const r = new paper.Rectangle(0, 0, w, h);
    const white = new paper.Shape.Rectangle(r.expand(2));
    white.strokeWidth = 2;
    white.strokeColor = "white";
    white.guide = true;
    const blue = new paper.Shape.Rectangle(r.expand(6));
    blue.strokeWidth = 2;
    blue.strokeColor = "#4280D7";
    blue.opacity = 0.25;
    blue.guide = true;
    return [white, blue];
  };

  const getAllowedRect = () => getOutlineLayer()?.data?.artboardRect || null;

  // Gate a tool's handlers to the artboard rect
  function wrapToolOnce(tool) {
    if (!tool || tool.__gated || !tool.onMouseDown) return;
    tool.__gated = true;

    const down = tool.onMouseDown;
    const drag = tool.onMouseDrag;
    const up = tool.onMouseUp;

    tool.onMouseDown = function (evt) {
      if (addon.self.disabled) return down?.call(this, evt);
      const rect = getAllowedRect();
      if (!rect || !down) return down?.call(this, evt);
      this.__strokeBlocked = !rect.contains(evt.point);
      this.__paused = false;
      this.__lastInsidePoint = rect.contains(evt.point) ? evt.point.clone() : null;
      if (this.__strokeBlocked) {
        // Only let mousedown through if there's a selection to deselect
        if (paper.project.selectedItems.length > 0) {
          return down.call(this, evt);
        }
        return;
      }
      return down.call(this, evt);
    };

    tool.onMouseDrag = function (evt) {
      if (addon.self.disabled) return drag?.call(this, evt);
      const rect = getAllowedRect();
      if (!rect) return drag?.call(this, evt);
      if (this.__strokeBlocked) return;

      const inside = rect.contains(evt.point);
      if (inside) {
        if (this.__paused && down) {
          this.__paused = false;
          down.call(this, evt);
        }
        this.__lastInsidePoint = evt.point.clone();
        return drag?.call(this, evt);
      } else {
        if (!this.__paused && up && this.__lastInsidePoint) {
          up.call(this, Object.assign({}, evt, { point: this.__lastInsidePoint }));
        }
        this.__paused = true;
        return;
      }
    };

    tool.onMouseUp = function (evt) {
      if (addon.self.disabled) return up?.call(this, evt);
      const rect = getAllowedRect();
      if (!rect) return up?.call(this, evt);
      if (this.__strokeBlocked) {
        this.__strokeBlocked = false;
        this.__paused = false;
        this.__lastInsidePoint = null;
        return;
      }
      if (rect.contains(evt.point)) {
        const res = up?.call(this, evt);
        this.__paused = false;
        this.__lastInsidePoint = null;
        return res;
      }
      this.__paused = false;
      this.__lastInsidePoint = null;
      return;
    };
  }

  const looksLikeFillTool = (tool) =>
    typeof tool.paint === "function" &&
    typeof tool.setColor === "function" &&
    typeof tool.setColor2 === "function" &&
    typeof tool.setGradientType === "function";

  function wrapFillTool(tool) {
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
  }

  // Patch activation so tools created on click are gated (and filled)
  function installToolGate() {
    if (gateInstalled) return;
    gateInstalled = true;

    const origActivate = paper.Tool.prototype.activate;
    paper.Tool.prototype.activate = function (...args) {
      const res = origActivate.apply(this, args);
      if (!addon.self.disabled) wrapToolOnce(this);
      wrapFillTool(this);
      return res;
    };

    // Gate current active tool if any
    if (paper.tool) {
      wrapToolOnce(paper.tool);
      wrapFillTool(paper.tool);
    }
  }

  // Hide helper cursor outside artboard. Show and reposition on mouseup.
  const installClickHider = () => {
    if (clickHiderAttached) return;
    clickHiderAttached = true;

    paper.view.on("mousedown", (e) => {
      if (addon.self.disabled) return;
      const rect = getAllowedRect();
      const inside = rect ? rect.contains(e.point) : true;
      if (inside) {
        helpersHidden = false;
        return;
      }
      const gl = getGuideLayer();
      if (!gl) return;
      gl.children.forEach((ch) => {
        if (ch?.data?.isHelperItem) ch.visible = false;
      });
      helpersHidden = true;
    });

    paper.view.on("mouseup", (e) => {
      if (addon.self.disabled) return;
      if (!helpersHidden) return;
      helpersHidden = false;
      const gl = getGuideLayer();
      if (!gl) return;
      gl.children.forEach((ch) => {
        if (ch?.data?.isHelperItem) {
          ch.visible = true;
        }
      });
    });
  };

  const enable = (w, h) => {
    pixelModeActive = true;
    installFillContextPatch();
    const bg = getBgLayer();
    if (!bg?.bitmapBackground) return;
    originalBg ||= bg.bitmapBackground;
    bgCenter ||= originalBg.position.clone();
    bg.bitmapBackground.remove();
    const g = makeChecker(w, h, 1);
    g.position = bgCenter;
    bg.addChild(g);
    bg.bitmapBackground = g;
    if (bg.vectorBackground) bg.vectorBackground.visible = false;

    const ol = getOutlineLayer();
    if (ol) {
      if (!originalOutline) {
        outlineCenter = ol.bounds.center.clone();
        originalOutline = ol.removeChildren();
      } else ol.removeChildren();
      const [white, blue] = makeOutline(w, h);
      white.position = outlineCenter;
      blue.position = outlineCenter;
      ol.addChildren([white, blue]);
      ol.data.artboardRect = new paper.Rectangle(
        outlineCenter.subtract(new paper.Point(w / 2, h / 2)),
        new paper.Size(w, h)
      );
    }

    installToolGate();
    installClickHider();
  };

  const disable = () => {
    pixelModeActive = false;
    const bg = getBgLayer();
    if (bg && originalBg) {
      if (bg.bitmapBackground !== originalBg) bg.bitmapBackground.remove();
      if (!originalBg.parent) bg.addChild(originalBg);
      bg.bitmapBackground = originalBg;
      if (bg.vectorBackground) bg.vectorBackground.visible = true;
    }
    const ol = getOutlineLayer();
    if (ol && originalOutline) {
      ol.removeChildren();
      ol.addChildren(originalOutline);
      delete ol.data.artboardRect;
    }
  };

  return { enable, disable };
}
