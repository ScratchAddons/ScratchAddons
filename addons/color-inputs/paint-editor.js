export default async function ({ addon, msg, console }) {
  while (true) {
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
    const pickerContainer = internalInstance.stateNode;
    internalInstance = internalInstance.child;
    while (!internalInstance.stateNode) {
      internalInstance = internalInstance.child;
    }
    const pickerComponent = internalInstance.stateNode;
    const headers = colorPicker.querySelectorAll("[class*='color-picker_row-header']");
    const color = ["hue", "saturation", "brightness"];
    color.forEach((c, i) => {
      const header = headers[i];
      header.classList.add("sa-color-inputs-row-header");
      const input = document.createElement("input");
      input.type = "number";
      input.value = Math.round(pickerComponent.props[c] * 10) / 10;
      input.min = 0;
      input.max = 100;
      input.className = addon.tab.scratchClass("input_input-form", "input_input-small", "input_input-small-range", {
        others: "sa-color-input",
      });
      const _setState = pickerContainer.setState.bind(pickerContainer);
      pickerContainer.setState = function (state, callback) {
        for (const [type, val] of Object.entries(state)) {
          if (type === c) {
            input.value = Math.round(val * 10) / 10;
          }
        }
        _setState(state, callback);
      };
      input.addEventListener("input", () => {
        _setState({ [c]: Math.min(100, Math.max(0, input.value)) }, () => {
          pickerContainer.handleColorChange();
        });
      });
      addon.tab.displayNoneWhileDisabled(input);
      header.append(input);
    });
  }
}
