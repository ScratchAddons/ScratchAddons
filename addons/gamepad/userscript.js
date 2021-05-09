import GamepadLib from "./gamepadlib.js";

export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  // Wait for the project to finish loading. Renderer might not be fully available until this happens.
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });

  const renderer = vm.runtime.renderer;
  const width = renderer._xRight - renderer._xLeft;
  const height = renderer._yTop - renderer._yBottom;
  const canvas = renderer.canvas;

  const spacer = document.createElement("div");
  spacer.className = "sa-gamepad-spacer";
  const buttonGroup = document.createElement("div");
  buttonGroup.className = addon.tab.scratchClass("stage-header_stage-size-toggle-group");
  const buttonContainer = document.createElement("div");
  buttonContainer.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const buttonContent = document.createElement("div");
  buttonContent.className = addon.tab.scratchClass("button_content");
  const buttonImage = document.createElement("img");
  buttonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  buttonImage.draggable = false;
  buttonImage.src = addon.self.dir + "/gamepad.svg";
  buttonContent.appendChild(buttonImage);
  buttonContainer.appendChild(buttonContent);
  buttonGroup.appendChild(buttonContainer);
  spacer.appendChild(buttonGroup);
  buttonContainer.addEventListener("click", () => {
    const editor = gamepad.editor();
    editor.msg = msg;
    const editorEl = editor.generateEditor();

    const close = () => {
      modalOverlay.remove();
      document.body.removeEventListener("click", handleClickOutside, true);
      editor.hide();
    };
    const handleClickOutside = (e) => {
      if (!modalContentContainer.contains(e.target)) {
        close();
      }
    };
    document.body.addEventListener("click", handleClickOutside, true);

    const modalOverlay = document.createElement("div");
    modalOverlay.className = addon.tab.scratchClass("modal_modal-overlay", { others: "sa-gamepad-popup-outer" });
    const modalContentContainer = document.createElement("div");
    modalContentContainer.className = addon.tab.scratchClass("modal_modal-content", { others: "sa-gamepad-popup" });

    const modalHeaderContainer = document.createElement("div");
    modalHeaderContainer.className = addon.tab.scratchClass("modal_header");
    const modalHeaderText = document.createElement("div");
    modalHeaderText.className = addon.tab.scratchClass("modal_header-item", "modal_header-item-title");
    modalHeaderText.textContent = msg("settings");
    modalHeaderContainer.appendChild(modalHeaderText);

    const closeContainer = document.createElement("div");
    closeContainer.className = addon.tab.scratchClass("modal_header-item", "modal_header-item-close");
    const closeButton = document.createElement("div");
    closeButton.className = addon.tab.scratchClass("close-button_close-button", "close-button_large");
    closeButton.tabIndex = "0";
    closeButton.setAttribute("role", "button");
    const closeImage = document.createElement("img");
    closeImage.className = addon.tab.scratchClass("close-button_close-icon");
    closeImage.src = addon.self.dir + "/close.svg";
    closeButton.appendChild(closeImage);
    closeContainer.appendChild(closeButton);
    modalHeaderContainer.appendChild(closeContainer);
    closeButton.addEventListener("click", close);

    const modalContent = document.createElement("div");
    modalContent.className = "sa-gamepad-popup-content";
    modalContent.appendChild(editorEl);

    modalContentContainer.appendChild(modalHeaderContainer);
    modalContentContainer.appendChild(modalContent);
    modalOverlay.appendChild(modalContentContainer);
    document.body.appendChild(modalOverlay);

    editor.focus();
  });

  const virtualCursorContainer = document.createElement("div");
  virtualCursorContainer.hidden = true;
  virtualCursorContainer.className = "sa-gamepad-cursor";
  const virtualCursorImage = document.createElement("img");
  virtualCursorImage.className = "sa-gamepad-cursor-image";
  virtualCursorImage.src = addon.self.dir + "/cursor.png";
  virtualCursorContainer.appendChild(virtualCursorImage);

  let hideCursorTimeout;

  const virtualCursorSetVisible = (visible) => {
    virtualCursorContainer.hidden = !visible;
    clearTimeout(hideCursorTimeout);
    if (visible) {
      hideCursorTimeout = setTimeout(virtualCursorHide, 8000);
    }
  };
  const virtualCursorHide = () => {
    virtualCursorSetVisible(false);
  };
  const virtualCursorSetDown = (down) => {
    virtualCursorSetVisible(true);
    virtualCursorImage.classList.toggle("sa-gamepad-cursor-down", down);
  };
  const virtualCursorSetPosition = (x, y) => {
    virtualCursorSetVisible(true);
    const stageX = width / 2 + x;
    const stageY = height / 2 - y;
    virtualCursorContainer.style.transform = `translate(${(stageX / width) * 100}%, ${(stageY / height) * 100}%)`;
  };

  document.addEventListener("mousemove", () => {
    virtualCursorSetVisible(false);
  });

  let getCanvasSize;
  // Support modern ResizeObserver and slow getBoundingClientRect version for improved browser support (matters for TurboWarp)
  if (window.ResizeObserver) {
    let canvasWidth = width;
    let canvasHeight = height;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvasWidth = entry.contentRect.width;
        canvasHeight = entry.contentRect.height;
      }
    });
    resizeObserver.observe(canvas);
    getCanvasSize = () => [canvasWidth, canvasHeight];
  } else {
    getCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      return [rect.width, rect.height];
    };
  }

  // Both in Scratch space
  let virtualX = 0;
  let virtualY = 0;
  const postMouseData = (data) => {
    const [unscaledCanvasWidth, unscaledCanvasHeight] = getCanvasSize();
    vm.postIOData("mouse", {
      ...data,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      x: (virtualX + width / 2) * (unscaledCanvasWidth / width),
      y: (height / 2 - virtualY) * (unscaledCanvasHeight / height),
    });
  };
  const handleGamepadButtonDown = (e) => {
    const key = e.detail;
    vm.postIOData("keyboard", {
      key: key,
      isDown: true,
    });
  };
  const handleGamepadButtonUp = (e) => {
    const key = e.detail;
    vm.postIOData("keyboard", {
      key: key,
      isDown: false,
    });
  };
  const handleGamepadMouseDown = () => {
    virtualCursorSetDown(true);
    postMouseData({
      isDown: true,
    });
  };
  const handleGamepadMouseUp = () => {
    virtualCursorSetDown(false);
    postMouseData({
      isDown: false,
    });
  };
  const handleGamepadMouseMove = (e) => {
    virtualX = e.detail.x;
    virtualY = e.detail.y;
    virtualCursorSetPosition(virtualX, virtualY);
    postMouseData({});
  };

  GamepadLib.setConsole(console);
  const gamepad = new GamepadLib();
  gamepad.virtualCursor.maxX = renderer._xRight;
  gamepad.virtualCursor.minX = renderer._xLeft;
  gamepad.virtualCursor.maxY = renderer._yTop;
  gamepad.virtualCursor.minY = renderer._yBottom;
  gamepad.addEventListener("keydown", handleGamepadButtonDown);
  gamepad.addEventListener("keyup", handleGamepadButtonUp);
  gamepad.addEventListener("mousedown", handleGamepadMouseDown);
  gamepad.addEventListener("mouseup", handleGamepadMouseUp);
  gamepad.addEventListener("mousemove", handleGamepadMouseMove);

  while (true) {
    const stageHeaderWrapper = await addon.tab.waitForElement('[class*="stage-header_stage-menu-wrapper"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    stageHeaderWrapper.insertBefore(spacer, stageHeaderWrapper.lastChild);

    const stage = document.querySelector("[class^='stage_stage_']");
    stage.appendChild(virtualCursorContainer);
  }
}
