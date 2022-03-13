export default async function ({ addon, global, console, msg }) {
  // We don"t *need* to wait for the costume editor to be opened, but redux updates take a non-zero
  // amount of CPU time so let's delay that for as long as possible.
  await addon.tab.traps.getPaper();

  if (!("colorIndex" in addon.tab.redux.state.scratchPaint.fillMode)) {
    console.error("Detected new paint editor; this will be supported in future versions.");
    return;
  }

  // Removes transparency (which Scratch does not support) and normalizes colors to match how Scratch represents them.
  const parseColor = (color) => color.substring(0, 7).toUpperCase();

  // Special value Scratch uses as color when objects with different colors are selected
  // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/helper/style-path.js#L10
  const MIXED = "scratch-paint/style-path/mixed";

  const SCRATCH_DEFAULT_FILL = parseColor("#9966FF");
  const SCRATCH_DEFAULT_STROKE = parseColor("#000000");

  // color could be a hex color string, MIXED, or null
  const isValidColor = (color) => typeof color === "string" && color.startsWith("#");

  // returns hex color string, MIXED, or null
  const getCurrentFillColor = () => addon.tab.redux.state.scratchPaint.color.fillColor.primary;
  const getCurrentStrokeColor = () => addon.tab.redux.state.scratchPaint.color.strokeColor.primary;

  const getCurrentStrokeWidth = () => addon.tab.redux.state.scratchPaint.color.strokeWidth;

  let defaultFillColor;
  let defaultStrokeColor;
  let defaultStrokeWidth;
  const setDefaultColorsToSettings = () => {
    defaultFillColor = parseColor(addon.settings.get("fill"));
    defaultStrokeColor = parseColor(addon.settings.get("stroke"));
    defaultStrokeWidth = addon.settings.get("strokeSize");
  };
  setDefaultColorsToSettings();

  const applyFillColor = () => {
    if (defaultFillColor !== getCurrentFillColor()) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/fill-style/CHANGE_FILL_COLOR",
        color: defaultFillColor,
      });
    }
  };
  const applyStrokeColor = () => {
    if (defaultStrokeColor !== getCurrentStrokeColor()) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/stroke-style/CHANGE_STROKE_COLOR",
        color: defaultStrokeColor,
      });
    }
  };
  const applyStrokeWidth = () => {
    if (getCurrentStrokeWidth() !== defaultStrokeWidth) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/stroke-width/CHANGE_STROKE_WIDTH",
        strokeWidth: defaultStrokeWidth,
      });
    }
  };

  if (!addon.self.disabled) {
    applyFillColor();
    applyStrokeColor();
    applyStrokeWidth();
  }

  addon.settings.addEventListener("change", () => {
    if (!addon.settings.get("persistence")) {
      setDefaultColorsToSettings();
    }
  });

  let activatingTool = false;
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (addon.self.disabled) {
      return;
    }
    const action = detail.action;

    if (!activatingTool && addon.settings.get("persistence")) {
      if (action.type === "scratch-paint/fill-style/CHANGE_FILL_COLOR") {
        if (isValidColor(action.color)) {
          defaultFillColor = action.color;
        }
      } else if (action.type === "scratch-paint/stroke-style/CHANGE_STROKE_COLOR") {
        if (isValidColor(action.color)) {
          defaultStrokeColor = action.color;
        }
      } else if (action.type === "scratch-paint/stroke-width/CHANGE_STROKE_WIDTH") {
        defaultStrokeWidth = action.strokeWidth;
      }
    }

    if (action.type === "scratch-paint/modes/CHANGE_MODE") {
      // Activating certain tools can cause the selected colors to change from transparent or MIXED to the default colors.
      // Example: https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/containers/bit-brush-mode.jsx#L55-L59
      // We have to do this weird redux trick because we can't modify these constants:
      // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/reducers/fill-style.js#L7
      // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/reducers/stroke-style.js#L7
      activatingTool = true;
      const initialFillColor = getCurrentFillColor();
      const initialStrokeColor = getCurrentStrokeColor();
      const shouldCheckIfFillChanges = !initialFillColor || initialFillColor === MIXED;
      const shouldCheckIfStrokeChanges = !initialStrokeColor || initialStrokeColor === MIXED;
      if (shouldCheckIfFillChanges || shouldCheckIfStrokeChanges) {
        queueMicrotask(() => {
          activatingTool = false;
          if (shouldCheckIfFillChanges) {
            const finalFillColor = getCurrentFillColor();
            if (finalFillColor === SCRATCH_DEFAULT_FILL) {
              applyFillColor();
            }
          }
          if (shouldCheckIfStrokeChanges) {
            const finalStrokeColor = getCurrentStrokeColor();
            if (
              finalStrokeColor === SCRATCH_DEFAULT_STROKE ||
              (initialStrokeColor === MIXED && finalStrokeColor !== MIXED)
            ) {
              if (defaultStrokeWidth !== 0) {
                applyStrokeWidth();
                applyStrokeColor();
              }
            }
          }
        });
      }
    }
  });
}
