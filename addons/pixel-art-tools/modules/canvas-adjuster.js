// canvas-adjuster.js
export function createCanvasAdjuster(paper) {
  const getBgLayer = () => paper.project.layers.find((l) => l?.data?.isBackgroundGuideLayer);
  const getOutlineLayer = () => paper.project.layers.find((l) => l?.data?.isOutlineLayer);

  let originalBg = null;
  let originalOutline = null;
  let bgCenter = null;
  let outlineCenter = null;

  const makeChecker = (w, h, size) => {
    const g = new paper.Group();
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        g.addChild(
          new paper.Path.Rectangle({
            point: [x, y],
            size,
            fillColor: (x / size + y / size) % 2 ? "#D9E3F2" : "#fff",
          })
        );
      }
    }
    return g;
  };

  const makeOutline = (w, h) => {
    const r = new paper.Rectangle(0, 0, w, h);
    const white = new paper.Shape.Rectangle(r.expand(1));
    white.strokeWidth = 2;
    white.strokeColor = "white";
    const blue = new paper.Shape.Rectangle(r.expand(5));
    blue.strokeWidth = 2;
    blue.strokeColor = "#4280D7";
    blue.opacity = 0.25;
    return [white, blue];
  };

  const enable = (w, h, size = 1) => {
    // bitmap background
    const bg = getBgLayer();
    if (!bg?.bitmapBackground) return;

    originalBg ||= bg.bitmapBackground;
    bgCenter ||= originalBg.position.clone(); // match original center

    bg.bitmapBackground.remove();
    const g = makeChecker(w, h, size);
    g.position = bgCenter;
    bg.addChild(g);
    bg.bitmapBackground = g;
    if (bg.vectorBackground) bg.vectorBackground.visible = false;

    // outline
    const ol = getOutlineLayer();
    if (ol) {
      if (!originalOutline) {
        outlineCenter = ol.bounds.center.clone(); // match original outline center
        originalOutline = ol.removeChildren();
      } else {
        ol.removeChildren();
      }
      const [white, blue] = makeOutline(w, h);
      white.position = outlineCenter;
      blue.position = outlineCenter;
      ol.addChildren([white, blue]);
    }
  };

  const disable = () => {
    // bitmap background
    const bg = getBgLayer();
    if (bg && originalBg) {
      if (bg.bitmapBackground !== originalBg) bg.bitmapBackground.remove();
      if (!originalBg.parent) bg.addChild(originalBg);
      bg.bitmapBackground = originalBg;
      if (bg.vectorBackground) bg.vectorBackground.visible = true;
    }

    // outline
    const ol = getOutlineLayer();
    if (ol && originalOutline) {
      ol.removeChildren();
      ol.addChildren(originalOutline);
    }
  };

  return { enable, disable };
}
