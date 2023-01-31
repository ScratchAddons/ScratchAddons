export default async function ({ addon, msg, console }) {
  while (true) {
    const swatchRow = await addon.tab.waitForElement('div[class*="color-picker_swatch-row"]', {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    const colorPicker = swatchRow.parentElement;
    const internalKey = addon.tab.traps.getInternalKey(colorPicker);
    const proto = colorPicker[internalKey].return.return.return.stateNode;
    const state = colorPicker[internalKey].return.return.stateNode;
    const headers = colorPicker.querySelectorAll("[class*='color-picker_row-header']");
    const color = ["hue", "saturation", "brightness"];
    color.forEach((c, i) => {
      const header = headers[i];
      // TODO: move these styles into a userstyle and use header.classList.add
      header.style.display = "flex";
      header.style.alignItems = "center";
      header.style.justifyContent = "space-between";
      header.querySelector("[class*='color-picker_label-readout']").style.display = "none";
      const input = document.createElement("input");
      input.type = "number";
      input.value = Math.round(state.props[c] * 10) / 10;
      input.min = 0;
      input.max = 100;
      input.className = addon.tab.scratchClass("input_input-form", "input_input-small", "input_input-small-range");
      input.style.height = "1.5rem";
      const _setState = proto.setState.bind(proto);
      proto.setState = function (state, callback) {
        const [type, val] = Object.entries(state)[0];
        if (type === c) {
          input.value = Math.round(val * 10) / 10;
        }
        _setState(state, callback);
      };
      input.addEventListener("input", () => {
        _setState({ [c]: Math.min(100, Math.max(0, input.value)) }, () => {
          proto.handleColorChange();
        });
      });
      header.append(input);
    });
  }
}
