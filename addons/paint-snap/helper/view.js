export function loadModule(paper) {
  // https://github.com/LLK/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/view.js

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

  return { CENTER, ART_BOARD_BOUNDS, MAX_WORKSPACE_BOUNDS, getActionBounds };
}
