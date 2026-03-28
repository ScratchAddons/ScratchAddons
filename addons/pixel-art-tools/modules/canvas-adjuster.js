import { createFillContextClamp } from "./fill-context-clamp.js";

export function createCanvasAdjuster(addon, paper) {
  const getLayer = (key) => paper.project.layers.find((l) => l?.data?.[key]);
  const getBgLayer = () => getLayer("isBackgroundGuideLayer");
  const getOutlineLayer = () => getLayer("isOutlineLayer");
  const getGuideLayer = () => getLayer("isGuideLayer");
  const colorToCss = (color, fallback) => color?.toCSS?.(true) || color?.toCSS?.() || color || fallback;
  const getCanvasColors = () => {
    const bg = getBgLayer();
    const artboard = bg?.vectorBackground?._children?.[1]?._children?.[0]?.fillColor;
    const checker = bg?.vectorBackground?._children?.[1]?._children?.[1]?.fillColor;
    return {
      artboard: colorToCss(artboard, "#fff"),
      checker: colorToCss(checker, "#D9E3F2"),
    };
  };

  let originalBg = null,
    originalOutline = null,
    bgCenter = null,
    outlineCenter = null;
  let lastEnabledSize = null,
    lastChecker = null,
    clickHiderAttached = false,
    gateInstalled = false,
    helpersHidden = false,
    themeWatcher = null,
    lastThemeSignature = null;
  const getAllowedRect = () => getOutlineLayer()?.data?.artboardRect || null;
  const fillContextClamp = createFillContextClamp(addon, paper, getAllowedRect);
  const getThemeSignature = (colors) => `${colors.artboard}|${colors.checker}`;

  const makeChecker = (w, h, size, colors) => {
    const canvas = Object.assign(document.createElement("canvas"), { width: w, height: h });
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;

    const tile = Object.assign(document.createElement("canvas"), { width: size * 2, height: size * 2 });
    const tileContext = tile.getContext("2d");
    tileContext.imageSmoothingEnabled = false;
    tileContext.fillStyle = colors.artboard;
    tileContext.fillRect(0, 0, tile.width, tile.height);
    tileContext.fillStyle = colors.checker;
    tileContext.fillRect(0, 0, size, size);
    tileContext.fillRect(size, size, size, size);

    const pattern = context.createPattern(tile, "repeat");
    context.fillStyle = pattern;
    context.fillRect(0, 0, w, h);

    const raster = new paper.Raster(canvas);
    raster.guide = true;
    raster.locked = true;
    return raster;
  };

  const makeOutline = (w, h, colors) => {
    const r = new paper.Rectangle(0, 0, w, h);
    const white = new paper.Shape.Rectangle(r.expand(2));
    const blue = new paper.Shape.Rectangle(r.expand(6));
    Object.assign(white, { strokeWidth: 2, strokeColor: colors.artboard, guide: true });
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

  const startThemeWatcher = () => {
    if (themeWatcher) return;
    themeWatcher = setInterval(() => {
      if (addon.self.disabled || !lastEnabledSize || !lastChecker) return;
      const bg = getBgLayer();
      if (bg?.bitmapBackground !== lastChecker) return;
      const signature = getThemeSignature(getCanvasColors());
      if (signature === lastThemeSignature) return;
      enable(lastEnabledSize.width, lastEnabledSize.height, { forceRebuild: true });
    }, 250);
  };

  const stopThemeWatcher = () => {
    if (!themeWatcher) return;
    clearInterval(themeWatcher);
    themeWatcher = null;
  };

  const enable = (w, h, options = null) => {
    fillContextClamp.enable();
    const bg = getBgLayer();
    if (!bg?.bitmapBackground) return;
    originalBg ||= bg.bitmapBackground;
    bgCenter ||= originalBg.position.clone();
    const forceRebuild = options?.forceRebuild;

    const ol = getOutlineLayer();
    const canReuse =
      lastEnabledSize?.width === w &&
      lastEnabledSize?.height === h &&
      lastChecker?.parent === bg &&
      bg.bitmapBackground === lastChecker &&
      (!ol?.data?.artboardRect || (ol.data.artboardRect.width === w && ol.data.artboardRect.height === h));

    if (canReuse && !forceRebuild) {
      installToolGate();
      installClickHider();
      if (options?.fitView) fitViewToArtboard(w, h);
      return;
    }

    const canvasColors = getCanvasColors();
    lastThemeSignature = getThemeSignature(canvasColors);
    bg.bitmapBackground.remove();
    const g = makeChecker(w, h, 1, canvasColors);
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
      const [white, blue] = makeOutline(w, h, canvasColors);
      white.position = blue.position = outlineCenter;
      ol.addChildren([white, blue]);
      ol.data.artboardRect = new paper.Rectangle(
        outlineCenter.subtract(new paper.Point(w / 2, h / 2)),
        new paper.Size(w, h)
      );
    }

    installToolGate();
    installClickHider();
    startThemeWatcher();
    if (options?.fitView) fitViewToArtboard(w, h);
  };

  const disable = () => {
    fillContextClamp.disable();
    stopThemeWatcher();
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
