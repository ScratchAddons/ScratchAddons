// Unfortunately `chrome.scripting.registerContentScripts` can only be set to MAIN_WORLD
// since Chrome 102, and we want to support Chrome 96+. This is a workaround to
// synchronously run small statically-defined functions in the main world.
// https://crbug.com/40181146
function immediatelyRunFunctionInMainWorld(fn) {
  if (typeof fn !== "function") throw "Expected function";
  const div = document.createElement("div");
  div.setAttribute("onclick", "(" + fn + ")()");
  document.documentElement.appendChild(div);
  div.click();
  div.remove();
}

const isLocal = location.origin === "https://scratchfoundation.github.io" || location.port === "8601";
if ((!(document.documentElement instanceof SVGElement) && location.pathname.split("/")[1] === "projects") || isLocal) {
  immediatelyRunFunctionInMainWorld(() => {
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
  });
}
