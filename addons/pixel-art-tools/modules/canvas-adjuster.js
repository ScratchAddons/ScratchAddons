export function createCanvasAdjuster(paper) {
  // Helpers
  const getLayer = (key) => paper.project.layers.find(l => l?.data?.[key]);

  // Main functions
  const setCheckerboardPixelSize = () => {};
  const resizeBackgroundLayer = (width, height) => {};

  // Entrypoint function
  const setPixelModeBackground = (width, height) => {
    setCheckerboardPixelSize();
    resizeBackgroundLayer(width, height);
  };

  return { setPixelModeBackground };
}
