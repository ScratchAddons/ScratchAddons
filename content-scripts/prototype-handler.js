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

      const vm = args[0];

      const getStyleFixer = () => {
        const cssVariables = document.documentElement
          .getAttribute("style")
          .split(";")
          .filter((s) => s.trimStart().startsWith("--"))
          .join(";");
        return () => {
          document.documentElement.setAttribute("style", cssVariables);
        };
      };

      const originalsetWorldStageMode = vm.setWorldStageMode;
      vm.setWorldStageMode = function () {
        const fixStyles = getStyleFixer();
        const returnValue = originalsetWorldStageMode.apply(vm, args);
        fixStyles();
        return returnValue;
      };

      (async () => {
        await new Promise((resolve) => {
          if (vm.editingTarget) return resolve();
          vm.runtime.once("PROJECT_LOADED", resolve);
        });
        const renderedTargetPrototype = Object.getPrototypeOf(vm.runtime.getTargetForStage());
        const originalClearEffects = renderedTargetPrototype.clearEffects;
        renderedTargetPrototype.clearEffects = function () {
          const fixStyles = getStyleFixer();
          const returnValue = originalClearEffects.apply(this, args);
          fixStyles();
          return returnValue;
        };
      })();

      return oldBind.apply(this, args);
    } else {
      return oldBind.apply(this, args);
    }
  };
}

if (!(document.documentElement instanceof SVGElement) && location.pathname.split("/")[1] === "projects") {
  const injectPrototypeScript = document.createElement("script");
  injectPrototypeScript.append(document.createTextNode("(" + injectPrototype + ")()"));
  (document.head || document.documentElement).appendChild(injectPrototypeScript);
}
