import GamepadLib from "./gamepadlib.js";
import addSmallStageClass from "../../libraries/common/cs/small-stage.js";

export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  // Wait for the project to finish loading. Renderer and scripts will not be fully available until this happens.
  await new Promise((resolve) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });

  const vmStarted = () => vm.runtime._steppingInterval !== null;

  const scratchKeyToKey = (key) => {
    switch (key) {
      case "right arrow":
        return "ArrowRight";
      case "up arrow":
        return "ArrowUp";
      case "left arrow":
        return "ArrowLeft";
      case "down arrow":
        return "ArrowDown";
      case "enter":
        return "Enter";
      case "space":
        return " ";
    }
    return key.toLowerCase().charAt(0);
  };
  const getKeysUsedByProject = () => {
    const allBlocks = [vm.runtime.getTargetForStage(), ...vm.runtime.targets]
      .filter((i) => i.isOriginal)
      .map((i) => i.blocks);
    const result = new Set();
    for (const blocks of allBlocks) {
      for (const block of Object.values(blocks._blocks)) {
        if (block.opcode === "event_whenkeypressed" || block.opcode === "sensing_keyoptions") {
          // For blocks like "key (my variable) pressed?", the sensing_keyoptions still exists but has a null parent.
          if (block.opcode === "sensing_keyoptions" && !block.parent) {
            continue;
          }
          const key = block.fields.KEY_OPTION.value;
          result.add(scratchKeyToKey(key));
        }
      }
    }
    return result;
  };

  const GAMEPAD_CONFIG_MAGIC = " // _gamepad_";
  const findOptionsComment = () => {
    const target = vm.runtime.getTargetForStage();
    const comments = target.comments;
    for (const comment of Object.values(comments)) {
      if (comment.text.includes(GAMEPAD_CONFIG_MAGIC)) {
        return comment;
      }
    }
    return null;
  };
  const parseOptionsComment = () => {
    const comment = findOptionsComment();
    if (!comment) {
      return null;
    }
    const lineWithMagic = comment.text.split("\n").find((i) => i.endsWith(GAMEPAD_CONFIG_MAGIC));
    if (!lineWithMagic) {
      console.warn("Gamepad comment does not contain valid line");
      return null;
    }
    const jsonText = lineWithMagic.substr(0, lineWithMagic.length - GAMEPAD_CONFIG_MAGIC.length);
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.buttons) || !Array.isArray(parsed.axes)) {
        throw new Error("Invalid data");
      }
    } catch (e) {
      console.warn("Gamepad comment has invalid JSON", e);
      return null;
    }
    return parsed;
  };

  GamepadLib.setConsole(console);
  const gamepad = new GamepadLib();

  gamepad.getUserHints = () => {
    const parsedOptions = parseOptionsComment();
    if (parsedOptions) {
      return {
        importedSettings: parsedOptions,
      };
    }
    return {
      usedKeys: getKeysUsedByProject(),
    };
  };
  vm.runtime.on("PROJECT_LOADED", () => {
    gamepad.resetControls();
  });

  if (addon.settings.get("hide")) {
    await new Promise((resolve) => {
      const end = () => {
        addon.settings.removeEventListener("change", listener);
        resolve();
      };
      const listener = () => {
        if (!addon.settings.get("hide")) {
          end();
        }
      };
      gamepad.gamepadConnected().then(end);
      addon.settings.addEventListener("change", listener);
    });
  }

  const renderer = vm.runtime.renderer;
  const width = renderer._xRight - renderer._xLeft;
  const height = renderer._yTop - renderer._yBottom;
  const canvas = renderer.canvas;

  const container = document.createElement("div");
  container.className = "sa-gamepad-container";
  addon.tab.displayNoneWhileDisabled(container);
  const buttonContainer = document.createElement("span");
  buttonContainer.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const buttonContent = document.createElement("div");
  buttonContent.className = addon.tab.scratchClass("button_content");
  const buttonImage = document.createElement("img");
  buttonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  buttonImage.draggable = false;
  buttonImage.src = addon.self.dir + "/gamepad.svg";
  buttonContent.appendChild(buttonImage);
  buttonContainer.appendChild(buttonContent);
  container.appendChild(buttonContainer);

  let editor;
  let shouldStoreSettingsInProject = false;
  const didChangeProject = () => {
    vm.runtime.emitProjectChanged();
    if (vm.editingTarget === vm.runtime.getTargetForStage()) {
      vm.emitWorkspaceUpdate();
    }
  };
  const storeMappings = () => {
    const exported = editor.export();
    if (!exported) {
      console.warn("Could not export gamepad settings");
      return;
    }
    const text = `${msg("config-header")}\n${JSON.stringify(exported)}${GAMEPAD_CONFIG_MAGIC}`;
    const existingComment = findOptionsComment();
    if (existingComment) {
      existingComment.text = text;
    } else {
      const target = vm.runtime.getTargetForStage();
      target.createComment(
        // comment ID, just has to be a random string
        Math.random() + "",
        // block ID
        null,
        // text
        text,
        // x, y, width, height
        50,
        50,
        350,
        150,
        // minimized
        false
      );
    }
    didChangeProject();
  };
  const removeStoredMappings = () => {
    const comment = findOptionsComment();
    if (comment) {
      const target = vm.runtime.getTargetForStage();
      delete target.comments[comment.id];
      didChangeProject();
    }
  };
  const handleGamepadMappingChanged = () => {
    if (shouldStoreSettingsInProject) {
      storeMappings();
    }
  };
  const handleStoreSettingsCheckboxChanged = (e) => {
    shouldStoreSettingsInProject = !!e.target.checked;
    if (shouldStoreSettingsInProject) {
      storeMappings();
    } else {
      removeStoredMappings();
    }
  };
  const handleEditorControllerChanged = () => {
    document.body.classList.toggle("sa-gamepad-has-controller", editor.hasControllerSelected());
    handleGamepadMappingChanged();
  };
  buttonContainer.addEventListener("click", () => {
    if (!editor) {
      editor = gamepad.editor();
      editor.msg = msg;
      editor.addEventListener("mapping-changed", handleGamepadMappingChanged);
      editor.addEventListener("gamepad-changed", handleEditorControllerChanged);
    }
    const editorEl = editor.generateEditor();
    handleEditorControllerChanged();

    const { backdrop, container, content, closeButton, remove } = addon.tab.createModal(msg("settings"), {
      isOpen: true,
      useEditorClasses: true,
    });

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !e.target.closest("[data-accepting-input]")) {
        remove();
      }
    };
    backdrop.addEventListener("click", remove);
    window.addEventListener("keydown", handleKeyDown);
    addon.self.addEventListener("disabled", remove);

    backdrop.classList.add("sa-gamepad-popup-outer");
    container.classList.add("sa-gamepad-popup");

    closeButton.tabIndex = "0";
    closeButton.setAttribute("role", "button");
    closeButton.addEventListener("click", remove);
    closeButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        remove();
      }
    });

    content.classList.add("sa-gamepad-popup-content");
    if (GamepadLib.browserHasBrokenGamepadAPI()) {
      const warning = document.createElement("div");
      warning.textContent = msg("browser-support");
      warning.className = "sa-gamepad-browser-support-warning";
      content.appendChild(warning);
    }
    content.appendChild(editorEl);

    const extraOptionsContainer = document.createElement("div");
    extraOptionsContainer.className = "sa-gamepad-extra-options";
    content.appendChild(extraOptionsContainer);

    const mappingsWereResetOrCleared = () => {
      editor.updateAllContent();
      storeSettingsCheckbox.checked = false;
      shouldStoreSettingsInProject = false;
    };

    const resetButton = document.createElement("button");
    resetButton.className = "sa-gamepad-reset-button";
    resetButton.textContent = msg("reset");
    resetButton.addEventListener("click", () => {
      gamepad.resetControls();
      mappingsWereResetOrCleared();
    });
    extraOptionsContainer.appendChild(resetButton);

    const clearButton = document.createElement("button");
    clearButton.className = "sa-gamepad-reset-button";
    clearButton.textContent = msg("clear");
    clearButton.addEventListener("click", () => {
      gamepad.clearControls();
      mappingsWereResetOrCleared();
    });
    extraOptionsContainer.appendChild(clearButton);

    const storeSettingsLabel = document.createElement("label");
    storeSettingsLabel.className = "sa-gamepad-store-settings";
    storeSettingsLabel.textContent = msg("store-in-project");
    const storeSettingsCheckbox = document.createElement("input");
    storeSettingsCheckbox.type = "checkbox";
    storeSettingsCheckbox.checked = shouldStoreSettingsInProject;
    storeSettingsCheckbox.addEventListener("change", handleStoreSettingsCheckboxChanged);
    storeSettingsLabel.prepend(storeSettingsCheckbox);
    extraOptionsContainer.appendChild(storeSettingsLabel);

    editor.focus();
  });

  addSmallStageClass();

  const virtualCursorElement = document.createElement("img");
  virtualCursorElement.hidden = true;
  virtualCursorElement.className = "sa-gamepad-cursor";
  virtualCursorElement.src = addon.self.dir + "/cursor.png";
  addon.self.addEventListener("disabled", () => {
    virtualCursorElement.hidden = true;
  });

  let hideCursorTimeout;

  const hideRealCursor = () => {
    document.body.classList.add("sa-gamepad-hide-cursor");
  };
  const showRealCursor = () => {
    document.body.classList.remove("sa-gamepad-hide-cursor");
  };
  const virtualCursorSetVisible = (visible) => {
    virtualCursorElement.hidden = !visible;
    clearTimeout(hideCursorTimeout);
    if (visible) {
      hideRealCursor();
      hideCursorTimeout = setTimeout(virtualCursorHide, 8000);
    }
  };
  const virtualCursorHide = () => {
    virtualCursorSetVisible(false);
  };
  const virtualCursorSetDown = (down) => {
    virtualCursorSetVisible(true);
    virtualCursorElement.classList.toggle("sa-gamepad-cursor-down", down);
  };
  const virtualCursorSetPosition = (x, y) => {
    virtualCursorSetVisible(true);
    const CURSOR_SIZE = 6;
    const stageX = width / 2 + x - CURSOR_SIZE / 2;
    const stageY = height / 2 - y - CURSOR_SIZE / 2;
    virtualCursorElement.style.transform = `translate(${stageX}px, ${stageY}px)`;
  };

  document.addEventListener("mousemove", () => {
    virtualCursorSetVisible(false);
    showRealCursor();
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
    if (addon.self.disabled || !vmStarted()) return;
    const [rectWidth, rectHeight] = getCanvasSize();
    vm.postIOData("mouse", {
      ...data,
      canvasWidth: rectWidth,
      canvasHeight: rectHeight,
      x: (virtualX + width / 2) * (rectWidth / width),
      y: (height / 2 - virtualY) * (rectHeight / height),
    });
  };
  const postKeyboardData = (key, isDown) => {
    if (addon.self.disabled || !vmStarted()) return;
    vm.postIOData("keyboard", {
      key,
      isDown,
    });
  };
  const handleGamepadButtonDown = (e) => postKeyboardData(e.detail, true);
  const handleGamepadButtonUp = (e) => postKeyboardData(e.detail, false);
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
    const target = await addon.tab.waitForElement(
      // Full screen button
      '[class^="stage-header_stage-size-row"] [class^="button_outlined-button"], [class*="stage-header_unselect-wrapper_"] > [class^="button_outlined-button"]',
      {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "scratch-gui/mode/SET_FULL_SCREEN",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
        ],
      }
    );
    container.dataset.editorMode = addon.tab.editorMode;
    if (target.closest('[class^="stage-header_stage-size-row"]')) {
      addon.tab.appendToSharedSpace({ space: "stageHeader", element: container, order: 1 });
    } else {
      addon.tab.appendToSharedSpace({ space: "fullscreenStageHeader", element: container, order: 0 });
    }

    const monitorListScaler = document.querySelector("[class^='monitor-list_monitor-list-scaler']");
    monitorListScaler.appendChild(virtualCursorElement);
  }
}
