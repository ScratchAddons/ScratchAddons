export default async function ({ addon, global, console, msg }) {
  // We don"t *need* to wait for the costume editor to be opened, but redux updates take a non-zero
  // amount of CPU time so let's delay that for as long as possible.
  await addon.tab.traps.getPaper();

  if (!("colorIndex" in addon.tab.redux.state.scratchPaint.fillMode)) {
    console.error("Detected new paint editor; this will be supported in future versions.");
    return;
  }

  // Removes transparency (which Scratch does not support) and normalizes colors to all-uppercase
  const parseColor = (color) => color.substring(0, 7).toUpperCase();

  const getColorSetting = (id) => parseColor(addon.settings.get(id));

  const SCRATCH_DEFAULT_FILL = parseColor("#9966FF");
  const SCRATCH_DEFAULT_STROKE = parseColor("#000000");

  // Special value Scratch uses as color when objects with different colors are selected
  // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/helper/style-path.js#L10
  const MIXED = "scratch-paint/style-path/mixed";

  // returns hex color string, MIXED, or null
  const getCurrentFillColor = () => addon.tab.redux.state.scratchPaint.color.fillColor.primary;
  const getCurrentStrokeColor = () => addon.tab.redux.state.scratchPaint.color.strokeColor.primary;

  const getCurrentStrokeWidth = () => addon.tab.redux.state.scratchPaint.color.strokeWidth;

  const applyFillColor = () => {
    const color = getColorSetting("fill");
    if (color !== getCurrentFillColor()) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/fill-style/CHANGE_FILL_COLOR",
        color
      });
    }
  };
  const applyStrokeColor = () => {
    const color = getColorSetting("stroke");
    if (color !== getCurrentStrokeColor()) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/stroke-style/CHANGE_STROKE_COLOR",
        color
      });
    }
  };
  const applyStrokeWidth = () => {
    const strokeSize = addon.settings.get("strokeSize");
    if (getCurrentStrokeWidth() !== strokeSize) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/stroke-width/CHANGE_STROKE_WIDTH",
        strokeWidth: strokeSize
      });
    }
  };

  if (!addon.self.disabled) {
    applyFillColor();
    applyStrokeColor();
    applyStrokeWidth();
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({detail}) => {
    if (addon.self.disabled) {
      return;
    }
    const action = detail.action;
    if (action.type === "scratch-paint/modes/CHANGE_MODE") {
      // Activating certain tools can cause the selected colors to change from transparent or MIXED to the default colors.
      // Example: https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/containers/bit-brush-mode.jsx#L55-L59
      // We have to do this weird redux trick because we can't modify these constants:
      // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/reducers/fill-style.js#L7
      // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/reducers/stroke-style.js#L7
      const initialFillColor = getCurrentFillColor();
      const initialStrokeColor = getCurrentStrokeColor();
      const shouldCheckIfFillChanges = !initialFillColor || initialFillColor === MIXED;
      const shouldCheckIfStrokeChanges = !initialStrokeColor || initialStrokeColor === MIXED;
      if (shouldCheckIfFillChanges || shouldCheckIfStrokeChanges) {
        queueMicrotask(() => {
          if (shouldCheckIfFillChanges) {
            const finalFillColor = getCurrentFillColor();
            if (finalFillColor === SCRATCH_DEFAULT_FILL) {
              applyFillColor();
            }
          }
          if (shouldCheckIfStrokeChanges) {
            const finalStrokeColor = getCurrentStrokeColor();
            if (finalStrokeColor === SCRATCH_DEFAULT_STROKE) {
              applyStrokeColor();
            }
          }
        });
      }
    }
  });
}
