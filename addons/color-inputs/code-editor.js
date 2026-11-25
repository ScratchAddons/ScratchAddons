export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const roundValue = (val) => Math.round(val * 10) / 10;

  const oldCreateLabelDom = Blockly.FieldColourSlider.prototype.createLabelDom_;
  Blockly.FieldColourSlider.prototype.createLabelDom_ = function (...args) {
    const [header, readout] = oldCreateLabelDom.call(this, ...args);
    header.classList.add("sa-color-inputs-row-header");
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = 100;
    input.className = addon.tab.scratchClass("input_input-form", "input_input-small", "input_input-small-range", {
      others: "sa-color-input",
    });
    addon.tab.displayNoneWhileDisabled(input);
    header.appendChild(input);
    readout.saInput = input;
    return [header, readout];
  };

  const getInputListener = (field, channel) => {
    const sliderListener = field.sliderCallbackFactory_(channel);
    return (e) => {
      let oldValue = e.target.value;
      e.target.value *= { hue: 360 / 100, saturation: 1 / 100, brightness: 255 / 100 }[channel];
      sliderListener(e);
      e.target.value = oldValue;
    };
  };

  const oldShowEditor = Blockly.FieldColourSlider.prototype.showEditor_;
  Blockly.FieldColourSlider.prototype.showEditor_ = function (...args) {
    oldShowEditor.call(this, ...args);
    if (!this.hueReadout_?.saInput || !this.saturationReadout_?.saInput || !this.brightnessReadout_?.saInput) return;
    this.hueReadout_.saInput.addEventListener("input", getInputListener(this, "hue"));
    this.saturationReadout_.saInput.addEventListener("input", getInputListener(this, "saturation"));
    this.brightnessReadout_.saInput.addEventListener("input", getInputListener(this, "brightness"));
  };

  const oldUpdateDom = Blockly.FieldColourSlider.prototype.updateDom_;
  Blockly.FieldColourSlider.prototype.updateDom_ = function (...args) {
    oldUpdateDom.call(this, ...args);
    if (!this.hueReadout_?.saInput || !this.saturationReadout_?.saInput || !this.brightnessReadout_?.saInput) return;
    this.hueReadout_.saInput.value = roundValue((100 * this.hue_) / 360);
    this.saturationReadout_.saInput.value = roundValue(100 * this.saturation_);
    this.brightnessReadout_.saInput.value = roundValue((100 * this.brightness_) / 255);
  };
}
