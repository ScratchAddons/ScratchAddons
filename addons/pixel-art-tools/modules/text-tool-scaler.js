const DEFAULT_FONT_SIZE = 40;
const DEFAULT_LEADING = 46.15;
const DEFAULT_CANVAS_WIDTH = 480;
const DEFAULT_CANVAS_HEIGHT = 360;
const LEADING_RATIO = DEFAULT_LEADING / DEFAULT_FONT_SIZE;

export function createTextToolScaler(addon, paper) {
  const patchedConstructors = new WeakSet();
  let baseZoom = null;
  let activationHookInstalled = false;
  let dynamicPadding = 8;

  const getCanvasSize = () => {
    const outlineLayer = paper.project.layers.find((layer) => layer?.data?.isOutlineLayer);
    const artboardRect = outlineLayer?.data?.artboardRect;
    if (artboardRect) return { width: artboardRect.width, height: artboardRect.height };

    const bgLayer = paper.project.layers.find((layer) => layer?.bitmapBackground);
    const bgBounds = bgLayer?.bitmapBackground?.bounds;
    if (bgBounds) return { width: bgBounds.width, height: bgBounds.height };

    return null;
  };

  const computeFontSize = () => {
    const currentSize = getCanvasSize();
    const zoom = paper.view?.zoom || 1;

    if (
      !baseZoom &&
      currentSize &&
      (currentSize.width >= DEFAULT_CANVAS_WIDTH || currentSize.height >= DEFAULT_CANVAS_HEIGHT)
    ) {
      baseZoom = zoom;
    }

    const sizeRatio = currentSize
      ? Math.min(currentSize.width / DEFAULT_CANVAS_WIDTH, currentSize.height / DEFAULT_CANVAS_HEIGHT)
      : 1;

    const zoomScale = baseZoom ? baseZoom / zoom : 1 / zoom;

    const scale = Math.min(1, Math.max(Math.min(sizeRatio, zoomScale), 0.12));
    const scaled = DEFAULT_FONT_SIZE * scale;
    if (!Number.isFinite(scaled) || scaled <= 0) return DEFAULT_FONT_SIZE;

    const rounded = Math.round(scaled);
    return Math.max(Math.min(rounded, DEFAULT_FONT_SIZE), 6);
  };

  const patchTextTool = (tool) => {
    if (!tool) return;
    const ctor = tool.constructor;
    if (!ctor || patchedConstructors.has(ctor)) return;
    const originalBeginTextEdit = ctor.prototype.beginTextEdit;
    const originalResizeGuide = typeof ctor.prototype.resizeGuide === "function" ? ctor.prototype.resizeGuide : null;
    if (typeof originalBeginTextEdit !== "function") return;

    ctor.prototype.beginTextEdit = function (textBox) {
      if (
        !addon.self.disabled &&
        textBox &&
        Math.round(textBox.fontSize) === DEFAULT_FONT_SIZE &&
        (!textBox.content || textBox.content === "") &&
        !textBox.data?.saPixelArtTextScaled
      ) {
        const nextSize = computeFontSize();
        textBox.data = textBox.data || {};
        textBox.data.saPixelArtTextScaled = true;
        const paddingScale = Math.max(0.2, nextSize / DEFAULT_FONT_SIZE);
        dynamicPadding = Math.max(2, Math.min(8, Math.round(8 * paddingScale)));
        // Override static getter to allow smaller padding for guides on tiny text
        try {
          Object.defineProperty(ctor, "TEXT_PADDING", {
            configurable: true,
            get() {
              return dynamicPadding;
            },
          });
        } catch (err) {
          // ignore if redefining fails; worst case we keep default padding
        }
        if (Math.round(nextSize) !== Math.round(textBox.fontSize)) {
          textBox.fontSize = nextSize;
          textBox.leading = nextSize * LEADING_RATIO;
          // Force bounds update so guides match the resized text
          void textBox.bounds;
        }
      }
      const result = originalBeginTextEdit.call(this, textBox);
      const tool = this;
      setTimeout(() => {
        if (!textBox?.data?.saPixelArtTextScaled) return;
        // Touch bounds again post-render so the guide/textarea widths sync to the resized text
        void textBox.bounds;
        void textBox.internalBounds;
        const guide = tool?.guide;
        if (guide) {
          const strokeScale = Math.max(0.4, Math.min(1, textBox.fontSize / DEFAULT_FONT_SIZE));
          guide.strokeWidth = strokeScale;
          guide.dashArray = [4 * strokeScale, 4 * strokeScale];
        }
        paper.view?.update?.();
      }, 0);
      return result;
    };

    if (!ctor.__saScaledGuide && originalResizeGuide) {
      ctor.prototype.resizeGuide = function (...args) {
        const res = originalResizeGuide.apply(this, args);
        const guide = this.guide;
        const tb = this.textBox;
        if (guide && tb) {
          const strokeScale = Math.max(0.4, Math.min(1, tb.fontSize / DEFAULT_FONT_SIZE));
          guide.strokeWidth = strokeScale;
          guide.dashArray = [4 * strokeScale, 4 * strokeScale];
        }
        return res;
      };
      ctor.__saScaledGuide = true;
    }

    patchedConstructors.add(ctor);
  };

  const onModeChanged = (mode) => {
    if (mode === "TEXT" || mode === "BIT_TEXT") {
      patchTextTool(paper.tool);
    }
  };

  const installActivationHook = () => {
    if (activationHookInstalled || !paper?.Tool) return;
    activationHookInstalled = true;
    const originalActivate = paper.Tool.prototype.activate;
    paper.Tool.prototype.activate = function (...args) {
      const res = originalActivate ? originalActivate.apply(this, args) : undefined;
      try {
        const mode = addon.tab?.redux?.state?.scratchPaint?.mode;
        if (mode === "TEXT" || mode === "BIT_TEXT") {
          patchTextTool(this);
        }
      } catch (err) {
        // ignore
      }
      return res;
    };
  };

  installActivationHook();
  patchTextTool(paper.tool);

  return { onModeChanged };
}
