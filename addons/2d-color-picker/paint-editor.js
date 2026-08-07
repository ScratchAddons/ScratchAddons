export default async ({ addon, console, msg }) => {
  const SLIDER_PADDING = 11;
  const SLIDER_SIZE = 150 - 2 * SLIDER_PADDING;

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

  // for the color picker's background color
  const convertToGeneralColor = (h) => {
    return tinycolor({ h, s: 1, v: 1 }).toHex();
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
      const { h, s, v } = getColor();
      updateShade(s, v);
      saColorPicker.style.background = "#" + convertToGeneralColor(h);
    }

    setPickerState = pickerContainer.setState.bind(pickerContainer);
    pickerContainer.setState = function (state, callback) {
      setPickerState(state, (...args) => {
        if (typeof callback === "function") callback(...args);
        updateColor();
      })
    };

    // get the color
    let defaultColor = getColor();

    // create the color picker element and all it's child elements
    const saColorPicker = document.createElement("div");
    saColorPicker.className = "sa-2dcolor-picker";
    saColorPicker.style.background = "#" + convertToGeneralColor(defaultColor.h);

    const saColorPickerImage = Object.assign(document.createElement("img"), {
      className: "sa-2dcolor-picker-image",
      src: addon.self.dir + "/assets/sv-gradient.svg",
      draggable: false,
    });
    const saColorPickerHandle = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("slider_handle"),
    });
    saColorPickerHandle.style.pointerEvents = "none";

    // create the label
    const saColorLabel = document.createElement("div");
    saColorLabel.className = addon.tab.scratchClass("color-picker_row-header", { others: "sa-2dcolor-label" });
    const saColorLabelName = document.createElement("span");
    saColorLabelName.className = addon.tab.scratchClass("color-picker_label-name", { others: "sa-2dcolor-label-name" });
    saColorLabelName.innerText = msg("shade");
    const saColorLabelVal = document.createElement("span");
    saColorLabelVal.className = addon.tab.scratchClass("color-picker_label-readout", {
      others: "sa-2dcolor-label-val",
    });
    saColorLabel.appendChild(saColorLabelName);
    saColorLabel.appendChild(saColorLabelVal);

    let keyPressed = null;
    let originalHandlePos = { x: 0, y: 0 };
    let originalMousePos = { x: 0, y: 0 };
    window.addEventListener("keydown", (e) => (keyPressed = e.key));
    window.addEventListener("keyup", () => (keyPressed = null));

    let mousemovefunc = function (e) {
      onDrag(e);
      return false;
    };

    let mouseupfunc = function (e) {
      window.removeEventListener("pointermove", mousemovefunc);
      window.removeEventListener("pointerup", mouseupfunc);
    };

    function onDrag(e) {
      let dx = e.clientX - originalMousePos.x;
      let dy = e.clientY - originalMousePos.y;
      let newHandleX = Math.min(Math.max(originalHandlePos.x + dx, 0), SLIDER_SIZE);
      let newHandleY = Math.min(Math.max(originalHandlePos.y + dy, 0), SLIDER_SIZE);
      if (keyPressed === "Shift") {
        if (Math.abs(dx) > Math.abs(dy)) newHandleY = originalHandlePos.y;
        else newHandleX = originalHandlePos.x;
      }

      let color = tinycolor(getColor()).toHsv();
      let s = newHandleX / SLIDER_SIZE;
      let v = 1 - newHandleY / SLIDER_SIZE;
      setPickerState({ saturation: 100 * s, brightness: 100 * v }, () => {
        pickerContainer.handleColorChange();
      });

      updateShade(s, v);
    }

    function updateShade(s, v) {
      saColorPickerHandle.style.left = s * SLIDER_SIZE + "px";
      saColorPickerHandle.style.top = (1 - v) * SLIDER_SIZE + "px";
      saColorLabelVal.innerText = `${Math.round(s * 100)}, ${Math.round(v * 100)}`;
    }

    updateShade(defaultColor.s, defaultColor.v);

    saColorPicker.addEventListener("pointerdown", (e) => {
      e.preventDefault();

      if (e.target === saColorPickerHandle) {
        originalHandlePos = {
          x: parseFloat(saColorPickerHandle.style.left),
          y: parseFloat(saColorPickerHandle.style.top),
        };
      } else {
        // Drag started outside handle
        // Move handle to mouse position first
        originalHandlePos = {
          x: Math.min(Math.max(e.clientX - saColorPicker.getBoundingClientRect().x - SLIDER_PADDING, 0), SLIDER_SIZE),
          y: Math.min(Math.max(e.clientY - saColorPicker.getBoundingClientRect().y - SLIDER_PADDING, 0), SLIDER_SIZE),
        };
      }
      originalMousePos = {
        x: e.clientX,
        y: e.clientY,
      }

      onDrag(e);

      window.addEventListener("pointermove", mousemovefunc);
      window.addEventListener("pointerup", mouseupfunc);
    });
    saColorPicker.appendChild(saColorPickerImage);
    saColorPicker.appendChild(saColorPickerHandle);

    const [colorSlider, saturationSlider, brightnessSlider] = [
      ...colorPicker.querySelectorAll('[class*="color-picker_row-header_"]'),
    ].map((i) => i.parentElement);
    saturationSlider.style.display = "none";
    brightnessSlider.style.display = "none";
    colorSlider.insertAdjacentElement("afterend", saColorPicker);
    colorSlider.insertAdjacentElement("afterend", saColorLabel);
  }
};
