export default async function ({ addon, console, msg }) {
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/tinycolor-min.js");

  const CONTAINER_WIDTH = 150;
  const HANDLE_WIDTH = 26;
  let prevEventHandler;
  let handleClickOffset;
  let element;
  let LabelReadout;
  let saOpacityHandle;
  let saOpacitySlider;
  let currentOpacity;

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
    // tell scratch that the color has changed
    const onEyeDropperOpened = ({ detail }) => {
      if (detail.action.type !== "scratch-paint/eye-dropper/ACTIVATE_COLOR_PICKER") return;
      addon.tab.redux.removeEventListener("statechanged", onEyeDropperOpened);
      setTimeout(() => {
        const previousTool = addon.tab.redux.state.scratchPaint.color.eyeDropper.previousTool;
        if (previousTool) previousTool.activate();
        addon.tab.redux.state.scratchPaint.color.eyeDropper.callback(color);
        addon.tab.redux.dispatch({
          type: "scratch-paint/eye-dropper/DEACTIVATE_COLOR_PICKER",
        });
      }, 50);
    };
    addon.tab.redux.addEventListener("statechanged", onEyeDropperOpened);
    element.children[1].children[0].click();

    // setTimeout(() => {
    // // can't use scratch-paint/fill-style/CHANGE_FILL_COLOR because it checks the hex
    // // https://github.com/LLK/scratch-paint/blob/0d169c7706d6ddda491b58b9180bb96c6ba946d8/src/lib/make-color-style-reducer.js#L9
    // const state = addon.tab.redux.state;
    // state.scratchPaint.color.fillColor.primary = color;
    // // need to apply color to selection
    // // https://github.com/LLK/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/containers/color-indicator.jsx#L70
    // for (let i = 0; i < state.scratchPaint.selectedItems.length; i++) {
    //   console.log(state.scratchPaint.selectedItems[i].fillColor);
    //   state.scratchPaint.selectedItems[i].fillColor.set(color);
    // }
    // }, 500);
  };

  const setSliderBg = (color) => {
    const hex = tinycolor(color).toHexString(); // remove alpha value
    let bg = `linear-gradient(to left, ${hex} 0%, rgba(0, 0, 0, 0) 100%),`;
    bg += "linear-gradient(45deg, #eaf0f8 25%, transparent 25%, transparent 75%, #eaf0f8 75%),";
    bg += "linear-gradient(45deg, #eaf0f8 25%, transparent 25%, transparent 75%, #eaf0f8 75%)";
    saOpacitySlider.style.background = bg;
    saOpacitySlider.style.backgroundSize = "100% 100%, 20px 20px, 20px 20px";
    saOpacitySlider.style.backgroundPosition = "0 0, 10px 10px";
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
    if (event.target !== saOpacitySlider) return;
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
    LabelReadout.textContent = Math.round(opacityValue);
    saOpacityHandle.style.left = pixelMin + (pixelMax - pixelMin) * (opacityValue / 100) - halfHandleWidth + "px";
    currentOpacity = opacityValue / 100;

    const color = tinycolor(getColor()).toRgb();
    setColor(`rgba(${color.r}, ${color.g}, ${color.b}, ${opacityValue / 100})`);
  };

  const setHandlePos = (alphaValue) => {
    saOpacityHandle.style.left = alphaValue * (CONTAINER_WIDTH - HANDLE_WIDTH) + "px";
  };

  while (true) {
    element = await addon.tab.waitForElement('div[class*="color-picker_swatch-row"]', {
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

    const defaultAlpha = tinycolor(getColor()).toRgb().a;
    currentOpacity = defaultAlpha;
    const LabelReadoutClass = document.querySelector('[class*="color-picker_label-readout"]').className.split(" ")[0];
    LabelReadout = Object.assign(document.createElement("span"), {
      className: LabelReadoutClass,
    });
    LabelReadout.textContent = defaultAlpha * 100;

    const defaultColor = getColor();
    const sliderContainerClass = document.querySelector('[class*="slider_container"]').className.split(" ")[0];
    const lastSlider = document.querySelector('[class*="slider_last"]');
    const sliderLastClass = lastSlider.className.split(" ")[0];
    saOpacitySlider = Object.assign(document.createElement("div"), {
      className: `sa-opacity-slider ${sliderContainerClass} ${sliderLastClass}`,
    });
    setSliderBg(defaultColor);
    saOpacitySlider.addEventListener("click", handleClickBackground);

    const sliderHandleClass = document.querySelector('[class*="slider_handle"]').className.split(" ")[0];
    saOpacityHandle = Object.assign(document.createElement("div"), {
      className: `sa-opacity-handle ${sliderHandleClass}`,
    });
    saOpacityHandle.addEventListener("mousedown", handleMouseDown);
    lastSlider.className = sliderContainerClass;
    setHandlePos(defaultAlpha);

    prevEventHandler = ({ detail }) => {
      if (
        detail.action.type === "scratch-paint/fill-style/CHANGE_FILL_COLOR" ||
        detail.action.type === "scratch-paint/stroke-style/CHANGE_STROKE_COLOR" ||
        detail.action.type === "scratch-paint/color-index/CHANGE_COLOR_INDEX"
      ) {
        const color = getColor();
        setSliderBg(color || "#000000");
        setHandlePos(currentOpacity);
      }
    };
    addon.tab.redux.addEventListener("statechanged", prevEventHandler);

    ContainerWrapper.appendChild(RowHeader);
    ContainerWrapper.appendChild(saOpacitySlider);
    RowHeader.appendChild(saLabelName);
    RowHeader.appendChild(LabelReadout);
    saOpacitySlider.appendChild(saOpacityHandle);
    element.parentElement.insertBefore(ContainerWrapper, element);
  }
}
