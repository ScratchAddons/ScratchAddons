import ShadePicker from "./shade-picker.js";

export default async ({ addon, console, msg }) => {
  let pickerContainer;
  let setPickerState;

  // get the color from scratch
  const getColor = () => {
    return {
      h: pickerContainer.state.hue / 100 * 360,
      s: pickerContainer.state.saturation / 100,
      v: pickerContainer.state.brightness / 100,
    }
  };

  // le loop
  while (true) {
    // wait for color dialog box appearance
    const swatchRow = await addon.tab.waitForElement('[class*="color-picker_swatch-row_"]', {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    const colorPicker = swatchRow.parentElement;
    const internalKey = addon.tab.traps.getInternalKey(colorPicker);
    let internalInstance = colorPicker[internalKey];
    while (!internalInstance.stateNode?.props?.onChangeColor) {
      internalInstance = internalInstance.return;
    }
    pickerContainer = internalInstance.stateNode;

    if (!("colorIndex" in addon.tab.redux.state.scratchPaint.fillMode)) {
      console.error("Detected new paint editor; this will be supported in future versions.");
      return;
    }

    // update the bg color of the picker
    function updateColor() {
      shadePicker.setColor(getColor());
    }

    setPickerState = pickerContainer.setState.bind(pickerContainer);
    pickerContainer.setState = function (state, callback) {
      setPickerState(state, (...args) => {
        if (typeof callback === "function") callback(...args);
        updateColor();
      })
    };

    let defaultColor = getColor();
    const shadePicker = new ShadePicker(addon, msg);
    const [shadeSlider, shadeLabel] = shadePicker.createElements(defaultColor);
    shadePicker.addEventListener("change", (e) => {
      const { s, v } = e.detail;
      setPickerState({ saturation: 100 * s, brightness: 100 * v }, () => {
        pickerContainer.handleColorChange();
      });
    });

    const [colorSlider, saturationSlider, brightnessSlider] = [
      ...colorPicker.querySelectorAll('[class*="color-picker_row-header_"]'),
    ].map((i) => i.parentElement);
    saturationSlider.style.display = "none";
    brightnessSlider.style.display = "none";
    colorSlider.insertAdjacentElement("afterend", shadeSlider);
    colorSlider.insertAdjacentElement("afterend", shadeLabel);
  }
};
