import {normalizeHex, getHexRegex} from "../../libraries/normalize-color.js";

export default async ({addon, console, msg}) => {
  let elem;
  while (true) {
    elem = await addon.tab.waitForElement("div[class*=\"color-picker_swatch-row\"]", {markAsSeen: true});
    if (addon.tab.editorMode !== "editor") continue;
    const setColor = hex => {
      hex = normalizeHex(hex);
      if (!addon.tab.redux.state || !addon.tab.redux.state.scratchPaint) return;
      addon.tab.redux.initialize();
      // The only way to reliably set color is to invoke eye dropper via click()
      // then faking that the eye dropper reported the value.
      const onEyeDropperOpened = e => {
        if (e.detail.action.type !== "scratch-paint/eye-dropper/ACTIVATE_COLOR_PICKER") return;
        addon.tab.redux.removeEventListener("statechanged", onEyeDropperOpened);
        setTimeout(() => {
          addon.tab.redux.state.scratchPaint.color.eyeDropper.callback(hex);
          // Hack to get a clone of view bounds object w/o messing with original one
          const oldViewBounds = addon.tab.redux.state.scratchPaint.viewBounds;
          const newViewBounds = Object.assign({}, oldViewBounds);
          Object.setPrototypeOf(newViewBounds, oldViewBounds.constructor.prototype);
          // This resets eyedropper
          addon.tab.redux.dispatch({
            type: "scratch-paint/view/UPDATE_VIEW_BOUNDS",
            viewBounds: newViewBounds
          });
        }, 50);
      };
      addon.tab.redux.addEventListener("statechanged", onEyeDropperOpened);
      elem.children[1].children[0].click();
    };
    const saColorPicker = Object.assign(document.createElement("div"), {
      className: "sa-color-picker sa-color-picker-paint"
    });
    const saColorPickerColor = Object.assign(document.createElement("input"), {
      className: "sa-color-picker-color sa-color-picker-paint-color",
      type: "color"
    });
    const saColorPickerText = Object.assign(document.createElement("input"), {
      className: "sa-color-picker-text sa-color-picker-paint-text",
      type: "text",
      pattern: "^#?([0-9a-fA-F]{3}){1,2}$",
      placeholder: msg("hex")
    });
    saColorPickerColor.addEventListener("change", () => {
      setColor(saColorPickerText.value = saColorPickerColor.value);
    });
    saColorPickerText.addEventListener("change", () => {
      const val = saColorPickerText.value;
      if (!getHexRegex().test(val)) return;
      setColor(saColorPickerColor.value = normalizeHex(val));
    })
    saColorPicker.appendChild(saColorPickerColor);
    saColorPicker.appendChild(saColorPickerText);
    elem.parentElement.insertBefore(saColorPicker, elem);
  }
};