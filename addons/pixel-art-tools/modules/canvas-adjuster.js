import { createFillContextClamp } from "./fill-context-clamp.js";

export function createCanvasAdjuster(addon, paper) {
  const getLayer = (key) => paper.project.layers.find((l) => l?.data?.[key]);
  const getBgLayer = () => getLayer("isBackgroundGuideLayer");
  const getOutlineLayer = () => getLayer("isOutlineLayer");
  const getGuideLayer = () => getLayer("isGuideLayer");

  let originalBg = null,
    originalOutline = null,
    bgCenter = null,
    outlineCenter = null;
  let lastEnabledSize = null,
    lastChecker = null,
    clickHiderAttached = false,
    gateInstalled = false,
    helpersHidden = false;
  const getAllowedRect = () => getOutlineLayer()?.data?.artboardRect || null;
  const fillContextClamp = createFillContextClamp(addon, paper, getAllowedRect);

  const makeChecker = (w, h, size) => {
    const [cols, rows] = [Math.ceil(w / size), Math.ceil(h / size)];
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
    const blue = new paper.Shape.Rectangle(r.expand(6));
    Object.assign(white, { strokeWidth: 2, strokeColor: "white", guide: true });
    Object.assign(blue, { strokeWidth: 2, strokeColor: "#4280D7", opacity: 0.25, guide: true });
    return [white, blue];
  };

  const OUTLINE_FIT_MARGIN = 12,
    FIT_PADDING_RATIO = 0.95;
  const fitViewToArtboard = (w, h) => {
    const view = paper?.view;
    if (!view) return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const rect = view.element?.getBoundingClientRect?.();
        const [availW, availH] = [rect?.width || view.size?.width || 0, rect?.height || view.size?.height || 0];
        if (!availW || !availH) return;
        const zoom = Math.min(availW / (w + OUTLINE_FIT_MARGIN), availH / (h + OUTLINE_FIT_MARGIN)) * FIT_PADDING_RATIO;
        if (Number.isFinite(zoom) && zoom > 0) {
          view.zoom = zoom;
          if (outlineCenter) view.center = outlineCenter.clone();
          view.update?.();
        }
      })
    );
  };

  function wrapToolOnce(tool) {
    if (!tool || tool.__gated || !tool.onMouseDown) return;
    tool.__gated = true;
    const [down, drag, up] = [tool.onMouseDown, tool.onMouseDrag, tool.onMouseUp];
    const reset = (t) => {
      t.__strokeBlocked = false;
      t.__paused = false;
      t.__lastInsidePoint = null;
    };

    tool.onMouseDown = function (evt) {
      if (addon.self.disabled) return down?.call(this, evt);
      const rect = getAllowedRect();
      if (!rect || !down) return down?.call(this, evt);
      this.__strokeBlocked = !rect.contains(evt.point);
      this.__paused = false;
      this.__lastInsidePoint = rect.contains(evt.point) ? evt.point.clone() : null;
      if (this.__strokeBlocked) return paper.project.selectedItems.length > 0 ? down.call(this, evt) : undefined;
      return down.call(this, evt);
    };

    tool.onMouseDrag = function (evt) {
      if (addon.self.disabled) return drag?.call(this, evt);
      const rect = getAllowedRect();
      if (!rect) return drag?.call(this, evt);
      if (this.__strokeBlocked) return;
      if (rect.contains(evt.point)) {
        if (this.__paused && down) {
          this.__paused = false;
          down.call(this, evt);
        }
        this.__lastInsidePoint = evt.point.clone();
        return drag?.call(this, evt);
      }
      if (!this.__paused && up && this.__lastInsidePoint) up.call(this, { ...evt, point: this.__lastInsidePoint });
      this.__paused = true;
    };

    tool.onMouseUp = function (evt) {
      if (addon.self.disabled) return up?.call(this, evt);
      const rect = getAllowedRect();
      if (!rect) return up?.call(this, evt);
      if (this.__strokeBlocked) return reset(this);
      if (rect.contains(evt.point)) {
        const res = up?.call(this, evt);
        reset(this);
        return res;
      }
      reset(this);
    };
  }

  function installToolGate() {
    if (gateInstalled) return;
    gateInstalled = true;
    const origActivate = paper.Tool.prototype.activate;
    paper.Tool.prototype.activate = function (...args) {
      const res = origActivate.apply(this, args);
      if (!addon.self.disabled) wrapToolOnce(this);
      return res;
    };
    if (paper.tool) wrapToolOnce(paper.tool);
  }

  const installClickHider = () => {
    if (clickHiderAttached) return;
    clickHiderAttached = true;
    const setHelpers = (visible) =>
      getGuideLayer()?.children.forEach((ch) => ch?.data?.isHelperItem && (ch.visible = visible));

    paper.view.on("mousedown", (e) => {
      if (addon.self.disabled) return;
      const rect = getAllowedRect();
      if (!rect || rect.contains(e.point)) {
        helpersHidden = false;
        return;
      }
      setHelpers(false);
      helpersHidden = true;
    });

    paper.view.on("mouseup", () => {
      if (addon.self.disabled || !helpersHidden) return;
      helpersHidden = false;
      setHelpers(true);
    });
  };

  const enable = (w, h, options = null) => {
    fillContextClamp.enable();
    const bg = getBgLayer();
    if (!bg?.bitmapBackground) return;
    originalBg ||= bg.bitmapBackground;
    bgCenter ||= originalBg.position.clone();

    const ol = getOutlineLayer();
    const canReuse =
      lastEnabledSize?.width === w &&
      lastEnabledSize?.height === h &&
      lastChecker?.parent === bg &&
      bg.bitmapBackground === lastChecker &&
      (!ol?.data?.artboardRect || (ol.data.artboardRect.width === w && ol.data.artboardRect.height === h));

    if (canReuse) {
      installToolGate();
      installClickHider();
      if (options?.fitView) fitViewToArtboard(w, h);
      return;
    }

    bg.bitmapBackground.remove();
    const g = makeChecker(w, h, 1);
    lastChecker = g;
    lastEnabledSize = { width: w, height: h };
    g.position = bgCenter;
    bg.addChild(g);
    bg.bitmapBackground = g;
    if (bg.vectorBackground) bg.vectorBackground.visible = false;

    if (ol) {
      if (!originalOutline) {
        outlineCenter = ol.bounds.center.clone();
        originalOutline = ol.removeChildren();
      } else ol.removeChildren();
      const [white, blue] = makeOutline(w, h);
      white.position = blue.position = outlineCenter;
      ol.addChildren([white, blue]);
      ol.data.artboardRect = new paper.Rectangle(
        outlineCenter.subtract(new paper.Point(w / 2, h / 2)),
        new paper.Size(w, h)
      );
    }

    installToolGate();
    installClickHider();
    if (options?.fitView) fitViewToArtboard(w, h);
  };

  const disable = () => {
    fillContextClamp.disable();
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
