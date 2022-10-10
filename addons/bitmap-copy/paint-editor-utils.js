// "Updates" the paint editor:
// applies the image and updates the undo stack.
export function update(redux, paper, select = false) {
  const mode = redux.state.scratchPaint.mode;
  // Bitmap formats can be BITMAP or BITMAP_SKIP_CONVERT
  const isBitmap = redux.state.scratchPaint.format.startsWith("BITMAP");

  // Some vector tools (brush, eraser, line)
  // don't have an onUpdateImage function,
  // so we switch to the format's select mode,
  // call the function then switch back

  redux.dispatch({
    type: "scratch-paint/modes/CHANGE_MODE",
    mode: isBitmap ? "BIT_SELECT" : "SELECT",
  });
  setTimeout(() => {
    paper.tool.onUpdateImage();
    if (select) {
      paper.tool.selectionBoxTool.setSelectedItems();
    }
    redux.dispatch({
      type: "scratch-paint/modes/CHANGE_MODE",
      mode: mode,
    });
  }, 25);
}

export function getCanvasSize(paper) {
  // The raster layer is present in both formats,
  // and is the size of the canvas
  const rasterLayer = paper.project.layers.find((l) => l.data.isRasterLayer);
  if (!rasterLayer) return null;
  return [rasterLayer.bounds.width, rasterLayer.bounds.height];
}
