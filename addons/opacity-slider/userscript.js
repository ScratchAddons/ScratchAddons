export default async function ({ addon, console, msg }) {
  await addon.tab.loadScript("/libraries/thirdparty/cs/tinycolor-min.js");

  const CONTAINER_WIDTH = 150;
  const HANDLE_WIDTH = 26;
  let prevEventHandler;
  let handleClickOffset;
  let element;
  let labelReadout;
  let saOpacityHandle;
  let saOpacitySlider;
  let saOpacitySliderBg;

  const getColor = () => {
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
    return tinycolor(color).toRgbString();
  };

  const setColor = (color) => {
    const onEyeDropperOpened = ({ detail }) => {
      if (detail.action.type !== "scratch-paint/eye-dropper/ACTIVATE_COLOR_PICKER") return;
      addon.tab.redux.removeEventListener("statechanged", onEyeDropperOpened);
      const previousTool = addon.tab.redux.state.scratchPaint.color.eyeDropper.previousTool;
      if (previousTool) previousTool.activate();
      addon.tab.redux.state.scratchPaint.color.eyeDropper.callback(color);
      addon.tab.redux.dispatch({
        type: "scratch-paint/eye-dropper/DEACTIVATE_COLOR_PICKER",
      });
    };
    addon.tab.redux.addEventListener("statechanged", onEyeDropperOpened);
    element.children[1].children[0].click();

    // setTimeout(() => {
    // // can't use scratch-paint/fill-style/CHANGE_FILL_COLOR because it checks the hex
    // // https://github.com/scratchfoundation/scratch-paint/blob/0d169c7706d6ddda491b58b9180bb96c6ba946d8/src/lib/make-color-style-reducer.js#L9
    // const state = addon.tab.redux.state;
    // state.scratchPaint.color.fillColor.primary = color;
    // // need to apply color to selection
    // // https://github.com/scratchfoundation/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/containers/color-indicator.jsx#L70
    // for (let i = 0; i < state.scratchPaint.selectedItems.length; i++) {
    //   console.log(state.scratchPaint.selectedItems[i].fillColor);
    //   state.scratchPaint.selectedItems[i].fillColor.set(color);
    // }
    // }, 500);
  };

  const setSliderBg = (color) => {
    const hex = tinycolor(color).toHexString(); // remove alpha value
    saOpacitySliderBg.style.background = `linear-gradient(to left, ${hex} 0%, rgba(0, 0, 0, 0) 100%)`;
  };

  const getEventXY = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.changedTouches && e.changedTouches[0]) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (event) => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    handleClickOffset = getEventXY(event).x - saOpacityHandle.getBoundingClientRect().left;
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (event) => {
    event.preventDefault();
    changeOpacity(scaleMouseToSliderPosition(event));
  };

  const handleClickBackground = (event) => {
    handleClickOffset = HANDLE_WIDTH / 2;
    changeOpacity(scaleMouseToSliderPosition(event));
  };

  const scaleMouseToSliderPosition = (event) => {
    const { x } = getEventXY(event);
    const backgroundBBox = saOpacitySlider.getBoundingClientRect();
    const scaledX = x - backgroundBBox.left - handleClickOffset;
    return Math.max(0, Math.min(100, (100 * scaledX) / (backgroundBBox.width - HANDLE_WIDTH)));
  };

  const changeOpacity = (opacityValue) => {
    const halfHandleWidth = HANDLE_WIDTH / 2;
    const pixelMin = halfHandleWidth;
    const pixelMax = CONTAINER_WIDTH - halfHandleWidth;
    labelReadout.textContent = Math.round(opacityValue);
    saOpacityHandle.style.left = pixelMin + (pixelMax - pixelMin) * (opacityValue / 100) - halfHandleWidth + "px";

    const color = tinycolor(getColor()).toRgb();
    scratchAddons.opacitySliderAlpha = opacityValue / 100;
    setColor(`rgba(${color.r}, ${color.g}, ${color.b}, ${opacityValue / 100})`);
  };

  const setHandlePos = (alphaValue) => {
    saOpacityHandle.style.left = alphaValue * (CONTAINER_WIDTH - HANDLE_WIDTH) + "px";
  };

  while (true) {
    element = await addon.tab.waitForElement('div[class*="color-picker_swatch-row"]', {
      markAsSeen: true,
      reduxCondition: (state) =>
        state.scratchGui.editorTab.activeTabIndex === 1 &&
        !state.scratchGui.mode.isPlayerOnly &&
        state.scratchPaint.selectedItems.length > 0,
    });
    addon.tab.redux.initialize();
    if (typeof prevEventHandler === "function") {
      addon.tab.redux.removeEventListener("statechanged", prevEventHandler);
      prevEventHandler = null;
    }

    const containerWrapper = document.createElement("div");
    const rowHeader = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("color-picker_row-header"),
    });

    const saLabelName = Object.assign(document.createElement("span"), {
      className: addon.tab.scratchClass("color-picker_label-name"),
      textContent: msg("opacity"),
    });

    const defaultAlpha = tinycolor(getColor()).toRgb().a;
    labelReadout = Object.assign(document.createElement("span"), {
      className: addon.tab.scratchClass("color-picker_label-readout"),
    });
    labelReadout.textContent = Math.round(defaultAlpha * 100);

    const defaultColor = getColor();
    saOpacitySlider = Object.assign(document.createElement("div"), {
      className: `sa-opacity-slider ${addon.tab.scratchClass("slider_container", "slider_last")}`,
    });
    saOpacitySlider.addEventListener("click", handleClickBackground);

    saOpacitySliderBg = Object.assign(document.createElement("div"), {
      className: "sa-opacity-slider-bg",
    });
    setSliderBg(defaultColor);

    saOpacityHandle = Object.assign(document.createElement("div"), {
      className: `sa-opacity-handle ${addon.tab.scratchClass("slider_handle")}`,
    });
    saOpacityHandle.addEventListener("mousedown", handleMouseDown);
    saOpacityHandle.addEventListener("click", (event) => event.stopPropagation());
    const lastSlider = document.querySelector('[class*="slider_last"]');
    lastSlider.className = addon.tab.scratchClass("slider_container");
    setHandlePos(defaultAlpha);
    scratchAddons.opacitySliderAlpha = defaultAlpha;

    prevEventHandler = ({ detail }) => {
      if (
        detail.action.type === "scratch-paint/fill-style/CHANGE_FILL_COLOR" ||
        detail.action.type === "scratch-paint/fill-style/CHANGE_FILL_COLOR_2" ||
        detail.action.type === "scratch-paint/stroke-style/CHANGE_STROKE_COLOR" ||
        detail.action.type === "scratch-paint/stroke-style/CHANGE_STROKE_COLOR_2" ||
        detail.action.type === "scratch-paint/color-index/CHANGE_COLOR_INDEX"
      ) {
        const color = getColor();
        setSliderBg(color);
        if (detail.action.type === "scratch-paint/color-index/CHANGE_COLOR_INDEX") {
          labelReadout.textContent = Math.round(tinycolor(color).toRgb().a * 100);
          setHandlePos(tinycolor(color).toRgb().a);
        }
      }
    };
    addon.tab.redux.addEventListener("statechanged", prevEventHandler);

    if (addon.tab.redux.state.scratchPaint.format.startsWith("BITMAP")) continue;

    containerWrapper.appendChild(rowHeader);
    containerWrapper.appendChild(saOpacitySlider);
    rowHeader.appendChild(saLabelName);
    rowHeader.appendChild(labelReadout);
    saOpacitySlider.appendChild(saOpacitySliderBg);
    saOpacitySlider.appendChild(saOpacityHandle);
    const brightnessSlider = Array.from(element.parentElement.children).filter(
      (e) => !e.querySelector("div[class*=color-picker_gradient-picker-row]")
    )[2];
    brightnessSlider.after(containerWrapper);
  }
}
