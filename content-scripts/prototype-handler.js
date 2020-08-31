function injectPrototype() {
  const oldPrototypes = {
    functionBind: Function.prototype.bind,
    arrayPush: Array.prototype.push,
    objectAssign: Object.assign,
  };
  const extraHandlers = {
    functionBind: [],
    arrayPush: [],
    objectAssign: [],
  };
  // Use custom event target
  window.__scratchAddonsTraps = new EventTarget();
  const onceTarget = (__scratchAddonsTraps._targetOnce = new EventTarget());
  const manyTarget = (__scratchAddonsTraps._targetMany = new EventTarget());
  const onceMap = (__scratchAddonsTraps._onceMap = Object.create(null));
  const trapNumOnce = (__scratchAddonsTraps._trapNumOnce = Symbol.for("trapNumOnce"));
  const trapNumMany = (__scratchAddonsTraps._trapNumMany = Symbol.for("trapNumMany"));

  /**
   * Returns if an object matches a shape. Uses shallow compare.
   * Shape is an object with key and value.
   * Value can be null if the key existence is enough,
   * but can be array if type checking is necessary.
   * The array will be an OR (of course) and its items are
   * expected results from typeof target[key], with one big difference:
   * type of null is "null", not "object"
   * @param {object.<string, *>} target target object to check.
   * @param {object.<string, ?array.<string>>} shape shape of the expected object.
   * @returns {boolean} validation result
   *
   */
  const matchObject = (target, shape) => {
    if (!target || typeof target !== "object") return false;
    return Object.keys(shape).every((shapeKey) => {
      const targetKeyType = target[shapeKey] === null ? "null" : typeof target[shapeKey];
      // true === abort
      if (targetKeyType === "undefined") return false;
      if (Array.isArray(shape[shapeKey]) && !shape[shapeKey].includes(targetKeyType)) {
        return false;
      }
      return true;
    });
  };

  /**
   * Dispatches event for "once" objects.
   * "Once" objects are expected to be trapped at most only once per trap.
   * @param {string} trapName name of the trap. Must be unique per trap.
   * @param {*} value trapped value.
   */
  const createReadyOnce = (trapName, value) => {
    if (value && typeof value === "object") {
      try {
        Object.defineProperty(value, trapNumOnce, {
          value: (value[trapNumOnce] || 0) + 1,
          configurable: true,
        });
      } catch (e) {
        console.error("Error when injecting attr:", e);
      }
    }
    onceMap[trapName] = value;
    const readyEvent = new CustomEvent("trapready");
    readyEvent.trapName = trapName;
    readyEvent.value = value;
    onceTarget.dispatchEvent(readyEvent);
    const specificEvent = new CustomEvent(`ready.${trapName}`);
    specificEvent.value = value;
    onceTarget.dispatchEvent(specificEvent);
  };

  /**
   * Dispatches event for "many" objects.
   * "Many" objects may be trapped more than once per trap.
   * @param {string} trapName name of the trap. Must be unique per trap.
   * @param {*} value trapped value.
   */
  const createReadyMany = (trapName, value) => {
    if (value && typeof value === "object") {
      try {
        Object.defineProperty(value, trapNumMany, {
          value: (value[trapNumMany] || 0) + 1,
          configurable: true,
        });
      } catch (e) {
        console.error("Error when injecting attr:", e);
      }
    }
    const readyEvent = new CustomEvent("trapready");
    readyEvent.trapName = trapName;
    readyEvent.value = value;
    manyTarget.dispatchEvent(readyEvent);
    const specificEvent = new CustomEvent(`ready.${trapName}`);
    specificEvent.value = value;
    manyTarget.dispatchEvent(specificEvent);
  };

  /**
   * fake/reconstructed Redux stats share properties of Once and Many.
   * For this reason, state is notified using this function rather than
   * the usual Once or Many dispatcher.
   * @param {string} origin origin of the reducer, e.g. www, locale, gui
   * @param {array.<string>} path path of the reducer. ['a', 'b'] means a.js "b" state.
   * @param {*} prev previous value.
   * @param {*} next next state. note that prev and next can be shallowly or deeply equal.
   */
  const notifyNewState = (origin, path, prev, next) => {
    const ev = new CustomEvent("fakestatechanged");
    ev.reducerOrigin = origin;
    ev.path = path;
    ev.prev = prev;
    ev.next = next;
    __scratchAddonsTraps.dispatchEvent(ev);
  };

  const guiState = (value, ...path) => {
    if (!onceMap.fakeGUIState) onceMap.fakeGUIState = {};
    const realpath = path.slice(0);
    const lastKey = path.pop();
    let obj = onceMap.fakeGUIState;
    for (const key of path) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      if (!obj.hasOwnProperty(key)) obj[key] = {};
      obj = obj[key];
    }
    const prev = obj[lastKey];
    obj[lastKey] = value;
    notifyNewState("gui", realpath, prev, value);
  };

  const localeState = (value, key) => {
    if (!onceMap.fakeLocaleState) onceMap.fakeLocaleState = {};
    const prev = onceMap.fakeLocaleState[key];
    onceMap.fakeLocaleState[key] = value;
    notifyNewState("locale", [key], prev, value);
  };

  const wwwState = (value, ...path) => {
    if (!onceMap.fakeWWWState) onceMap.fakeWWWState = {};
    const realpath = path.slice(0);
    const lastKey = path.pop();
    let obj = onceMap.fakeWWWState;
    for (const key of path) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      if (!obj.hasOwnProperty(key)) obj[key] = {};
      obj = obj[key];
    }
    const prev = obj[lastKey];
    obj[lastKey] = value;
    notifyNewState("www", realpath, prev, value);
  };

  Function.prototype.bind = function (...args) {
    if (args[0] && args[0].hasOwnProperty("editingTarget") && args[0].hasOwnProperty("runtime")) {
      window._scratchAddonsScratchVM = args[0];
      guiState(args[0], "vm");
      createReadyOnce("vm", args[0]);
      window.dispatchEvent(new CustomEvent("vmready"));
    } else {
      extraHandlers.functionBind.forEach((fn) => fn(args));
    }
    return oldPrototypes.functionBind.apply(this, args);
  };
  Array.prototype.push = function (...args) {
    if (typeof args[0] !== "undefined") {
      extraHandlers.arrayPush.forEach((fn) => fn(args));
    }
    return oldPrototypes.arrayPush.apply(this, args);
  };
  Object.assign = function (...args) {
    extraHandlers.objectAssign.forEach((fn) => fn(args));
    return oldPrototypes.objectAssign.apply(null, args);
  };

  // trap Thread
  extraHandlers.arrayPush.push((args) => {
    const maybeThread = args[0];
    if (
      matchObject(maybeThread, {
        target: null,
        blockContainer: null,
        topBlock: ["string"],
        stack: null,
      })
    ) {
      createReadyMany("thread", maybeThread);
    }
  });

  // VM trap: /components/gui/gui.jsx
  extraHandlers.functionBind.push((args) => {
    if (args[0] && args[0].props && args[0].props.vm) {
      guiState(args[0].props.vm, "vm");
      createReadyOnce("vm.propsVMBind", args[0].props.vm);
    }
  });

  // VM trap: /lib/cloud-manager-hoc.jsx etc
  extraHandlers.objectAssign.push((args) => {
    if (args[3] && args[3].vm) {
      guiState(args[3].vm, "vm");
      createReadyOnce("vm.propsVMAssign", args[3].vm);
    }
  });

  // Trapping ScratchBlocks is hard but possible
  extraHandlers.functionBind.push((args) => {
    if (args[0] && args[0].props && args[0].props.options) {
      const connectObj = args[0];
      // Get Blocks constructor. This is not instance, so we need to pollute prototype again.
      if (!connectObj.constructor) return; // just in case
      const blocksConstructor = connectObj.constructor.WrappedComponent;
      if (!blocksConstructor) return; // it's not what we want
      // Pollute blocksConstructor
      const oldSetLocale = blocksConstructor.prototype.setLocale;
      blocksConstructor.prototype.setLocale = function (...args) {
        if (this.ScratchBlocks) createReadyOnce("ScratchBlocks", this.ScratchBlocks);
        if (this.workspace) createReadyOnce("workspace", this.workspace);
        return oldSetLocale.apply(this, args);
      };
    }
  });

  // Making fake state
  // project-fetcher-hoc.jsx
  extraHandlers.objectAssign.push((args) => {
    if (!args[3]) return;
    if (args[1] && args[1].loadingState) {
      guiState(args[1].loadingState, "projectState", "loadingState");
    }
    if (args[1] && args[1].reduxProjectId) {
      guiState(args[1].reduxProjectId, "projectState", "projectId");
    }
  });

  // menu-bar-hoc.jsx
  extraHandlers.objectAssign.push((args) => {
    if (!args[3]) return;
    if (args[1] && args[1].projectChanged) {
      guiState(args[1].projectChanged, "projectChanged");
    }
  });

  // vm-manager-hoc.jsx
  extraHandlers.objectAssign.push((args) => {
    if (!args[3]) return;
    if (args[1] && args[1].fontsLoaded) {
      guiState(args[1].fontsLoaded, "fontsLoaded");
    }
    if (args[1] && args[1].locale) {
      localeState(args[1].locale, "locale");
    }
    if (args[1] && args[1].messages) {
      localeState(args[1].messages, "messages");
    }
    if (args[1] && args[1].projectData) {
      guiState(args[1].projectData, "projectState", "projectData");
    }
    if (args[1] && args[1].projectId) {
      guiState(args[1].projectId, "projectState", "projectId");
    }
    if (args[1] && args[1].isPlayerOnly) {
      guiState(args[1].isPlayerOnly, "mode", "isPlayerOnly");
    }
    if (args[1] && args[1].isStarted) {
      guiState(args[1].isStarted, "vmStatus", "isStarted");
    }
  });
  // project-saver-hoc.jsx
  extraHandlers.objectAssign.push((args) => {
    if (!args[3]) return;
    if (args[1] && args[1].autoSaveTimeoutId) {
      guiState(args[1].autoSaveTimeoutId, "timeout", "autoSaveTimeoutId");
    }
    if (args[1] && args[1].reduxProjectTitle) {
      guiState(args[1].reduxProjectTitle, "projectTitle");
    }
  });

  // navigation.jsx
  extraHandlers.objectAssign.push((args) => {
    if (!args[3]) return;
    if (args[1] && args[1].accountNavOpen) {
      wwwState(args[1].accountNavOpen, "navigation", "accountNavOpen");
    }
    if (args[1] && args[1].session) {
      wwwState(args[1].session, "session");
    }
    if (args[1] && args[1].permissions) {
      wwwState(args[1].permissions, "permissions");
    }
    if (args[1] && args[1].registrationOpen) {
      wwwState(args[1].registrationOpen, "navigation", "registrationOpen");
    }
    if (args[1] && args[1].searchTerm) {
      wwwState(args[1].searchTerm, "navigation", "searchTerm");
    }
    if (args[1] && args[1].unreadMessageCount) {
      wwwState(args[1].unreadMessageCount, "messageCount", "messageCount");
    }
    if (args[1] && args[1].useScratch3Registration) {
      wwwState(args[1].useScratch3Registration, "navigation", "useScratch3Registration");
    }
  });
}
const injectPrototypeScript = document.createElement("script");
injectPrototypeScript.append(document.createTextNode("(" + injectPrototype + ")()"));
(document.head || document.documentElement).appendChild(injectPrototypeScript);
