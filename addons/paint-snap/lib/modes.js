import keyMirror from "./keyMirror.js";

// https://github.com/LLK/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/lib/modes.js

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
export default Modes;
