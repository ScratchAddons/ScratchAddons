export function loadModule(paper) {
  // https://github.com/LLK/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/layer.js
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

  return { CROSSHAIR_FULL_OPACITY, getDragCrosshairLayer, getLayer: _getLayer };
}
