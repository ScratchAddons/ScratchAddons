function injectPrototype() {
  const oldPrototypes = {
    functionBind: Function.prototype.bind,
    arrayPush: Array.prototype.push,
    arraySort: Array.prototype.sort,
    objectAssign: Object.assign,
  };
  // Use custom event target
  window.__scratchAddonsTraps = new EventTarget();
  const onceTarget = (__scratchAddonsTraps._targetOnce = new EventTarget());
  const onceMap = (__scratchAddonsTraps._onceMap = Object.create(null));
  const trapNumOnce = (__scratchAddonsTraps._trapNumOnce = Symbol.for("trapNumOnce"));

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
    const readyEvent = new CustomEvent("trapready", {
      detail: {
        trapName,
        value,
      },
    });
    onceTarget.dispatchEvent(readyEvent);
    const specificEvent = new CustomEvent(`ready.${trapName}`, {
      detail: {
        value,
      },
    });
    onceTarget.dispatchEvent(specificEvent);
  };

  Function.prototype.bind = function (...args) {
    if (Function.prototype.bind === oldPrototypes.functionBind) {
      // Just in case some code stores the bind function once on startup, then always uses it.
      return oldPrototypes.functionBind.apply(this, args);
    } else if (args[0] && args[0].hasOwnProperty("editingTarget") && args[0].hasOwnProperty("runtime")) {
      createReadyOnce("vm", args[0]);
      // After finding the VM, return to previous Function.prototype.bind
      Function.prototype.bind = oldPrototypes.functionBind;
      return oldPrototypes.functionBind.apply(this, args);
    } else {
      return oldPrototypes.functionBind.apply(this, args);
    }
  };
}

if (location.pathname.split("/")[1] === "projects") {
  const injectPrototypeScript = document.createElement("script");
  injectPrototypeScript.append(document.createTextNode("(" + injectPrototype + ")()"));
  (document.head || document.documentElement).appendChild(injectPrototypeScript);
}
