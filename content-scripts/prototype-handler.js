function injectPrototype() {
  const oldBind = Function.prototype.bind;
  // Use custom event target
  window.__scratchAddonsTraps = new EventTarget();
  const onceMap = (__scratchAddonsTraps._onceMap = Object.create(null));

  /**
   * @param {any} thisArg
   * @param {...any} args
   */
  Function.prototype.bind = function (thisArg, ...args) {
    if (Function.prototype.bind === oldBind) {
      // Just in case some code stores the bind function once on startup, then always uses it.
      return oldBind.apply(this, [thisArg, args]);
    } else if (
      args[0] &&
      Object.prototype.hasOwnProperty.call(args[0], "editingTarget") &&
      Object.prototype.hasOwnProperty.call(args[0], "runtime")
    ) {
      onceMap.vm = args[0];
      // After finding the VM, return to previous Function.prototype.bind
      Function.prototype.bind = oldBind;
      return oldBind.apply(this, [thisArg, args]);
    } else {
      return oldBind.apply(this, [thisArg, args]);
    }
  };
}

if (location.pathname.split("/")[1] === "projects") {
  const injectPrototypeScript = document.createElement("script");
  injectPrototypeScript.append(document.createTextNode("(" + injectPrototype + ")()"));
  (document.head || document.documentElement).appendChild(injectPrototypeScript);
}
