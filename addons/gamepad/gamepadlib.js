let console = window.console;

const OFF = 0;
const LOW = 1;
const HIGH = 2;

/*
Mapping types:

type: "key" maps a button to a keyboard key
All key names will be interpreted as a KeyboardEvent.key value (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)
high: "KeyName" is the name of the key to dispatch when a button reads a HIGH value
low: "KeyName" is the name of the key to dispatch when a button reads a LOW value
deadZone: 0.5 controls the minimum value necessary to be read in either + or - to trigger either high or low
The high/low distinction is necessary for axes. Buttons will only use high

type: "mousedown" maps a button to control whether the mouse is down or not
deadZone: 0.5 controls the minimum value to trigger a mousedown

type: "virtual_cursor" maps a button to control the "virtual cursor"
deadZone: 0.5 again controls the minimum value to trigger a movement
sensitivity: 10 controls the speed
high: "+y"/"-y"/"+x"/"-x" defines what happens when an axis reads high
low: "+y"/"-y"/"+x"/"-x" defines what happens when an axis reads low
+y increases y, -y decreases y, +x increases x, -x decreases x.
*/

const defaultAxesMappings = {
  arrows: [
    {
      /*
      Axis 0
      Xbox: Left analog stick left(-)/right(+)
      SNES-like: D-pad left(-1)/right(+1)
      */
      type: "key",
      high: "ArrowRight",
      low: "ArrowLeft",
      deadZone: 0.5,
    },
    {
      /*
      Axis 1
      Xbox: Left analog stick up(-)/down(+)
      SNES-like: D-pad up(-1)/down(+1)
      */
      type: "key",
      high: "ArrowDown",
      low: "ArrowUp",
      deadZone: 0.5,
    },
  ],
  wasd: [
    {
      type: "key",
      high: "d",
      low: "a",
      deadZone: 0.5,
    },
    {
      type: "key",
      high: "s",
      low: "w",
      deadZone: 0.5,
    },
  ],
  cursor: [
    {
      /*
      Axis 2
      Xbox: Right analog stick left(-)/right(+)
      */
      type: "virtual_cursor",
      high: "+x",
      low: "-x",
      sensitivity: 0.6,
      deadZone: 0.2,
    },
    {
      /*
      Axis 3
      Xbox: Right analog stick up(-)/down(+)
      */
      type: "virtual_cursor",
      high: "-y",
      low: "+y",
      sensitivity: 0.6,
      deadZone: 0.2,
    },
  ],
  none: {
    type: "none",
  },
};

const transformAndCopyMapping = (mapping) => {
  if (typeof mapping !== "object" || !mapping) {
    console.warn("invalid mapping", mapping);
    return { type: "none" };
  }
  const copy = Object.assign({}, mapping);
  if (copy.type === "key") {
    copy._state = OFF;
    if (typeof copy.deadZone === "undefined") {
      copy.deadZone = 0.5;
    }
    if (typeof copy.high === "undefined") {
      copy.high = "";
    }
    if (typeof copy.low === "undefined") {
      copy.low = "";
    }
  } else if (copy.type === "mousedown") {
    copy._isDown = false;
    if (typeof copy.deadZone === "undefined") {
      copy.deadZone = 0.5;
    }
  } else if (copy.type === "virtual_cursor") {
    if (typeof copy.high === "undefined") {
      copy.high = "";
    }
    if (typeof copy.low === "undefined") {
      copy.low = "";
    }
    if (typeof copy.sensitivity === "undefined") {
      copy.sensitivity = 10;
    }
    if (typeof copy.deadZone === "undefined") {
      copy.deadZone = 0.5;
    }
  } else if (copy.type === "none") {
    // no-op
  } else {
    console.warn("unknown mapping type", copy.type);
    return { type: "none" };
  }
  return copy;
};
const prepareMappingForExport = (mapping) => {
  const copy = Object.assign({}, mapping);
  delete copy._state;
  delete copy._isDown;
  return copy;
};
const prepareAxisMappingForExport = prepareMappingForExport;
const prepareButtonMappingForExport = (mapping) => {
  const copy = prepareMappingForExport(mapping);
  delete copy.deadZone;
  return copy;
};

const getMovementConfiguration = (usedKeys) => ({
  usesArrows:
    (usedKeys.has("ArrowUp") && usedKeys.has("ArrowDown")) || (usedKeys.has("ArrowRight") && usedKeys.has("ArrowLeft")),
  usesWASD: (usedKeys.has("w") && usedKeys.has("s")) || (usedKeys.has("a") && usedKeys.has("d")),
});

const getGamepadId = (gamepad) => `${gamepad.id} (${gamepad.index})`;

class GamepadData {
  /**
   * @param {Gamepad} gamepad Source Gamepad
   * @param {GamepadLib} gamepadLib Parent GamepadLib
   */
  constructor(gamepad, gamepadLib) {
    this.gamepad = gamepad;
    this.gamepadLib = gamepadLib;
    this.buttonMappings = this.getDefaultButtonMappings().map(transformAndCopyMapping);
    this.axesMappings = this.getDefaultAxisMappings().map(transformAndCopyMapping);
  }

  getDefaultButtonMappings() {
    let buttons;
    if (this.gamepadLib.hints.importedSettings) {
      buttons = this.gamepadLib.hints.importedSettings.buttons;
    } else {
      const usedKeys = this.gamepadLib.hints.usedKeys;
      const alreadyUsedKeys = new Set();
      const { usesArrows, usesWASD } = getMovementConfiguration(usedKeys);
      if (usesWASD) {
        alreadyUsedKeys.add("w");
        alreadyUsedKeys.add("a");
        alreadyUsedKeys.add("s");
        alreadyUsedKeys.add("d");
      }
      const possiblePauseKeys = [
        // Restart keys, pause keys, other potentially dangerous keys
        "p",
        "q",
        "r",
      ];
      const possibleActionKeys = [
        " ",
        "Enter",
        "e",
        "f",
        "z",
        "x",
        "c",
        ...Array.from(usedKeys).filter((i) => i.length === 1 && !possiblePauseKeys.includes(i)),
      ];

      const findKey = (keys, def = "none") => {
        for (const key of keys) {
          if (usedKeys.has(key) && !alreadyUsedKeys.has(key)) {
            return reserveKey(key);
          }
        }
        return def;
      };
      const reserveKey = (key) => {
        alreadyUsedKeys.add(key);
        return key;
      };
      const getPrimaryAction = () => {
        if (usesArrows && usedKeys.has("ArrowUp")) {
          return "ArrowUp";
        }
        if (usesWASD && usedKeys.has("w")) {
          return "w";
        }
        return findKey(possibleActionKeys);
      };
      const getSecondaryAction = () => {
        return findKey(possibleActionKeys);
      };
      const getPauseKey = () => {
        return findKey(possiblePauseKeys);
      };
      const getUp = () => {
        if (usesArrows || !usesWASD) return "ArrowUp";
        return "w";
      };
      const getDown = () => {
        if (usesArrows || !usesWASD) return "ArrowDown";
        return "s";
      };
      const getRight = () => {
        if (usesArrows || !usesWASD) return "ArrowRight";
        return "d";
      };
      const getLeft = () => {
        if (usesArrows || !usesWASD) return "ArrowLeft";
        return "a";
      };

      // Set indices "manually" because we don't necessarily want to evaluate them in order.
      buttons = [];
      buttons[0] = {
        /*
        Xbox: A
        SNES-like: B
        */
        type: "key",
        high: getPrimaryAction(),
      };
      buttons[1] = {
        /*
        Xbox: B
        SNES-like: A
        */
        type: "key",
        high: getSecondaryAction(),
      };
      buttons[2] = {
        /*
        Xbox: X
        SNES-like: Y
        */
        type: "key",
        high: getSecondaryAction(),
      };
      buttons[3] = {
        /*
        Xbox: Y
        SNES-like: X
        */
        type: "key",
        high: getSecondaryAction(),
      };
      buttons[4] = {
        /*
        Xbox: LB
        SNES-like: Left trigger
        */
        type: "mousedown",
      };
      buttons[5] = {
        /*
        Xbox: RB
        */
        type: "mousedown",
      };
      buttons[6] = {
        /*
        Xbox: LT
        */
        type: "mousedown",
      };
      buttons[7] = {
        /*
        Xbox: RT
        SNES-like: Right trigger
        */
        type: "mousedown",
      };
      buttons[9] = {
        /*
        Xbox: Menu
        SNES-like: Start
        */
        type: "key",
        high: getPauseKey(),
      };
      buttons[8] = {
        /*
        Xbox: Change view
        SNES-like: Select
        */
        type: "key",
        high: getPauseKey(),
      };
      buttons[10] = {
        /*
        Xbox: Left analog press
        */
        type: "none",
      };
      buttons[11] = {
        /*
        Xbox: Right analog press
        */
        type: "none",
      };
      buttons[12] = {
        /*
        Xbox: D-pad up
        */
        type: "key",
        high: getUp(),
      };
      buttons[13] = {
        /*
        Xbox: D-pad down
        */
        type: "key",
        high: getDown(),
      };
      buttons[14] = {
        /*
        Xbox: D-pad left
        */
        type: "key",
        high: getLeft(),
      };
      buttons[15] = {
        /*
        Xbox: D-pad right
        */
        type: "key",
        high: getRight(),
      };
      for (const button of buttons) {
        if (button.high === "none") {
          button.type = "none";
        }
      }
    }
    while (buttons.length < this.gamepad.buttons.length) {
      buttons.push({
        type: "none",
      });
    }
    buttons.length = this.gamepad.buttons.length;
    return buttons;
  }

  getDefaultAxisMappings() {
    let axes = [];
    if (this.gamepadLib.hints.importedSettings) {
      axes = this.gamepadLib.hints.importedSettings.axes;
    } else {
      // Only return default axis mappings when there are 4 axes, like an xbox controller
      // Some controllers with 2 axes will make the dpad update buttons and axes, which could result in conflicts that we want to avoid by default.
      if (this.gamepad.axes.length === 4) {
        const usedKeys = this.gamepadLib.hints.usedKeys;
        const { usesArrows, usesWASD } = getMovementConfiguration(usedKeys);
        if (usesArrows) {
          axes.push(defaultAxesMappings.arrows[0]);
          axes.push(defaultAxesMappings.arrows[1]);
        } else if (usesWASD) {
          axes.push(defaultAxesMappings.wasd[0]);
          axes.push(defaultAxesMappings.wasd[1]);
        } else {
          axes.push(defaultAxesMappings.cursor[0]);
          axes.push(defaultAxesMappings.cursor[1]);
        }
        axes.push(defaultAxesMappings.cursor[0]);
        axes.push(defaultAxesMappings.cursor[1]);
      }
    }
    while (axes.length < this.gamepad.axes.length) {
      axes.push({
        type: "none",
      });
    }
    axes.length = this.gamepad.axes.length;
    return axes;
  }
}

class GamepadLib extends EventTarget {
  constructor() {
    super();

    /** @type {Map<string, GamepadData>} */
    this.gamepads = new Map();

    this.handleConnect = this.handleConnect.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.update = this.update.bind(this);

    this.animationFrame = null;
    this.currentTime = null;
    this.deltaTime = 0;

    this.virtualCursor = {
      x: 0,
      y: 0,
      maxX: Infinity,
      minX: -Infinity,
      maxY: Infinity,
      minY: -Infinity,
      modified: false,
    };

    this._editor = null;

    this.connectCallbacks = [];

    this.hints = {
      usedKeys: new Set(),
      importedSettings: null,
      generated: false,
    };

    this.addEventHandlers();
  }

  addEventHandlers() {
    window.addEventListener("gamepadconnected", this.handleConnect);
    window.addEventListener("gamepaddisconnected", this.handleDisconnect);
  }

  removeEventHandlers() {
    window.removeEventListener("gamepadconnected", this.handleConnect);
    window.removeEventListener("gamepaddisconnected", this.handleDisconnect);
  }

  gamepadConnected() {
    if (this.gamepads.size > 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.connectCallbacks.push(resolve);
    });
  }

  ensureHintsGenerated() {
    if (this.hints.generated) {
      return;
    }
    if (this.getHintsLazily) {
      Object.assign(this.hints, this.getHintsLazily());
    }
    this.hints.generated = true;
  }

  handleConnect(e) {
    this.ensureHintsGenerated();
    for (const callback of this.connectCallbacks) {
      callback();
    }
    this.connectCallbacks = [];
    const gamepad = e.gamepad;
    const id = getGamepadId(gamepad);
    console.log("connected", gamepad);
    const gamepadData = new GamepadData(gamepad, this);
    this.gamepads.set(id, gamepadData);
    if (this.animationFrame === null) {
      this.animationFrame = requestAnimationFrame(this.update);
    }
    this.dispatchEvent(new CustomEvent("gamepadconnected", { detail: gamepadData }));
  }

  handleDisconnect(e) {
    const gamepad = e.gamepad;
    const id = getGamepadId(gamepad);
    console.log("disconnected", gamepad);
    const gamepadData = this.gamepads.get(id);
    this.gamepads.delete(id);
    this.dispatchEvent(new CustomEvent("gamepaddisconnected", { detail: gamepadData }));
    if (this.gamepads.size === 0) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      this.currentTime = null;
    }
  }

  dispatchKey(key, pressed) {
    if (pressed) {
      this.dispatchEvent(new CustomEvent("keydown", { detail: key }));
    } else {
      this.dispatchEvent(new CustomEvent("keyup", { detail: key }));
    }
  }

  dispatchMouseDown(down) {
    if (down) {
      this.dispatchEvent(new CustomEvent("mousedown"));
    } else {
      this.dispatchEvent(new CustomEvent("mouseup"));
    }
  }

  dispatchMouseMove(x, y) {
    this.dispatchEvent(new CustomEvent("mousemove", { detail: { x, y } }));
  }

  updateButton(value, mapping) {
    if (mapping.type === "key") {
      let state = OFF;
      if (value >= mapping.deadZone) state = HIGH;
      if (value <= -mapping.deadZone) state = LOW;

      const oldState = mapping._state;
      if (state !== oldState) {
        const pressKey = state === HIGH ? mapping.high : state === LOW ? mapping.low : null;
        const unpressKey = oldState === HIGH ? mapping.high : oldState === LOW ? mapping.low : null;
        if (pressKey) {
          this.dispatchKey(pressKey, true);
        }
        if (unpressKey) {
          this.dispatchKey(unpressKey, false);
        }
        mapping._state = state;
      }
    }

    if (mapping.type === "mousedown") {
      const isDown = Math.abs(value) >= mapping.deadZone;
      const oldValue = mapping._isDown;
      if (isDown !== oldValue) {
        this.dispatchMouseDown(isDown);
        mapping._isDown = isDown;
      }
    }

    if (mapping.type === "virtual_cursor") {
      const deadZone = mapping.deadZone;
      let state = OFF;
      if (value >= deadZone) state = HIGH;
      if (value <= -deadZone) state = LOW;

      const action = state === HIGH ? mapping.high : state === LOW ? mapping.low : null;
      const range = 1 - deadZone;
      // a value just beyond the deadzone should have a multiplier near 0, a value at 1/-1 should have a multiplier of 1
      const multiplier = (Math.abs(value) - deadZone) / range;
      const speed = multiplier * multiplier * mapping.sensitivity * this.deltaTime;
      if (action === "+x") {
        this.virtualCursor.x += speed;
        this.virtualCursor.modified = true;
      } else if (action === "-x") {
        this.virtualCursor.x -= speed;
        this.virtualCursor.modified = true;
      } else if (action === "+y") {
        this.virtualCursor.y += speed;
        this.virtualCursor.modified = true;
      } else if (action === "-y") {
        this.virtualCursor.y -= speed;
        this.virtualCursor.modified = true;
      }
    }
  }

  update(time) {
    if (this.currentTime === null) {
      this.deltaTime = 0; // doesn't matter what this is, it's just the first frame
    } else {
      this.deltaTime = time - this.currentTime;
    }
    this.deltaTime = Math.max(Math.min(this.deltaTime, 1000), 0);
    this.currentTime = time;

    this.animationFrame = requestAnimationFrame(this.update);

    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad === null) {
        continue;
      }

      const id = getGamepadId(gamepad);
      const data = this.gamepads.get(id);

      for (let i = 0; i < gamepad.buttons.length; i++) {
        const button = gamepad.buttons[i];
        const value = button.value;
        const mapping = data.buttonMappings[i];
        this.updateButton(value, mapping);
      }

      for (let i = 0; i < gamepad.axes.length; i++) {
        const axis = gamepad.axes[i];
        const mapping = data.axesMappings[i];
        this.updateButton(axis, mapping);
      }
    }

    if (this._editor) {
      this._editor.update(gamepads);
    }

    if (this.virtualCursor.modified) {
      this.virtualCursor.modified = false;
      if (this.virtualCursor.x > this.virtualCursor.maxX) {
        this.virtualCursor.x = this.virtualCursor.maxX;
      }
      if (this.virtualCursor.x < this.virtualCursor.minX) {
        this.virtualCursor.x = this.virtualCursor.minX;
      }
      if (this.virtualCursor.y > this.virtualCursor.maxY) {
        this.virtualCursor.y = this.virtualCursor.maxY;
      }
      if (this.virtualCursor.y < this.virtualCursor.minY) {
        this.virtualCursor.y = this.virtualCursor.minY;
      }
      this.dispatchMouseMove(this.virtualCursor.x, this.virtualCursor.y);
    }
  }

  editor() {
    if (!this._editor) {
      this._editor = new GamepadEditor(this);
    }
    return this._editor;
  }
}

GamepadLib.browserHasBrokenGamepadAPI = () => {
  // Check that the gamepad API is supported at all
  if (!navigator.getGamepads) {
    return true;
  }
  // Firefox on Linux has a broken gamepad API implementation that results in strange and sometimes unusable mappings
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1643358
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1643835
  if (navigator.userAgent.includes("Firefox") && navigator.userAgent.includes("Linux")) {
    return true;
  }
  return false;
};

GamepadLib.setConsole = (n) => (console = n);

const removeAllChildren = (el) => {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
};
const buttonHtmlId = (n) => `gamepadlib-button-${n}`;
const axisHtmlId = (n) => `gamepadlib-axis-${n}`;

class GamepadEditor extends EventTarget {
  constructor(gamepadLib) {
    super();

    /** @type {GamepadLib} */
    this.gamepadLib = gamepadLib;

    this.root = Object.assign(document.createElement("div"), {
      className: "gamepadlib-root",
    });
    this.selector = Object.assign(document.createElement("select"), {
      className: "gamepadlib-selector",
    });
    this.content = Object.assign(document.createElement("div"), {
      className: "gamepadlib-content",
    });

    this.root.appendChild(this.selector);
    this.root.appendChild(this.content);

    this.onSelectorChange = this.onSelectorChange.bind(this);
    this.onGamepadsChange = this.onGamepadsChange.bind(this);

    this.selector.onchange = this.onSelectorChange;
    this.gamepadLib.addEventListener("gamepadconnected", this.onGamepadsChange);
    this.gamepadLib.addEventListener("gamepaddisconnected", this.onGamepadsChange);

    this.buttonIdToElement = new Map();
    this.axisIdToElement = new Map();

    this.hidden = false;

    // should be overridden later
    this.msg = (id, opts) => id;
  }

  onSelectorChange() {
    this.updateContent();
  }

  onGamepadsChange() {
    this.updateAllContent();
  }

  updateAllContent() {
    this.updateDropdown();
    this.updateContent();
    this.focus();
  }

  updateDropdown() {
    removeAllChildren(this.selector);

    const gamepads = Array.from(this.gamepadLib.gamepads.entries());
    if (gamepads.length === 0) {
      this.selector.hidden = true;
      return;
    }
    this.selector.hidden = false;
    for (const [id, _] of gamepads) {
      const option = document.createElement("option");
      option.textContent = id;
      option.value = id;
      this.selector.appendChild(option);
    }
  }

  keyToString(key) {
    if (key === " ") return this.msg("key-space");
    if (key === "ArrowUp") return this.msg("key-up");
    if (key === "ArrowDown") return this.msg("key-down");
    if (key === "ArrowLeft") return this.msg("key-left");
    if (key === "ArrowRight") return this.msg("key-right");
    return key.toUpperCase();
  }

  createButtonMapping(mappingList, index, property = "high") {
    const input = document.createElement("input");
    input.readOnly = true;
    input.className = "gamepadlib-keyinput";
    input.title = this.msg("keyinput-title");
    input.dataset.index = index;
    input.id = buttonHtmlId(index);

    const update = () => {
      const mapping = mappingList[index];
      input.dataset.type = mapping.type;
      if (mapping.type === "none") {
        input.value = this.msg("key-none");
      } else if (mapping.type === "key") {
        input.value = this.keyToString(mapping[property]);
      } else if (mapping.type === "mousedown") {
        input.value = this.msg("key-click");
      } else {
        // should never happen
        input.value = `??? ${mapping.type}`;
      }
    };

    const changedMapping = () => {
      mappingList[index] = transformAndCopyMapping(mappingList[index]);
      isAcceptingInput = false;
      input.blur();
      update();
      this.changed();
    };

    let isAcceptingInput = false;

    const handleClick = (e) => {
      e.preventDefault();
      if (isAcceptingInput) {
        const mapping = mappingList[index];
        mapping.type = "mousedown";
        changedMapping();
      } else {
        input.value = "...";
        input.dataset.acceptingInput = true;
        isAcceptingInput = true;
      }
    };

    const handleKeyDown = (e) => {
      if (isAcceptingInput) {
        e.preventDefault();
        const key = e.key;
        if (["Alt", "Shift", "Control"].includes(key)) {
          return;
        }
        const mapping = mappingList[index];
        if (key.length === 1 || ["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"].includes(key)) {
          mapping.type = "key";
          mapping[property] = key;
        } else if (key !== "Escape") {
          mapping.type = "none";
        }
        changedMapping();
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.target.click();
      }
    };

    const handleBlur = () => {
      input.dataset.acceptingInput = false;
      if (isAcceptingInput) {
        isAcceptingInput = false;
        update();
      }
    };

    input.addEventListener("click", handleClick);
    input.addEventListener("keydown", handleKeyDown);
    input.addEventListener("blur", handleBlur);
    update();

    return input;
  }

  createAxisButtonMapping(mappingList, index, property, visualIndex) {
    const el = this.createButtonMapping(mappingList, index, property);
    el.classList.add('gamepadlib-axis-mapper');
    return el;
  }

  createAxisMapping(mappingList, index) {
    const selector = document.createElement("select");
    selector.className = "gamepadlib-axis-mapping";
    selector.id = axisHtmlId(index);
    selector.appendChild(
      Object.assign(document.createElement("option"), {
        textContent: "None",
        value: "none"
      })
    );
    selector.appendChild(
      Object.assign(document.createElement("option"), {
        textContent: "Cursor",
        value: "cursor"
      })
    );
    selector.appendChild(
      Object.assign(document.createElement("option"), {
        textContent: "WASD",
        value: "wasd"
      })
    );
    selector.appendChild(
      Object.assign(document.createElement("option"), {
        textContent: "Arrow Keys",
        value: "arrows"
      })
    );
    selector.appendChild(
      Object.assign(document.createElement("option"), {
        textContent: "Custom",
        value: "custom"
      })
    );

    if (mappingList[index].type === "key") {
      if (
        mappingList[index].high === defaultAxesMappings.wasd[0].high &&
        mappingList[index].low === defaultAxesMappings.wasd[0].low &&
        mappingList[index + 1].high === defaultAxesMappings.wasd[1].high &&
        mappingList[index + 1].low === defaultAxesMappings.wasd[1].low
      ) {
        selector.value = "wasd";
      } else if (
        mappingList[index].high === defaultAxesMappings.arrows[0].high &&
        mappingList[index].low === defaultAxesMappings.arrows[0].low &&
        mappingList[index + 1].high === defaultAxesMappings.arrows[1].high &&
        mappingList[index + 1].low === defaultAxesMappings.arrows[1].low
      ) {
        selector.value = "arrows";
      } else {
        selector.value = "custom";
      }
    } else if (mappingList[index].type === "virtual_cursor") {
      selector.value = "cursor";
    } else {
      selector.value = "none";
    }

    const circleOverlay = document.createElement("div");
    circleOverlay.className = "gamepadlib-axis-circle-overlay";
    const buildOverlayDOM = () => {
      removeAllChildren(circleOverlay);
      if (selector.value === "custom") {
        circleOverlay.appendChild(this.createAxisButtonMapping(mappingList, index, 'high'));
        circleOverlay.appendChild(this.createAxisButtonMapping(mappingList, index, 'low'));
        circleOverlay.appendChild(this.createAxisButtonMapping(mappingList, index + 1, 'high'));
        circleOverlay.appendChild(this.createAxisButtonMapping(mappingList, index + 1, 'low'));
      }
    };
    buildOverlayDOM();

    selector.addEventListener("change", () => {
      if (selector.value === "arrows" || selector.value === "custom") {
        mappingList[index] = defaultAxesMappings.arrows[0];
        mappingList[index + 1] = defaultAxesMappings.arrows[1];
      } else if (selector.value === "wasd") {
        mappingList[index] = defaultAxesMappings.wasd[0];
        mappingList[index + 1] = defaultAxesMappings.wasd[1];
      } else if (selector.value === "cursor") {
        mappingList[index] = defaultAxesMappings.cursor[0];
        mappingList[index + 1] = defaultAxesMappings.cursor[1];
      } else {
        mappingList[index] = defaultAxesMappings.none;
        mappingList[index + 1] = defaultAxesMappings.none;
      }
      buildOverlayDOM();
      this.changed();
    });

    return {
      circleOverlay,
      selector
    };
  }

  updateContent() {
    removeAllChildren(this.content);

    if (this.hidden) {
      return;
    }

    const selectedId = this.selector.value;
    if (!selectedId) {
      const message = document.createElement("div");
      message.textContent = this.msg("no-controllers");
      this.content.appendChild(message);
      return;
    }

    const gamepadData = this.gamepadLib.gamepads.get(selectedId);
    if (!gamepadData) {
      // Users should never be able to see this
      const message = document.createElement("div");
      message.textContent = `Cannot find controller: ${selectedId}`;
      this.content.appendChild(message);
      return;
    }

    this.buttonIdToElement.clear();
    this.axisIdToElement.clear();

    const mappingsContainer = document.createElement("div");
    mappingsContainer.className = "gamepadlib-content-buttons";
    const buttonMappings = gamepadData.buttonMappings;
    for (let i = 0; i < buttonMappings.length; i++) {
      const container = document.createElement("div");
      container.className = "gamepadlib-mapping";
      container.dataset.id = i;
      const label = document.createElement("label");
      label.className = "gamepadlib-mapping-label";
      label.textContent = this.msg("button-n", { n: i });
      label.htmlFor = buttonHtmlId(i);
      const options = document.createElement("div");
      options.className = "gamepadlib-mapping-options";
      options.appendChild(this.createButtonMapping(buttonMappings, i));
      container.appendChild(label);
      container.appendChild(options);
      mappingsContainer.appendChild(container);
      this.buttonIdToElement.set(i, container);
    }

    const axesContainer = document.createElement("div");
    axesContainer.className = "gamepadlib-content-axes";
    const axesMappings = gamepadData.axesMappings;
    for (let i = 0; i < axesMappings.length; i += 2) {
      const container = document.createElement("div");
      container.className = "gamepadlib-axis";
      const label = document.createElement("label");
      label.textContent = this.msg("axes-a-b", { a: i, b: i + 1 });
      label.htmlFor = axisHtmlId(i);
      const circle = document.createElement("div");
      circle.className = "gamepadlib-axis-circle";
      const {circleOverlay, selector} = this.createAxisMapping(axesMappings, i);
      circle.appendChild(circleOverlay);
      const dot = document.createElement("div");
      dot.className = "gamepadlib-axis-dot";
      circle.appendChild(dot);
      container.appendChild(label);
      container.appendChild(circle);
      container.appendChild(selector);
      axesContainer.appendChild(container);
      this.axisIdToElement.set(i, dot);
    }

    this.content.appendChild(mappingsContainer);
    this.content.appendChild(axesContainer);
  }

  update(gamepads) {
    if (this.hidden) {
      return;
    }
    const selectedId = this.selector.value;
    if (!selectedId) {
      return;
    }
    const gamepad = gamepads[this.selector.selectedIndex];
    if (!gamepad) {
      return;
    }
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const element = this.buttonIdToElement.get(i);
      if (element) {
        const button = gamepad.buttons[i];
        const value = button.value.toString();
        if (value !== element.dataset.value) {
          element.dataset.value = value;
        }
      }
    }
    for (let i = 0; i < gamepad.axes.length; i += 2) {
      const element = this.axisIdToElement.get(i);
      if (element) {
        const x = gamepad.axes[i];
        const y = gamepad.axes[i + 1] || 0;
        const size = 150 / 2;
        element.style.transform = `translate(-50%, -50%) translate(${x * size}px, ${y * size}px)`;
      }
    }
  }

  export() {
    const selectedId = this.selector.value;
    if (!selectedId) {
      return null;
    }
    const gamepadData = this.gamepadLib.gamepads.get(selectedId);
    if (!gamepadData) {
      return null;
    }
    return {
      axes: gamepadData.axesMappings.map(prepareAxisMappingForExport),
      buttons: gamepadData.buttonMappings.map(prepareButtonMappingForExport),
    };
  }

  changed() {
    this.dispatchEvent(new CustomEvent("change"));
  }

  hide() {
    this.hidden = true;
    this.updateContent();
  }

  focus() {
    if (this.selector.value) {
      this.selector.focus();
    }
  }

  generateEditor() {
    this.hidden = false;
    this.updateAllContent();
    return this.root;
  }
}

export default GamepadLib;
