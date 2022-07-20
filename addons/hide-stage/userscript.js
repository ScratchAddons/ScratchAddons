export default async function ({ addon, console, msg }) {
  // Wait until the project is loaded so that the renderer will definitely exist.
  const vm = addon.tab.traps.vm;
  await new Promise((resolve) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });

  let stageHidden = false;
  let bodyWrapper;
  let smallStageButton;
  let largeStageButton;
  let hideStageButton;

  function hideStage() {
    stageHidden = true;
    if (!bodyWrapper) return;
    document.body.classList.add("sa-stage-hidden-outer");
    // Inner class is applied to body wrapper so that it won't affect the project page.
    bodyWrapper.classList.add("sa-stage-hidden");
    hideStageButton.classList.remove(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
    window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas
  }

  function unhideStage(e) {
    stageHidden = false;
    if (!bodyWrapper) return;
    document.body.classList.remove("sa-stage-hidden-outer");
    bodyWrapper.classList.remove("sa-stage-hidden");
    hideStageButton.classList.add(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
    window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas
  }

  addon.self.addEventListener("disabled", () => unhideStage());

  // Some places in Scratch's renderer use canvas.clientWidth and canvas.clientHeight.
  // When the stage is hidden these will return 0 which can cause infinite loops or crashes.
  const renderer = vm.renderer;

  // Used by "touching mouse pointer" block and hovered sprite detection.
  const originalClientSpaceToScratchBounds = renderer.clientSpaceToScratchBounds;
  renderer.clientSpaceToScratchBounds = function patchedClientSpaceToScratchBounds(...args) {
    const result = originalClientSpaceToScratchBounds.apply(this, args);
    // Hidden stage causes left, right, bottom, top to be all Infinity.
    if (stageHidden && result.left === Infinity) {
      // Pretend the mouse is very far offscreen so that it shouldn't be touching anything
      const BIG_NUMBER = 1000000;
      // left, right, bottom, top
      result.initFromBounds(BIG_NUMBER, BIG_NUMBER, BIG_NUMBER, BIG_NUMBER);
    }
    return result;
  };

  // Used by code editor eye droppers.
  // We already hide the button with CSS but just in case it somehow gets called anyways, we'll still fix
  // this method.
  const originalExtractColor = renderer.extractColor;
  renderer.extractColor = function patchedExtractColor(...args) {
    const result = originalExtractColor.apply(this, args);
    // Hidden stage causes NaN width/height, empty data array, color object with all undefined
    if (stageHidden && isNaN(result.width)) {
      // Pretend the canvas is transparent. The user has no way to hover over the stage anyways.
      return {
        // 4 bytes for 1 RGBA pixel
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
        color: {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
        },
      };
    }
    return result;
  };

  // Scratch might try to resize the canvas to 0x0 when you leave fullscreen with the stage hidden.
  const originalResize = renderer.resize;
  renderer.resize = function patchedResize(width, height) {
    if (stageHidden && (width === 0 || height === 0)) {
      return originalResize.call(this, this._nativeSize[0], this._nativeSize[1]);
    }
    return originalResize.call(this, width, height);
  };

  while (true) {
    const stageControls = await addon.tab.waitForElement("[class*='stage-header_stage-size-toggle-group_']", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    bodyWrapper = document.querySelector("[class*='gui_body-wrapper_']");
    smallStageButton = stageControls.firstChild;
    smallStageButton.classList.add("sa-stage-button-middle");
    largeStageButton = stageControls.lastChild;
    hideStageButton = Object.assign(document.createElement("div"), {
      role: "button",
      className: addon.tab.scratchClass(
        "button_outlined-button",
        "stage-header_stage-button",
        "stage-header_stage-button-first",
        { others: "sa-hide-stage-button" }
      ),
    });
    addon.tab.displayNoneWhileDisabled(hideStageButton);
    stageControls.insertBefore(hideStageButton, smallStageButton);
    hideStageButton.appendChild(
      Object.assign(document.createElement("img"), {
        className: addon.tab.scratchClass("stage-header_stage-button-icon"),
        src: addon.self.dir + "/icon.svg",
        alt: msg("hide-stage"),
        draggable: false,
      })
    );
    if (stageHidden) hideStage();
    else unhideStage();
    hideStageButton.addEventListener("click", hideStage);
    smallStageButton.addEventListener("click", unhideStage);
    largeStageButton.addEventListener("click", unhideStage);
  }
}
