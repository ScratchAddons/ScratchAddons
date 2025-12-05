// canvas-adjuster.js
export function createCanvasAdjuster(paper) {
  const getBgLayer = () => paper.project.layers.find((l) => l?.data?.isBackgroundGuideLayer);
  const getOutlineLayer = () => paper.project.layers.find((l) => l?.data?.isOutlineLayer);
  const getGuideLayer = () => paper.project.layers.find((l) => l?.data?.isGuideLayer);

  let originalBg = null,
    originalOutline = null;
  let bgCenter = null,
    outlineCenter = null;
  let clickHiderAttached = false;
  let gateInstalled = false;
  let helpersHidden = false;

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

  // Patch activation so tools created on click are gated
  function installToolGate() {
    if (gateInstalled) return;
    gateInstalled = true;

    const origActivate = paper.Tool.prototype.activate;
    paper.Tool.prototype.activate = function (...args) {
      const res = origActivate.apply(this, args);
      wrapToolOnce(this);
      return res;
    };

    // Gate current active tool if any
    if (paper.tool) wrapToolOnce(paper.tool);
  }

  // Hide helper cursor outside artboard. Show and reposition on mouseup.
  const installClickHider = () => {
    if (clickHiderAttached) return;
    clickHiderAttached = true;

    paper.view.on("mousedown", (e) => {
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
