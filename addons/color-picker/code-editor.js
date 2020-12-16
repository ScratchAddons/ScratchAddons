import { normalizeHex, getHexRegex } from "../../libraries/normalize-color.js";

export default async ({ addon, console, msg }) => {
  let elem;
  while (true) {
    elem = await addon.tab.waitForElement("button.scratchEyedropper", { markAsSeen: true });
    if (addon.tab.editorMode !== "editor") continue;
    addon.tab.redux.initialize();
    const getColor = () => {
      const children = elem.parentElement.children;
      // h: 0 - 360
      const h = children[1].getAttribute("aria-valuenow");
      // s: 0 - 1
      const s = children[3].getAttribute("aria-valuenow");
      // v: 0 - 255, divide by 255
      const vMultipliedBy255 = children[5].getAttribute("aria-valuenow");
      const v = Number(vMultipliedBy255) / 255;
      return tinycolor(`hsv(${h}, ${s}, ${v || 0})`).toHexString();
    };
    const setColor = (hex) => {
      hex = normalizeHex(hex);
      if (!addon.tab.redux.state || !addon.tab.redux.state.scratchGui) return;
      // The only way to reliably set color is to invoke eye dropper via click()
      // then faking that the eye dropper reported the value.
      const onEyeDropperClosed = (e) => {
        if (e.detail.action.type !== "scratch-gui/color-picker/DEACTIVATE_COLOR_PICKER") return;
        addon.tab.redux.removeEventListener("statechanged", onEyeDropperClosed);
        setTimeout(() => {
          document.body.classList.remove("sa-hide-eye-dropper-background");
        }, 50);
      };
      const onEyeDropperOpened = (e) => {
        if (e.detail.action.type !== "scratch-gui/color-picker/ACTIVATE_COLOR_PICKER") return;
        addon.tab.redux.removeEventListener("statechanged", onEyeDropperOpened);
        addon.tab.redux.addEventListener("statechanged", onEyeDropperClosed);
        setTimeout(() => {
          addon.tab.redux.dispatch({
            type: "scratch-gui/color-picker/DEACTIVATE_COLOR_PICKER",
            color: hex,
          });
        }, 50);
      };
      addon.tab.redux.addEventListener("statechanged", onEyeDropperOpened);
      document.body.classList.add("sa-hide-eye-dropper-background");
      elem.click();
    };
    const defaultColor = getColor();
    const saColorPicker = Object.assign(document.createElement("div"), {
      className: "sa-color-picker sa-color-picker-code",
    });
    const saColorPickerColor = Object.assign(document.createElement("input"), {
      className: "sa-color-picker-color sa-color-picker-code-color",
      type: "color",
      value: defaultColor || "#000000",
    });
    const saColorPickerText = Object.assign(document.createElement("input"), {
      className: "sa-color-picker-text sa-color-picker-code-text",
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
    saColorPicker.appendChild(saColorPickerColor);
    saColorPicker.appendChild(saColorPickerText);
    elem.parentElement.insertBefore(saColorPicker, elem);
  }
};
