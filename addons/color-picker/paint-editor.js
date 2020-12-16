import { normalizeHex, getHexRegex } from "../../libraries/normalize-color.js";

export default async ({ addon, console, msg }) => {
  let elem;
  let prevEventHandler;
  await addon.tab.loadScript(addon.self.lib + "/tinycolor-min.js");
  while (true) {
    elem = await addon.tab.waitForElement('div[class*="color-picker_swatch-row"]', { markAsSeen: true });
    addon.tab.redux.initialize();
    if (addon.tab.redux && typeof prevEventHandler === "function") {
      addon.tab.redux.removeEventListener("statechanged", prevEventHandler);
      prevEventHandler = null;
    }
    if (addon.tab.editorMode !== "editor") continue;
    const getColor = () => {
      let fillOrStroke;
      const state = addon.tab.redux.state;
      if (state.scratchPaint.modals.fillColor) {
        fillOrStroke = "fill";
      } else if (state.scratchPaint.modals.strokeColor) {
        fillOrStroke = "stroke";
      } else {
        fillOrStroke = "ihadastroke";
        return;
      }
      const colorType = state.scratchPaint.fillMode.colorIndex;
      const primaryOrSecondary = ["primary", "secondary"][colorType];
      const color = state.scratchPaint.color[`${fillOrStroke}Color`][primaryOrSecondary];
      if (color === null || color === "scratch-paint/style-path/mixed") return;
      // This value can be arbitrary - it can be HEX, RGB, etc.
      // Use tinycolor to convert them.
      return tinycolor(color).toHexString();
    };
    const setColor = (hex) => {
      hex = normalizeHex(hex);
      if (!addon.tab.redux.state || !addon.tab.redux.state.scratchPaint) return;
      // The only way to reliably set color is to invoke eye dropper via click()
      // then faking that the eye dropper reported the value.
      const onEyeDropperOpened = (e) => {
        if (e.detail.action.type !== "scratch-paint/eye-dropper/ACTIVATE_COLOR_PICKER") return;
        addon.tab.redux.removeEventListener("statechanged", onEyeDropperOpened);
        setTimeout(() => {
          const previousTool = addon.tab.redux.state.scratchPaint.color.eyeDropper.previousTool;
          if (previousTool) previousTool.activate();
          addon.tab.redux.state.scratchPaint.color.eyeDropper.callback(hex);
          addon.tab.redux.dispatch({
            type: "scratch-paint/eye-dropper/DEACTIVATE_COLOR_PICKER",
          });
        }, 50);
      };
      addon.tab.redux.addEventListener("statechanged", onEyeDropperOpened);
      elem.children[1].children[0].click();
    };
    const defaultColor = getColor();
    const saColorPicker = Object.assign(document.createElement("div"), {
      className: "sa-color-picker sa-color-picker-paint",
    });
    const saColorPickerColor = Object.assign(document.createElement("input"), {
      className: "sa-color-picker-color sa-color-picker-paint-color",
      type: "color",
      value: defaultColor || "#000000",
    });
    const saColorPickerText = Object.assign(document.createElement("input"), {
      className: "sa-color-picker-text sa-color-picker-paint-text",
      type: "text",
      pattern: "^#?([0-9a-fA-F]{3}){1,2}$",
      placeholder: msg("hex"),
      value: defaultColor || "",
    });
    saColorPickerColor.addEventListener("change", () => {
      setColor((saColorPickerText.value = saColorPickerColor.value));
    });
    saColorPickerText.addEventListener("change", () => {
      const val = saColorPickerText.value;
      if (!getHexRegex().test(val)) return;
      setColor((saColorPickerColor.value = normalizeHex(val)));
    });
    prevEventHandler = (e) => {
      const type = e.detail.action.type;
      if (type === "scratch-paint/color-index/CHANGE_COLOR_INDEX") {
        setTimeout(() => {
          const color = getColor();
          saColorPickerColor.value = color || "#000000";
          saColorPickerText.value = color || "";
        }, 100);
      }
    };
    addon.tab.redux.addEventListener("statechanged", prevEventHandler);
    saColorPicker.appendChild(saColorPickerColor);
    saColorPicker.appendChild(saColorPickerText);
    elem.parentElement.insertBefore(saColorPicker, elem);
  }
};
