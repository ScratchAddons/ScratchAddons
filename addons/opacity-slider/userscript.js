export default async function ({ addon, console, msg }) {
  let prevEventHandler;

  const getColor = (element) => {
    let fillOrStroke;
    const state = addon.tab.redux.state;
    if (state.scratchPaint.modals.fillColor) {
      fillOrStroke = "fill";
    } else if (state.scratchPaint.modals.strokeColor) {
      fillOrStroke = "stroke";
    } else {
      // fillOrStroke = "ihadastroke";
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

  while (true) {
    const element = await addon.tab.waitForElement('div[class*="color-picker_swatch-row"]', {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    addon.tab.redux.initialize();
    if (addon.tab.redux && typeof prevEventHandler === "function") {
      addon.tab.redux.removeEventListener("statechanged", prevEventHandler);
      prevEventHandler = null;
    }

    const ContainerWrapper = document.createElement("div");
    const RowHeaderClass = document.querySelector('[class*="color-picker_row-header"]').className.split(" ")[0];
    const RowHeader = Object.assign(document.createElement("div"), {
      className: RowHeaderClass,
    });
    const LabelNameClass = document.querySelector('[class*="color-picker_label-name"]').className.split(" ")[0];
    const saLabelName = Object.assign(document.createElement("span"), {
      className: LabelNameClass,
      textContent: msg("opacity"),
    });
    const LabelReadoutClass = document.querySelector('[class*="color-picker_label-readout"]').className.split(" ")[0];
    const LabelReadout = Object.assign(document.createElement("span"), {
      className: LabelReadoutClass,
      textContent: "100",
    });
    const sliderContainerClass = document.querySelector('[class*="slider_container"]').className.split(" ")[0];
    const lastSlider = document.querySelector('[class*="slider_last"]');
    const sliderLastClass = lastSlider.className.split(" ")[0];
    const saOpcitySlider = Object.assign(document.createElement("div"), {
      className: `sa-opacity-slider ${sliderContainerClass} ${sliderLastClass}`,
    });
    const sliderHandleClass = document.querySelector('[class*="slider_handle"]').className.split(" ")[0];
    const saOpcityHandle = Object.assign(document.createElement("div"), {
      className: `sa-opacity-handle ${sliderHandleClass}`,
    });
    lastSlider.className = sliderContainerClass;

    prevEventHandler = ({ detail }) => {
      console.log(detail.action.type);
      if (
        detail.action.type === "scratch-paint/fill-style/CHANGE_FILL_COLOR" ||
        detail.action.type === "scratch-paint/stroke-style/CHANGE_STROKE_COLOR"
      ) {
        setTimeout(() => {
          const color = getColor(element);
          saOpcitySlider.style.background = color || "#000000";
        }, 100);
      }
    };
    addon.tab.redux.addEventListener("statechanged", prevEventHandler);

    ContainerWrapper.appendChild(RowHeader);
    ContainerWrapper.appendChild(saOpcitySlider);
    RowHeader.appendChild(saLabelName);
    RowHeader.appendChild(LabelReadout);
    saOpcitySlider.appendChild(saOpcityHandle);
    element.parentElement.insertBefore(ContainerWrapper, element);
  }
}
