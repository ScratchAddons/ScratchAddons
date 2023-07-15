export default async function ({ addon, console, msg }) {
  // We don"t *need* to wait for the costume editor to be opened, but redux updates take a non-zero
  // amount of CPU time so let's delay that for as long as possible.
  await addon.tab.traps.getPaper();

  if (!("colorIndex" in addon.tab.redux.state.scratchPaint.fillMode)) {
    console.error("Detected new paint editor; this will be supported in future versions.");
    return;
  }

  const hexComponent = (str) => (+str).toString(16).toUpperCase().padStart(2, "0");

  const parseColor = (color) => {
    if (color === null) {
      return null;
    }
    if (typeof color === "string") {
      // Scratch natively supports hex color codes without transparency
      if (color.startsWith("#")) {
        return color.substring(0, 7).toUpperCase();
      }
      // Sometimes paper gives us rgb() colors which have to be converted to hex
      // It can also return rgba() sometimes but we won't parse that because Scratch doesn't support transparency anyways
      const rgbMatch = color.match(/^rgb\((\d+)\s*,(\d+)\s*,(\d+)\)$/);
      if (rgbMatch) {
        const [_, r, g, b] = rgbMatch;
        return `#${hexComponent(r)}${hexComponent(g)}${hexComponent(b)}`;
      }
    }
    console.log("Could not normalize color", color);
    return null;
  };

  const parseColorStyleColor = (color) => {
    if (color === MIXED) return MIXED;
    return parseColor(color);
  };

  // Special value Scratch uses as color when objects with different colors are selected
  // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/helper/style-path.js#L10
  const MIXED = "scratch-paint/style-path/mixed";

  const SCRATCH_DEFAULT_FILL = parseColor("#9966FF");
  const SCRATCH_DEFAULT_STROKE = parseColor("#000000");

  const TOOL_INFO = Object.assign(Object.create(null), {
    // Tool names and gradient info defined in https://github.com/LLK/scratch-paint/blob/develop/src/lib/modes.js
    // Search for activateTool() in matching file in https://github.com/LLK/scratch-paint/tree/develop/src/containers
    BRUSH: {
      resetsFill: true,
    },
    ERASER: {},
    LINE: {
      resetsStroke: true,
      requiresNonZeroStrokeWidth: true,
      supportsGradient: true,
    },
    FILL: {
      resetsFill: true,
      supportsGradient: true,
    },
    SELECT: {
      supportsGradient: true,
    },
    RESHAPE: {
      supportsGradient: true,
    },
    OVAL: {
      resetsFill: true,
      resetsStroke: true,
      supportsGradient: true,
    },
    RECT: {
      resetsFill: true,
      resetsStroke: true,
      supportsGradient: true,
    },
    TEXT: {
      resetsFill: true,
      resetsStroke: true,
    },
    BIT_BRUSH: {
      resetsFill: true,
    },
    BIT_LINE: {
      resetsFill: true,
      requiresNonZeroStrokeWidth: true,
    },
    BIT_OVAL: {
      resetsFill: true,
      resetsStroke: true,
      supportsGradient: true,
    },
    BIT_RECT: {
      resetsFill: true,
      resetsStroke: true,
      supportsGradient: true,
    },
    BIT_TEXT: {
      resetsFill: true,
      resetsStroke: true,
    },
    BIT_FILL: {
      resetsFill: true,
      supportsGradient: true,
    },
    BIT_ERASER: {},
    BIT_SELECT: {
      supportsGradient: true,
    },
  });

  const getToolInfo = () => TOOL_INFO[addon.tab.redux.state.scratchPaint.mode];

  class ColorStyleReducerWrapper {
    constructor(reduxPropertyName, primaryAction, secondaryAction, gradientTypeAction) {
      this.reduxPropertyName = reduxPropertyName;
      this.primaryAction = primaryAction;
      this.secondaryAction = secondaryAction;
      this.gradientTypeAction = gradientTypeAction;
    }

    get(state = addon.tab.redux.state) {
      return state.scratchPaint.color[this.reduxPropertyName];
    }

    set(newColor) {
      const state = this.get();
      const newPrimary = parseColorStyleColor(newColor.primary);
      if (state.primary !== newPrimary) {
        addon.tab.redux.dispatch({
          type: this.primaryAction,
          color: newPrimary,
        });
      }
      const toolInfo = getToolInfo();
      const toolSupportsGradient = toolInfo && toolInfo.supportsGradient;
      if (toolSupportsGradient) {
        const newSecondary = parseColorStyleColor(newColor.secondary);
        if (state.secondary !== newSecondary) {
          addon.tab.redux.dispatch({
            type: this.secondaryAction,
            color: newSecondary,
          });
        }
        if (state.gradientType !== newColor.gradientType) {
          addon.tab.redux.dispatch({
            type: this.gradientTypeAction,
            gradientType: newColor.gradientType,
          });
        }
      }
    }
  }

  const fillStyle = new ColorStyleReducerWrapper(
    "fillColor",
    "scratch-paint/fill-style/CHANGE_FILL_COLOR",
    "scratch-paint/fill-style/CHANGE_FILL_COLOR_2",
    "scratch-paint/fill-style/CHANGE_FILL_GRADIENT_TYPE",
  );
  const strokeStyle = new ColorStyleReducerWrapper(
    "strokeColor",
    "scratch-paint/stroke-style/CHANGE_STROKE_COLOR",
    "scratch-paint/stroke-style/CHANGE_STROKE_COLOR_2",
    "scratch-paint/stroke-style/CHANGE_STROKE_GRADIENT_TYPE",
  );

  const simpleHexColor = (hex) => ({
    primary: hex,
    secondary: null,
    gradientType: "SOLID",
  });

  let defaultFillColor;
  let defaultStrokeColor;
  let defaultStrokeWidth;
  const setDefaultColorsToSettings = () => {
    defaultFillColor = simpleHexColor(parseColor(addon.settings.get("fill")));
    defaultStrokeColor = simpleHexColor(parseColor(addon.settings.get("stroke")));
    defaultStrokeWidth = addon.settings.get("strokeSize");
  };
  setDefaultColorsToSettings();

  const applyFillColor = () => {
    fillStyle.set(defaultFillColor);
  };
  const applyStrokeColor = () => {
    strokeStyle.set(defaultStrokeColor);
  };
  const applyStrokeWidth = (mustBeNonZero) => {
    let width = defaultStrokeWidth;
    if (width === 0 && mustBeNonZero) {
      width = 1;
    }
    if (addon.tab.redux.state.scratchPaint.color.strokeWidth !== width) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/stroke-width/CHANGE_STROKE_WIDTH",
        strokeWidth: width,
      });
    }
  };

  if (!addon.self.disabled) {
    applyFillColor();
    applyStrokeColor();
    applyStrokeWidth(false);
  }

  addon.settings.addEventListener("change", () => {
    if (!addon.settings.get("persistence")) {
      setDefaultColorsToSettings();
    }
  });

  const isValidColorToPersist = (color) => color.primary !== null && color.primary !== MIXED;

  let activatingTool = false;
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (addon.self.disabled) {
      return;
    }
    const action = detail.action;

    if (!activatingTool && addon.settings.get("persistence")) {
      // We always want to check for changes instead of filtering to just certain actions because quite a few
      // actions can change these.
      const newFill = fillStyle.get();
      if (fillStyle.get(detail.prev) !== newFill && isValidColorToPersist(newFill)) {
        defaultFillColor = newFill;
      }
      const newStroke = strokeStyle.get();
      if (strokeStyle.get(detail.prev) !== newStroke && isValidColorToPersist(newStroke)) {
        defaultStrokeColor = newStroke;
      }

      const newStrokeWidth = detail.next.scratchPaint.color.strokeWidth;
      if (typeof newStrokeWidth === "number") {
        defaultStrokeWidth = newStrokeWidth;
      }
    }

    if (action.type === "scratch-paint/modes/CHANGE_MODE") {
      activatingTool = true;
      queueMicrotask(() => {
        activatingTool = false;
        if (addon.settings.get("persistence")) {
          // In persistence, we always want to re-apply the previous stroke and fill.
          const toolInfo = getToolInfo();
          if (!toolInfo) {
            console.warn("unknown tool", addon.tab.redux.state.scratchPaint.mode);
            return;
          }
          if (toolInfo.resetsFill) {
            applyFillColor();
          }
          if (toolInfo.resetsStroke) {
            applyStrokeWidth(!!toolInfo.requiresNonZeroStrokeWidth);
            applyStrokeColor();
          }
        } else {
          // In non-persistence, we'll only apply the default colors when Scratch resets them to maintain the same behavior.
          // We have to do this weird redux trick because we can't modify these constants:
          // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/reducers/fill-style.js#L7
          // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/reducers/stroke-style.js#L7
          const oldFillColor = fillStyle.get(detail.prev);
          if (oldFillColor.primary === null || oldFillColor.primary === MIXED) {
            const newFillColor = fillStyle.get();
            if (newFillColor.primary === SCRATCH_DEFAULT_FILL) {
              applyFillColor();
            }
          }
          const oldStrokeColor = strokeStyle.get(detail.prev);
          if (oldStrokeColor.primary === null || oldStrokeColor.primary === MIXED) {
            const newStrokeColor = strokeStyle.get();
            if (newStrokeColor.primary === SCRATCH_DEFAULT_STROKE) {
              applyStrokeWidth(true);
              applyStrokeColor();
            }
          }
        }
      });
    }
  });
}
