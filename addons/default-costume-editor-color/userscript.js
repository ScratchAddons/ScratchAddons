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
    // Scratch colors must be in hex format and do not support transparency
    if (typeof color !== 'string' || color === MIXED) {
      return null;
    }
    if (color.startsWith('#')) {
      return color.substring(0, 7).toUpperCase();
    }
    // paper can return rgba() colors but we can't set transparent colors anyways
    const rgbMatch = color.match(/^rgb\((\d+)\s*,(\d+)\s*,(\d+)\)$/);
    if (rgbMatch) {
      const [_, r, g, b] = rgbMatch;
      return `#${hexComponent(r)}${hexComponent(g)}${hexComponent(b)}`;
    }
    console.warn('Could not normalize color', color);
    return null;
  };

  const normalizeColor = (color) => parseColor(color) || '#000000';

  const SCRATCH_DEFAULT_FILL = normalizeColor("#9966FF");
  const SCRATCH_DEFAULT_STROKE = normalizeColor("#000000");

  /**
   * @returns {string|MIXED|null}
   */
  const getFillColor = (state=addon.tab.redux.state) => state.scratchPaint.color.fillColor.primary;

  /**
   * @returns {string|MIXED|null}
   */
  const getStrokeColor = (state=addon.tab.redux.state) => state.scratchPaint.color.strokeColor.primary;

  /**
   * @returns {number}
   */
  const getStrokeWidth = (state=addon.tab.redux.state) => state.scratchPaint.color.strokeWidth;

  let defaultFillColor;
  let defaultStrokeColor;
  let defaultStrokeWidth;
  const setDefaultColorsToSettings = () => {
    defaultFillColor = normalizeColor(addon.settings.get("fill"));
    defaultStrokeColor = normalizeColor(addon.settings.get("stroke"));
    defaultStrokeWidth = addon.settings.get("strokeSize");
  };
  setDefaultColorsToSettings();

  const applyFillColor = () => {
    if (defaultFillColor !== getFillColor()) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/fill-style/CHANGE_FILL_COLOR",
        color: defaultFillColor,
      });
    }
  };
  const applyStrokeColor = () => {
    if (defaultStrokeColor !== getStrokeColor()) {
      addon.tab.redux.dispatch({
        type: "scratch-paint/stroke-style/CHANGE_STROKE_COLOR",
        color: defaultStrokeColor,
      });
    }
  };
  const applyStrokeWidth = (mustBeAtLeastOne) => {
    let width = defaultStrokeWidth;
    if (width === 0 && mustBeAtLeastOne) {
      width = 1;
    }
    if (getStrokeWidth() !== width) {
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

  let activatingTool = false;
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (addon.self.disabled) {
      return;
    }
    const action = detail.action;

    if (!activatingTool && addon.settings.get("persistence")) {
      // Fill and stroke color can change in response to their respective scratch-paint/fill-style/CHANGE_FILL_COLOR
      // actions and also to scratch-paint/select/CHANGE_SELECTED_ITEMS, so it's best to check the prev and next
      // color for a change.
      const oldFillColor = getFillColor(detail.prev);
      const newFillColor = getFillColor(detail.next);
      if (oldFillColor !== newFillColor) {
        const parsed = parseColor(newFillColor);
        if (parsed) {
          defaultFillColor = parsed;
        }
      }

      const oldStrokeColor = getStrokeColor(detail.prev);
      const newStrokeColor = getStrokeColor(detail.next);
      if (oldStrokeColor !== newStrokeColor) {
        const parsed = parseColor(newStrokeColor);
        if (parsed) {
          defaultStrokeColor = parsed;
        }
      }

      // We don't want the default stroke width to change in response to scratch-paint/select/CHANGE_SELECTED_ITEMS
      // so we use specific action here
      if (action.type === 'scratch-paint/stroke-width/CHANGE_STROKE_WIDTH') {
        defaultStrokeWidth = action.strokeWidth;
      }
    }

    if (action.type === "scratch-paint/modes/CHANGE_MODE") {
      const newToolInfo = TOOL_INFO[action.mode];
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
    }
  });
}
