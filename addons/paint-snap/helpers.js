export function loadModules(paper) {
  // https://github.com/scratchfoundation/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/math.js

  const checkPointsClose = function (startPos, eventPoint, threshold) {
    const xOff = Math.abs(startPos.x - eventPoint.x);
    const yOff = Math.abs(startPos.y - eventPoint.y);
    if (xOff < threshold && yOff < threshold) {
      return true;
    }
    return false;
  };

  // Thanks Mikko Mononen! https://github.com/memononen/stylii
  const snapDeltaToAngle = function (delta, snapAngle) {
    let angle = Math.atan2(delta.y, delta.x);
    angle = Math.round(angle / snapAngle) * snapAngle;
    const dirx = Math.cos(angle);
    const diry = Math.sin(angle);
    const d = dirx * delta.x + diry * delta.y;
    return new paper.Point(dirx * d, diry * d);
  };

  // https://github.com/scratchfoundation/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/layer.js
  const CROSSHAIR_FULL_OPACITY = 0.75;

  const _getLayer = function (layerString) {
    for (const layer of paper.project.layers) {
      if (layer.data && layer.data[layerString]) {
        return layer;
      }
    }
  };

  const getDragCrosshairLayer = function () {
    return _getLayer("isDragCrosshairLayer");
  };
  const getGuideLayer = function () {
    return _getLayer("isGuideLayer");
  };

  // https://github.com/scratchfoundation/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/view.js

  // Vectors are imported and exported at SVG_ART_BOARD size.
  // Once they are imported however, both SVGs and bitmaps are on
  // canvases of ART_BOARD size.
  // (This is for backwards compatibility, to handle both assets
  // designed for 480 x 360, and bitmap resolution 2 bitmaps)
  const SVG_ART_BOARD_WIDTH = 480;
  const SVG_ART_BOARD_HEIGHT = 360;
  const ART_BOARD_WIDTH = SVG_ART_BOARD_WIDTH * 2;
  const ART_BOARD_HEIGHT = SVG_ART_BOARD_HEIGHT * 2;
  const CENTER = new paper.Point(ART_BOARD_WIDTH / 2, ART_BOARD_HEIGHT / 2);
  const ART_BOARD_BOUNDS = new paper.Rectangle(0, 0, ART_BOARD_WIDTH, ART_BOARD_HEIGHT);
  const MAX_WORKSPACE_BOUNDS = new paper.Rectangle(
    -ART_BOARD_WIDTH / 4,
    -ART_BOARD_HEIGHT / 4,
    ART_BOARD_WIDTH * 1.5,
    ART_BOARD_HEIGHT * 1.5
  );

  /**
   * Mouse actions are clamped to action bounds
   * @param {boolean} isBitmap True if the editor is in bitmap mode, false if it is in vector mode
   * @returns {paper.Rectangle} the bounds within which mouse events should work in the paint editor
   */
  const getActionBounds = (isBitmap) => {
    if (isBitmap) {
      return ART_BOARD_BOUNDS;
    }
    return paper.view.bounds.unite(ART_BOARD_BOUNDS).intersect(MAX_WORKSPACE_BOUNDS);
  };

  const setDefaultGuideStyle = function (item) {
    item.strokeWidth = 1 / paper.view.zoom;
    item.opacity = 1;
    item.blendMode = "normal";
    item.guide = true;
  };

  const GUIDE_BLUE = "#009dec";

  const hoverBounds = function (item, expandBy) {
    let bounds = item.internalBounds;
    if (expandBy) {
      bounds = bounds.expand(expandBy);
    }
    const rect = new paper.Path.Rectangle(bounds);
    rect.matrix = item.matrix;
    setDefaultGuideStyle(rect);
    rect.parent = getGuideLayer();
    rect.strokeColor = GUIDE_BLUE;
    rect.fillColor = null;
    rect.data.isHelperItem = true;
    rect.data.origItem = item;
    rect.bringToFront();

    return rect;
  };

  return {
    math: {
      checkPointsClose,
      snapDeltaToAngle,
    },
    layer: { CROSSHAIR_FULL_OPACITY, getDragCrosshairLayer, getLayer: _getLayer },
    view: { CENTER, ART_BOARD_BOUNDS, MAX_WORKSPACE_BOUNDS, getActionBounds },
    guide: { hoverBounds },
  };
}

const keyMirror = (obj) => Object.fromEntries(Object.entries(obj).map(([k]) => [k, k]));

// https://github.com/scratchfoundation/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/lib/modes.js

const vectorModesObj = {
  BRUSH: null,
  ERASER: null,
  LINE: null,
  FILL: null,
  SELECT: null,
  RESHAPE: null,
  OVAL: null,
  RECT: null,
  ROUNDED_RECT: null,
  TEXT: null,
};
const bitmapModesObj = {
  BIT_BRUSH: null,
  BIT_LINE: null,
  BIT_OVAL: null,
  BIT_RECT: null,
  BIT_TEXT: null,
  BIT_FILL: null,
  BIT_ERASER: null,
  BIT_SELECT: null,
};
const VectorModes = keyMirror(vectorModesObj);
const BitmapModes = keyMirror(bitmapModesObj);
const Modes = keyMirror({ ...vectorModesObj, ...bitmapModesObj });

const GradientToolsModes = keyMirror({
  FILL: null,
  SELECT: null,
  RESHAPE: null,
  OVAL: null,
  RECT: null,
  LINE: null,

  BIT_OVAL: null,
  BIT_RECT: null,
  BIT_SELECT: null,
  BIT_FILL: null,
});

export { Modes, VectorModes, BitmapModes, GradientToolsModes };
