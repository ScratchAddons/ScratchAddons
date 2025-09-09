import { normalizeHex, getHexRegex } from "../../libraries/common/cs/normalize-color.js";
import RateLimiter from "../../libraries/common/cs/rate-limiter.js";

export default async ({ addon, console, msg }) => {
  // 250-ms rate limit
  const rateLimiter = new RateLimiter(250);
  const setColor = (hex, field) => {
    hex = normalizeHex(hex);
    // Pretend that the color was selected using the eyedropper
    // so that Scratch updates the sliders
    const oldActivateEyedropper = ScratchBlocks.FieldColourSlider.activateEyedropper_;
    ScratchBlocks.FieldColourSlider.activateEyedropper_ = (callback) => callback(hex);
    field.activateEyedropperInternal_();
    ScratchBlocks.FieldColourSlider.activateEyedropper_ = oldActivateEyedropper;
  };
  const addColorPicker = (field) => {
    const element = document.querySelector("button.scratchEyedropper");
    rateLimiter.abort(false);
    const defaultColor = field.getValue();
    const saColorPicker = Object.assign(document.createElement("div"), {
      className: "sa-color-picker sa-color-picker-code",
    });
    addon.tab.displayNoneWhileDisabled(saColorPicker);
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
      rateLimiter.limit(() => setColor((saColorPickerText.value = saColorPickerColor.value), field))
    );
    saColorPickerText.addEventListener("change", () => {
      const { value } = saColorPickerText;
      if (!getHexRegex().test(value)) return;
      setColor((saColorPickerColor.value = normalizeHex(value)), field);
    });
    saColorPicker.appendChild(saColorPickerColor);
    saColorPicker.appendChild(saColorPickerText);
    element.parentElement.insertBefore(saColorPicker, element);
  };
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalShowEditor = ScratchBlocks.FieldColourSlider.prototype.showEditor_;
  ScratchBlocks.FieldColourSlider.prototype.showEditor_ = function (...args) {
    // Don't show the dropdown until the color picker has been added
    const oldShowPositionedByBlock = ScratchBlocks.DropDownDiv.showPositionedByBlock;
    ScratchBlocks.DropDownDiv.showPositionedByBlock = () => {};
    const r = originalShowEditor.call(this, ...args);
    addColorPicker(this);
    ScratchBlocks.DropDownDiv.showPositionedByBlock = oldShowPositionedByBlock;
    ScratchBlocks.DropDownDiv.showPositionedByBlock(this, this.sourceBlock_);
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
