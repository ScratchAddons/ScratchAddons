import { normalizeHex, getHexRegex } from "../../libraries/common/cs/normalize-color.js";
import RateLimiter from "../../libraries/common/cs/rate-limiter.js";

export default async ({ addon, console, msg }) => {
  // 250-ms rate limit
  const rateLimiter = new RateLimiter(250);
  const setColor = (hex, element) => {
    hex = normalizeHex(hex);
    if (!addon.tab.redux.state || !addon.tab.redux.state.scratchGui) return;
    // The only way to reliably set color is to invoke eye dropper via click()
    // then faking that the eye dropper reported the value.
    const onEyeDropperClosed = ({ detail }) => {
      if (detail.action.type !== "scratch-gui/color-picker/DEACTIVATE_COLOR_PICKER") return;
      addon.tab.redux.removeEventListener("statechanged", onEyeDropperClosed);
      setTimeout(() => {
        document.body.classList.remove("sa-hide-eye-dropper-background");
      }, 50);
    };
    const onEyeDropperOpened = ({ detail }) => {
      if (detail.action.type !== "scratch-gui/color-picker/ACTIVATE_COLOR_PICKER") return;
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
    element.click();
  };
  const addColorPicker = (editor) => {
    const element = document.querySelector("button.scratchEyedropper");
    rateLimiter.abort(false);
    addon.tab.redux.initialize();
    const defaultColor = editor.getValue();
    const saColorPicker = Object.assign(document.createElement("div"), {
      className: "sa-color-picker sa-color-picker-code",
    });
    addon.tab.displayNoneWhileDisabled(saColorPicker, { display: "flex" });
    const saColorPickerColor = Object.assign(document.createElement("input"), {
      className: "sa-color-picker-color sa-color-picker-code-color",
      type: "color",
      value: defaultColor || "#000000",
    });
    const saColorPickerText = Object.assign(document.createElement("input"), {
      className: addon.tab.scratchClass("input_input-form", {
        others: "sa-color-picker-text sa-color-picker-code-text",
      }),
      type: "text",
      pattern: "^#?([0-9a-fA-F]{3}){1,2}$",
      placeholder: msg("hex"),
      value: defaultColor || "",
    });
    saColorPickerColor.addEventListener("input", () =>
      rateLimiter.limit(() => setColor((saColorPickerText.value = saColorPickerColor.value), element))
    );
    saColorPickerText.addEventListener("change", () => {
      const { value } = saColorPickerText;
      if (!getHexRegex().test(value)) return;
      setColor((saColorPickerColor.value = normalizeHex(value)), element);
    });
    saColorPicker.appendChild(saColorPickerColor);
    saColorPicker.appendChild(saColorPickerText);
    element.parentElement.insertBefore(saColorPicker, element);
  };
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalShowEditor = ScratchBlocks.FieldColourSlider.prototype.showEditor_;
  ScratchBlocks.FieldColourSlider.prototype.showEditor_ = function (...args) {
    const r = originalShowEditor.call(this, ...args);
    addColorPicker(this);
    return r;
  };
  const originalCallbackFactory = ScratchBlocks.FieldColourSlider.prototype.sliderCallbackFactory_;
  ScratchBlocks.FieldColourSlider.prototype.sliderCallbackFactory_ = function (...args) {
    const f = originalCallbackFactory.call(this, ...args);
    return (event) => {
      const r = f(event);
      const div = ScratchBlocks.DropDownDiv.getContentDiv();
      if (div) {
        const saColorPickerColor = div.querySelector(".sa-color-picker-color.sa-color-picker-code-color");
        const saColorPickerText = div.querySelector(".sa-color-picker-text.sa-color-picker-code-text");
        if (!saColorPickerColor || !saColorPickerText) return r;
        const color = this.getValue();
        saColorPickerColor.value = color || "#000000";
        saColorPickerText.value = color || "";
      }
      return r;
    };
  };
};
