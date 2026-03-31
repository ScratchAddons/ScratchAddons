// Fill tool multi-stop hook.
// scratch-paint's FillTool calls _setFillItemColor() on every mouse move/down.
// That method always uses createGradientObject() which makes a 2-stop gradient.
// By wrapping it we can expand 2-stop → multi-stop immediately after each call,
// so both the hover preview AND the committed fill use the full gradient.
// The FillTool instance is recreated on every mode switch, so we re-wrap on each
// CHANGE_MODE → FILL dispatch.

import { colorToHex } from "./color-utils.js";
import { COLOR_ACTIONS } from "./gradient-model.js";

export function setupFillToolHook(model, addon) {
  const wrapFillTool = () => {
    if (!model.cachedPaper) return;
    const tool = model.cachedPaper.tool;
    if (!tool || tool.__saGradHooked) return;

    // fill-mode's activateTool() resets gradientType to SOLID when the current fill is
    // stored as MIXED in Redux (which is always the case for multi-stop gradients).
    // Restore the gradient type and colours directly on the tool and via Redux so the
    // fill tool applies gradients instead of solid fills.
    // Note: the fill tool's gradient type always comes from CHANGE_FILL_GRADIENT_TYPE,
    // never from the stroke side, so we use COLOR_ACTIONS.fill regardless of activeColorMode.
    if (model.extraStops.length > 0 && model.lastKnownGradientType) {
      tool.setGradientType(model.lastKnownGradientType);
      tool.setFillColor(model.c0css);
      tool.setFillColor2(model.c1css);
      addon.tab.redux.dispatch({
        type: COLOR_ACTIONS.fill.GRADIENT,
        gradientType: model.lastKnownGradientType,
      });
    }

    const orig = tool._setFillItemColor?.bind(tool);
    if (!orig) return;
    tool._setFillItemColor = function (color1, color2, gradientType, pointerLocation) {
      orig(color1, color2, gradientType, pointerLocation);
      if (addon.self.disabled || model.extraStops.length === 0) return;
      const item = tool._getFillItem?.();
      if (!item) return;
      const cp = tool.fillProperty === "fill" ? "fillColor" : "strokeColor";
      const grad = item[cp]?.gradient;
      if (!grad || grad.stops.length !== 2) return;
      if (colorToHex(grad.stops[0].color) !== model.c0hex || colorToHex(grad.stops[1].color) !== model.c1hex) return;
      model.injectMultiStop(item, cp);
      // For linear gradients: override origin/destination to match the custom angle shown
      // in the fill preview box (storedAngle), spanning the item's bounding box.
      // createGradientObject() only knows HORIZONTAL/VERTICAL so any custom angle would
      // otherwise snap. For radial, leave origin/destination alone — orig() already
      // centred the gradient on the pointer position.
      if (!grad.radial) {
        const θ = (model.storedAngle * Math.PI) / 180;
        const cosθ = Math.cos(θ);
        const sinθ = Math.sin(θ);
        const dir = new model.cachedPaper.Point(cosθ, sinθ);
        const b = item.bounds;
        const halfLen = Math.abs((b.width / 2) * cosθ) + Math.abs((b.height / 2) * sinθ) || 0.01;
        item[cp].origin = b.center.subtract(dir.multiply(halfLen));
        item[cp].destination = b.center.add(dir.multiply(halfLen));
      }
    };
    tool.__saGradHooked = true;
  };

  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-paint/modes/CHANGE_MODE") return;
    if (detail.action.mode !== "FILL") return;
    // FillMode.activateTool() runs synchronously in the same dispatch handler,
    // so model.cachedPaper.tool is already the new FillTool instance by the next rAF.
    requestAnimationFrame(wrapFillTool);
  });
}
