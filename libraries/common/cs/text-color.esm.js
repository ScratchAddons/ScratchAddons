//@ts-expect-error -- We know it's not a module, we're just running the file.
import * as _ from "./text-color.js";
const { textColor, multiply, brighten, alphaBlend, recolorFilter } = window.__scratchAddonsTextColor;
export { textColor, multiply, brighten, alphaBlend, recolorFilter };
