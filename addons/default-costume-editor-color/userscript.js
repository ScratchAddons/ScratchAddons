export default async function ({ addon, global, console, msg }) {
  // We don"t *need* to wait for the costume editor to be opened, but redux updates take a non-zero
  // amount of CPU time so let's delay that for as long as possible.
  await addon.tab.traps.getPaper();

  if (!("colorIndex" in addon.tab.redux.state.scratchPaint.fillMode)) {
    console.error("Detected new paint editor; this will be supported in future versions.");
    return;
  }

  // Special value Scratch uses as color when objects with different colors are selected
  // https://github.com/LLK/scratch-paint/blob/6733e20b56f52d139f9885952a57c7da012a542f/src/helper/style-path.js#L10
  const MIXED = "scratch-paint/style-path/mixed";

  const hexComponent = (str) => (+str).toString(16).toUpperCase().padStart(2, '0');

  const parseColor = (color) => {
    if (color === null) {
      return null;
    }
    if (typeof color === 'string') {
      // Scratch natively supports hex color codes without transparency
      if (color.startsWith('#')) {
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
    console.log('Could not normalize color', color);
    return null;
  };

  const parseColorStyleColor = (color) => {
    if (color === MIXED) return MIXED;
    return parseColor(color);
  };

  class ColorStyleReducerWrapper {
    constructor(reduxPropertyName, primaryAction, secondaryAction, gradientTypeAction) {
      this.reduxPropertyName = reduxPropertyName;
      this.primaryAction = primaryAction;
      this.secondaryAction = secondaryAction;
      this.gradientTypeAction = gradientTypeAction;
    }

    get(state=addon.tab.redux.state) {
      return state.scratchPaint.color[this.reduxPropertyName];
    }

    set(newColor) {
      const state = this.get();
      const newPrimary = parseColorStyleColor(newColor.primary);
      if (state.primary !== newPrimary) {
        addon.tab.redux.dispatch({
          type: this.primaryAction,
          color: newPrimary
        });
      }
      const newSecondary = parseColorStyleColor(newColor.secondary);
      if (state.secondary !== newSecondary) {
        addon.tab.redux.dispatch({
          type: this.secondaryAction,
          color: newSecondary
        });
      }
      if (state.gradientType !== newColor.gradientType) {
        addon.tab.redux.dispatch({
          type: this.gradientTypeAction,
          gradientType: newColor.gradientType
        });
      }
    }
  }

  const fillStyle = new ColorStyleReducerWrapper(
    'fillColor',
    'scratch-paint/fill-style/CHANGE_FILL_COLOR',
    'scratch-paint/fill-style/CHANGE_FILL_COLOR_2',
    'scratch-paint/fill-style/CHANGE_FILL_GRADIENT_TYPE'
  );
  const strokeStyle = new ColorStyleReducerWrapper(
    'strokeColor',
    'scratch-paint/stroke-style/CHANGE_STROKE_COLOR',
    'scratch-paint/stroke-style/CHANGE_STROKE_COLOR_2',
    'scratch-paint/stroke-style/CHANGE_STROKE_GRADIENT_TYPE'
  );

  const simpleHexColor = (hex) => ({
    primary: hex,
    secondary: null,
    gradientType: 'SOLID'
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
  const applyStrokeWidth = (mustBeAtLeastOne) => {
    let width = defaultStrokeWidth;
    if (width < 1 && mustBeAtLeastOne) {
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

  const TOOL_INFO = Object.assign(Object.create(null), {
    // Tool names and gradient info defined in https://github.com/LLK/scratch-paint/blob/develop/src/lib/modes.js
    // Search for activateTool() in matching file in https://github.com/LLK/scratch-paint/tree/develop/src/containers
    BRUSH: {
      resetsMixedFill: true,
      resetsNoFill: true
    },
    ERASER: {},
    LINE: {
      resetsStroke: true,
      requiresNonZeroStrokeWidth: true
    },
    FILL: {
      resetsMixedFill: true
    },
    SELECT: {},
    RESHAPE: {},
    OVAL: {
      resetsMixedFill: true,
      resetsNoFill: true,
      resetsStroke: true
    },
    RECT: {
      resetsMixedFill: true,
      resetsNoFill: true,
      resetsStroke: true
    },
    ROUNDED_RECT: {}, // unused tool
    TEXT: {
      resetsMixedFill: true,
      resetsNoFill: true,
      resetsStroke: true
    },
    BIT_BRUSH: {
      resetsFill: true
    },
    BIT_LINE: {
      resetsMixedFill: true,
      requiresNonZeroStrokeWidth: true
    },
    BIT_OVAL: {
      resetsMixedFill: true,
      resetsNoFill: true,
      resetsStroke: true
    },
    BIT_RECT: {
      resetsMixedFill: true,
      resetsNoFill: true,
      resetsStroke: true
    },
    BIT_TEXT: {
      resetsMixedFill: true,
      resetsNoFill: true,
      resetsStroke: true
    },
    BIT_FILL: {
      resetsMixedFill: true
    },
    BIT_ERASER: {},
    BIT_SELECT: {},
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

      // We don't want the default stroke width to change in response to scratch-paint/select/CHANGE_SELECTED_ITEMS
      // so we use specific action here
      if (action.type === 'scratch-paint/stroke-width/CHANGE_STROKE_WIDTH') {
        defaultStrokeWidth = action.strokeWidth;
      }
    }

    if (action.type === "scratch-paint/modes/CHANGE_MODE") {
      const newToolName = action.mode;
      const newToolInfo = TOOL_INFO[newToolName];
      if (newToolInfo) {
        const shouldResetFill = newToolInfo.resetsNoFill || newToolInfo.resetsMixedFill;
        const shouldResetStroke = newToolInfo.resetsStroke;
        if (shouldResetFill || shouldResetStroke) {
          activatingTool = true;
          queueMicrotask(() => {
            activatingTool = false;
            if (shouldResetFill) {
              applyFillColor();
            }
            if (shouldResetStroke) {
              applyStrokeWidth(!!newToolInfo.requiresNonZeroStrokeWidth);
              applyStrokeColor();
            }
          });
        }  
      } else {
        console.warn('unknown tool', newToolName);
      }
    }
  });
}
