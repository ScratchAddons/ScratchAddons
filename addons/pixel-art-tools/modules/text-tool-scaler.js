const DEFAULT_FONT_SIZE = 40;
const LEADING_RATIO = 46.15 / DEFAULT_FONT_SIZE;
const DEFAULT_SIZE = { width: 480, height: 360 };

export function createTextToolScaler(addon, paper) {
  const patchedConstructors = new WeakSet();
  let baseZoom = null;
  let activationHookInstalled = false;
  let dynamicPadding = 8;

  const getCanvasSize = () => {
    const outlineLayer = paper.project.layers.find((l) => l?.data?.isOutlineLayer);
    const rect = outlineLayer?.data?.artboardRect;
    if (rect) return { width: rect.width, height: rect.height };
    const bgBounds = paper.project.layers.find((l) => l?.bitmapBackground)?.bitmapBackground?.bounds;
    return bgBounds ? { width: bgBounds.width, height: bgBounds.height } : null;
  };

  const computeFontSize = () => {
    const size = getCanvasSize();
    const zoom = paper.view?.zoom || 1;
    if (!baseZoom && size && (size.width >= DEFAULT_SIZE.width || size.height >= DEFAULT_SIZE.height)) baseZoom = zoom;
    const sizeRatio = size ? Math.min(size.width / DEFAULT_SIZE.width, size.height / DEFAULT_SIZE.height) : 1;
    const scale = Math.min(1, Math.max(Math.min(sizeRatio, baseZoom ? baseZoom / zoom : 1 / zoom), 0.12));
    const scaled = DEFAULT_FONT_SIZE * scale;
    return Number.isFinite(scaled) && scaled > 0
      ? Math.max(Math.min(Math.round(scaled), DEFAULT_FONT_SIZE), 6)
      : DEFAULT_FONT_SIZE;
  };

  const applyGuideStyle = (guide, fontSize) => {
    if (!guide) return;
    const s = Math.max(0.4, Math.min(1, fontSize / DEFAULT_FONT_SIZE));
    guide.strokeWidth = s;
    guide.dashArray = [4 * s, 4 * s];
  };

  const patchTextTool = (tool) => {
    if (!tool) return;
    const ctor = tool.constructor;
    if (!ctor || patchedConstructors.has(ctor)) return;
    const origBegin = ctor.prototype.beginTextEdit;
    const origResize = typeof ctor.prototype.resizeGuide === "function" ? ctor.prototype.resizeGuide : null;
    if (typeof origBegin !== "function") return;

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
        try {
          Object.defineProperty(ctor, "TEXT_PADDING", { configurable: true, get: () => dynamicPadding });
        } catch {}
        if (Math.round(nextSize) !== Math.round(textBox.fontSize)) {
          textBox.fontSize = nextSize;
          textBox.leading = nextSize * LEADING_RATIO;
          void textBox.bounds;
        }
      }
      const result = origBegin.call(this, textBox);
      const t = this;
      setTimeout(() => {
        if (!textBox?.data?.saPixelArtTextScaled) return;
        void textBox.bounds;
        void textBox.internalBounds;
        applyGuideStyle(t?.guide, textBox.fontSize);
        paper.view?.update?.();
      }, 0);
      return result;
    };

    if (!ctor.__saScaledGuide && origResize) {
      ctor.prototype.resizeGuide = function (...args) {
        const res = origResize.apply(this, args);
        applyGuideStyle(this.guide, this.textBox?.fontSize);
        return res;
      };
      ctor.__saScaledGuide = true;
    }

    patchedConstructors.add(ctor);
  };

  const onModeChanged = (mode) => {
    if (mode === "TEXT" || mode === "BIT_TEXT") patchTextTool(paper.tool);
  };

  const installActivationHook = () => {
    if (activationHookInstalled || !paper?.Tool) return;
    activationHookInstalled = true;
    const origActivate = paper.Tool.prototype.activate;
    paper.Tool.prototype.activate = function (...args) {
      const res = origActivate?.apply(this, args);
      try {
        const mode = addon.tab?.redux?.state?.scratchPaint?.mode;
        if (mode === "TEXT" || mode === "BIT_TEXT") patchTextTool(this);
      } catch {}
      return res;
    };
  };

  installActivationHook();
  patchTextTool(paper.tool);

  return { onModeChanged };
}
