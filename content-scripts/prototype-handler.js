function injectPrototype() {
  const oldBind = Function.prototype.bind;
  // Use custom event target
  window.__scratchAddonsTraps = new EventTarget();
  const onceMap = (__scratchAddonsTraps._onceMap = Object.create(null));

  Function.prototype.bind = function (...args) {
    if (Function.prototype.bind === oldBind) {
      // Just in case some code stores the bind function once on startup, then always uses it.
      return oldBind.apply(this, args);
    } else if (
      args[0] &&
      Object.prototype.hasOwnProperty.call(args[0], "editingTarget") &&
      Object.prototype.hasOwnProperty.call(args[0], "runtime")
    ) {
      onceMap.vm = args[0];
      // After finding the VM, return to previous Function.prototype.bind
      Function.prototype.bind = oldBind;
      return oldBind.apply(this, args);
    } else {
      return oldBind.apply(this, args);
    }
  };

  const listeners = (__scratchAddonsTraps.listeners = new Array());

  const oldAddListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = function (...args) {
    listeners.push({
      event: args[0],
      callback: args[1],
      options: args[2],
      element: this,
    });

    oldAddListener.bind(this)(...args);
  };

  const oldRemoveListener = Element.prototype.removeEventListener;
  Element.prototype.removeEventListener = function (...args) {
    listeners.splice(
      listeners.indexOf(
        listeners.filter(
          (listener) =>
            listener.event === args[0] &&
            listener.callback === args[1] &&
            (typeof args[2] === "object" && typeof listener.options === "object"
              ? JSON.stringify(args[2]) === JSON.stringify(listener.options)
              : args[2] === listener.options) &&
            this === listener.element
        )[0]
      ),
      1
    );

    oldRemoveListener.bind(this)(...args);
  };
}

if (location.pathname.split("/")[1] === "projects") {
  const injectPrototypeScript = document.createElement("script");
  injectPrototypeScript.append(document.createTextNode("(" + injectPrototype + ")()"));
  (document.head || document.documentElement).appendChild(injectPrototypeScript);
}
