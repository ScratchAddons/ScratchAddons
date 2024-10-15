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

const isLocal = location.origin === "https://scratchfoundation.github.io" || ["8601", "8602"].includes(location.port);
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

immediatelyRunFunctionInMainWorld(() => {
  window.__scratchAddonsSessionRes = { loaded: false, session: null };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, path, ...args) {
    if (method === "GET" && path === "/session/") {
      this.addEventListener(
        "load",
        () => {
          if (this.responseType !== "json") return;
          window.__scratchAddonsSessionRes.session = this.response;
          window.__scratchAddonsSessionRes.loaded = true;
        },
        { once: true }
      );
    }
    return originalXhrOpen.call(this, method, path, ...args);
  };
});
