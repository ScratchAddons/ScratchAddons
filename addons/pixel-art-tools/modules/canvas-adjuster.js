// canvas-adjuster.js
export function createCanvasAdjuster(paper) {
  const getBgLayer      = () => paper.project.layers.find(l => l?.data?.isBackgroundGuideLayer);
  const getOutlineLayer = () => paper.project.layers.find(l => l?.data?.isOutlineLayer);
  const getGuideLayer   = () => paper.project.layers.find(l => l?.data?.isGuideLayer);

  let originalBg = null, originalOutline = null;
  let bgCenter = null, outlineCenter = null;
  let clickHiderAttached = false;

  const makeChecker = (w, h, size) => {
    const g = new paper.Group();
    for (let y = 0; y < h; y += size) for (let x = 0; x < w; x += size)
      g.addChild(new paper.Path.Rectangle({point:[x,y], size, fillColor:(x/size+y/size)%2?"#D9E3F2":"#fff"}));
    return g;
  };

  const makeOutline = (w, h) => {
    const r = new paper.Rectangle(0, 0, w, h);
    const white = new paper.Shape.Rectangle(r.expand(1)); white.strokeWidth = 2; white.strokeColor = "white";
    const blue  = new paper.Shape.Rectangle(r.expand(5)); blue.strokeWidth  = 2; blue.strokeColor  = "#4280D7"; blue.opacity = 0.25;
    return [white, blue];
  };

  const getAllowedRect = () => getOutlineLayer()?.data?.artboardRect || null;

  // Hack: do not touch canvas or tools internally, wrap handlers and synthesize end/start at boundary
  const wrapToolOnce = (tool) => {
    if (!tool || tool.__gated) return; tool.__gated = true;
    const down = tool.onMouseDown, drag = tool.onMouseDrag, up = tool.onMouseUp;

    tool.onMouseDown = function(evt) {
      const rect = getAllowedRect(); if (!rect || !down) return down?.call(this, evt);
      this.__strokeBlocked = !rect.contains(evt.point); this.__paused = false;
      this.__lastInsidePoint = rect.contains(evt.point) ? evt.point.clone() : null;
      if (this.__strokeBlocked) return;
      return down.call(this, evt);
    };

    tool.onMouseDrag = function(evt) {
      const rect = getAllowedRect(); if (!rect) return drag?.call(this, evt);
      if (this.__strokeBlocked) return;
      const inside = rect.contains(evt.point);
      if (inside) {
        if (this.__paused && down) { this.__paused = false; down.call(this, evt); }
        this.__lastInsidePoint = evt.point.clone();
        return drag?.call(this, evt);
      } else {
        if (!this.__paused && up && this.__lastInsidePoint) up.call(this, Object.assign({}, evt, {point:this.__lastInsidePoint}));
        this.__paused = true; return;
      }
    };

    tool.onMouseUp = function(evt) {
      const rect = getAllowedRect(); if (!rect) return up?.call(this, evt);
      if (this.__strokeBlocked) { this.__strokeBlocked = false; this.__paused = false; this.__lastInsidePoint = null; return; }
      if (rect.contains(evt.point)) { const res = up?.call(this, evt); this.__paused = false; this.__lastInsidePoint = null; return res; }
      this.__paused = false; this.__lastInsidePoint = null; return;
    };
  };

  const gateExistingTools = () => { (paper.tools || []).forEach(wrapToolOnce); if (paper.tool) wrapToolOnce(paper.tool); };

  // Hack: BrushTool cursorPreview lives on guide layer with data.isHelperItem. Hide on outside click, show and reposition on mouseup.
  const installClickHider = () => {
    if (clickHiderAttached) return; clickHiderAttached = true;

    paper.view.on("mousedown", (e) => {
      const rect = getAllowedRect(); const inside = rect ? rect.contains(e.point) : true; if (inside) return;
      const gl = getGuideLayer(); if (!gl) return;
      gl.children.forEach(ch => { if (ch?.data?.isHelperItem) ch.visible = false; });
    });

    paper.view.on("mouseup", (e) => {
      const gl = getGuideLayer(); if (!gl) return;
      gl.children.forEach(ch => {
        if (ch?.data?.isHelperItem) { ch.visible = true; if (e?.point) ch.position = new paper.Point(~~e.point.x, ~~e.point.y); }
      });
    });
  };

  const enable = (w, h, size = 16) => {
    const bg = getBgLayer(); if (!bg?.bitmapBackground) return;
    originalBg ||= bg.bitmapBackground; bgCenter ||= originalBg.position.clone();
    bg.bitmapBackground.remove(); const g = makeChecker(w, h, size); g.position = bgCenter; bg.addChild(g);
    bg.bitmapBackground = g; if (bg.vectorBackground) bg.vectorBackground.visible = false;

    const ol = getOutlineLayer();
    if (ol) {
      if (!originalOutline) { outlineCenter = ol.bounds.center.clone(); originalOutline = ol.removeChildren(); } else ol.removeChildren();
      const [white, blue] = makeOutline(w, h); white.position = outlineCenter; blue.position = outlineCenter; ol.addChildren([white, blue]);
      ol.data.artboardRect = new paper.Rectangle(outlineCenter.subtract(new paper.Point(w/2, h/2)), new paper.Size(w, h));
    }

    gateExistingTools(); installClickHider();
  };

  const disable = () => {
    const bg = getBgLayer();
    if (bg && originalBg) { if (bg.bitmapBackground !== originalBg) bg.bitmapBackground.remove(); if (!originalBg.parent) bg.addChild(originalBg);
      bg.bitmapBackground = originalBg; if (bg.vectorBackground) bg.vectorBackground.visible = true; }
    const ol = getOutlineLayer();
    if (ol && originalOutline) { ol.removeChildren(); ol.addChildren(originalOutline); delete ol.data.artboardRect; }
  };

  return { enable, disable };
}
