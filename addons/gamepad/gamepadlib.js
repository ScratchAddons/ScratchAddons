const OFF = 0;
const LOW = 1;
const HIGH = 2;

const BUTTON = 10;
const AXIS = 11;

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

const defaultMappings = {
  buttons: [
    {
      /*
      Button 0
      Xbox: A
      SNES-like: B
      */
      type: "key",
      high: " ",
    },
    {
      /*
      Button 1
      Xbox: B
      SNES-like: A
      */
      type: "none",
    },
    {
      /*
      Button 2
      Xbox: X
      SNES-like: Y
      */
      type: "key",
      high: "E",
    },
    {
      /*
      Button 3
      Xbox: Y
      SNES-like: X
      */
      type: "key",
      high: "E",
    },
    {
      /*
      Button 4
      Xbox: LB
      SNES-like: Left trigger
      */
      type: "mousedown",
    },
    {
      /*
      Button 5
      Xbox: RB
      */
      type: "mousedown",
    },
    {
      /*
      Button 6
      Xbox: LT
      */
      type: "mousedown",
    },
    {
      /*
      Button 7
      Xbox: RT
      SNES-like: Right trigger
      */
      type: "mousedown",
    },
    {
      /*
      Button 8
      Xbox: Change view
      SNES-like: Select
      */
      type: "none",
    },
    {
      /*
      Button 9
      Xbox: Menu
      SNES-like: Start
      */
      type: "key",
      high: "P",
    },
    {
      /*
      Button 10
      Xbox: Left analog press
      */
      type: "none",
    },
    {
      /*
      Button 11
      Xbox: Right analog press
      */
      type: "none",
    },
    {
      /*
      Button 12
      Xbox: D-pad up
      */
      type: "key",
      high: "ArrowUp",
    },
    {
      /*
      Button 13
      Xbox: D-pad down
      */
      type: "key",
      high: "ArrowDown",
    },
    {
      /*
      Button 14
      Xbox: D-pad left
      */
      type: "key",
      high: "ArrowLeft",
    },
    {
      /*
      Button 15
      Xbox: D-pad right
      */
      type: "key",
      high: "ArrowRight",
    },
    {
      /*
      Button 16
      */
      type: "none",
    },
  ],
  axes: [
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
};

const transformAndCopyMapping = (mapping) => {
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
  }
  return copy;
};

class GamepadData {
  /** @param {Gamepad} gamepad Source Gamepad */
  constructor(gamepad) {
    this.id = gamepad.id;

    this.buttonMappings = defaultMappings.buttons.map((i) => transformAndCopyMapping(i));
    this.axesMappings = defaultMappings.axes.map((i) => transformAndCopyMapping(i));

    // If the controller has more or less axes or buttons than the defaults, create some no-op mapping or remove some.
    while (this.buttonMappings.length < gamepad.buttons.length) {
      this.buttonMappings.push({
        type: "none",
      });
    }
    this.buttonMappings.length = gamepad.buttons.length;

    while (this.axesMappings.length < gamepad.axes.length) {
      this.axesMappings.push({
        type: "none",
      });
    }
    this.axesMappings.length = gamepad.axes.length;
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

  handleConnect(e) {
    const gamepad = e.gamepad;
    const id = gamepad.id;
    console.log("connected", gamepad);
    const gamepadData = new GamepadData(gamepad);
    this.gamepads.set(id, gamepadData);
    if (this.animationFrame === null) {
      this.animationFrame = requestAnimationFrame(this.update);
    }
    this.dispatchEvent(new CustomEvent("gamepadconnected", { detail: gamepadData }));
  }

  handleDisconnect(e) {
    const gamepad = e.gamepad;
    const id = gamepad.id;
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
      this.deltaTime = 60 / 1000;
    } else {
      this.deltaTime = time - this.currentTime;
    }
    this.currentTime = time;

    this.animationFrame = requestAnimationFrame(this.update);
    const gamepads = navigator.getGamepads();

    for (const gamepad of gamepads) {
      if (gamepad === null) {
        continue;
      }

      const id = gamepad.id;
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
      // eslint-disable-next-line no-use-before-define
      this._editor = new GamepadEditor(this);
    }
    return this._editor;
  }
}

const removeAllChildren = (el) => {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
};

class GamepadEditor {
  constructor(gamepadLib) {
    /** @type {GamepadLib} */
    this.gamepadLib = gamepadLib;

    this.root = document.createElement("div");
    this.selector = document.createElement("select");
    this.gamepadContainer = document.createElement("div");

    this.root.appendChild(this.selector);
    this.root.appendChild(this.gamepadContainer);

    this.onSelectorChange = this.onSelectorChange.bind(this);
    this.onGamepadsChange = this.onGamepadsChange.bind(this);

    this.selector.onchange = this.onSelectorChange;
    this.gamepadLib.addEventListener("gamepadconnected", this.onGamepadsChange);
    this.gamepadLib.addEventListener("gamepaddisconnected", this.onGamepadsChange);

    this.keys = [
      "none",
      " ",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];
  }

  onSelectorChange() {
    this.updateContent();
  }

  onGamepadsChange() {
    this.updateDropdown();
    this.updateContent();
  }

  updateDropdown() {
    removeAllChildren(this.selector);

    for (const [id, gamepadData] of this.gamepadLib.gamepads.entries()) {
      const option = document.createElement("option");
      option.textContent = id;
      option.value = id;
      this.selector.appendChild(option);
    }
  }

  createMappingTypeSelector(text, type) {
    const option = document.createElement("option");
    option.textContent = text;
    option.value = type;
    return option;
  }

  createKeySelector() {
    const select = document.createElement("select");
    for (const key of this.keys) {
      const option = document.createElement("option");
      option.textContent = key;
      option.value = key;
      select.appendChild(option);
    }
    return select;
  }

  createOptionForMapping(buttonType, mappingList, index) {
    const mapping = mappingList[index];
    const mappingType = mapping.type;

    const container = document.createElement("div");

    const typeSelector = document.createElement("select");
    typeSelector.appendChild(this.createMappingTypeSelector("None", "none"));
    typeSelector.appendChild(this.createMappingTypeSelector("Key", "key"));
    typeSelector.appendChild(this.createMappingTypeSelector("Mouse click", "mousedown"));
    if (buttonType === AXIS) {
      typeSelector.appendChild(this.createMappingTypeSelector("Virtual cursor", "virtual_cursor"));
    }
    typeSelector.value = mappingType;
    typeSelector.onchange = () => {
      mappingList[index] = transformAndCopyMapping({
        type: typeSelector.value,
      });
      this.updateContent();
    };
    container.appendChild(typeSelector);

    if (mappingType === "key") {
      const highSelector = this.createKeySelector();
      highSelector.value = mapping.high;
      container.appendChild(highSelector);

      if (buttonType === AXIS) {
        const lowSelector = this.createKeySelector();
        lowSelector.value = mapping.low;
        container.appendChild(lowSelector);
      }
    }

    // if (mappingType === 'virtual_cursor') {

    // }

    return container;
  }

  updateContent() {
    removeAllChildren(this.gamepadContainer);

    const selectedId = this.selector.value;
    if (!selectedId) {
      const message = document.createElement("div");
      message.textContent = "No controllers.";
      return message;
    }

    const gamepadData = this.gamepadLib.gamepads.get(selectedId);
    if (!gamepadData) {
      const message = document.createElement("div");
      message.textContent = `Cannot find controllers: ${selectedId}`;
      return message;
    }

    const buttonMappings = gamepadData.buttonMappings;
    for (let i = 0; i < buttonMappings.length; i++) {
      const container = document.createElement("div");
      const label = document.createElement("div");
      const options = document.createElement("div");

      label.textContent = `Button ${i}`;
      options.appendChild(this.createOptionForMapping(BUTTON, buttonMappings, i));

      container.appendChild(label);
      container.appendChild(options);
      this.gamepadContainer.appendChild(container);
    }

    const axesMappings = gamepadData.axesMappings;
    for (let i = 0; i < axesMappings.length; i++) {
      const container = document.createElement("div");
      const label = document.createElement("div");
      const options = document.createElement("div");

      label.textContent = `Axis ${i}`;
      options.appendChild(this.createOptionForMapping(AXIS, axesMappings, i));

      container.appendChild(label);
      container.appendChild(options);
      this.gamepadContainer.appendChild(container);
    }
  }

  generateEditor() {
    this.updateDropdown();
    this.updateContent();

    return this.root;
  }
}

export default GamepadLib;
