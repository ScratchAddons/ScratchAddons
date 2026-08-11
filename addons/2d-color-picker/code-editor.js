import ShadePicker from "./shade-picker.js";

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const oldShowEditor = Blockly.FieldColourSlider.prototype.showEditor_;
  Blockly.FieldColourSlider.prototype.showEditor_ = function (...args) {
    oldShowEditor.call(this, ...args);

    this.saShadePicker = new ShadePicker(addon, msg, { roundMethod: Math.floor });
    const [shadeSlider, shadeLabel] = this.saShadePicker.createElements({
      h: this.hue_,
      s: this.saturation_,
      v: this.brightness_ / 255,
    });
    this.saShadePicker.addEventListener("change", (e) => {
      const { s, v } = e.detail;
      this.saturation_ = s;
      this.brightness_ = 255 * v;
      this.setValue(Blockly.utils.colour.hsvToHex(this.hue_, this.saturation_, this.brightness_), true);
    });

    this.saturationSlider_.classList.add("sa-2dcolor-hidden");
    this.saturationSlider_.previousSibling.classList.add("sa-2dcolor-hidden");
    this.brightnessSlider_.classList.add("sa-2dcolor-hidden");
    this.brightnessSlider_.previousSibling.classList.add("sa-2dcolor-hidden");
    this.hueSlider_.insertAdjacentElement("afterend", shadeSlider);
    this.hueSlider_.insertAdjacentElement("afterend", shadeLabel);
  };

  const oldUpdateDom = Blockly.FieldColourSlider.prototype.updateDom_;
  Blockly.FieldColourSlider.prototype.updateDom_ = function (...args) {
    oldUpdateDom.call(this, ...args);
    if (this.saShadePicker) {
      this.saShadePicker.setColor({
        h: this.hue_,
        s: this.saturation_,
        v: this.brightness_ / 255,
      });
    }
  };
}
