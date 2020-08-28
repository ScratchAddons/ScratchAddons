function injectFindVm() {
  const oldBind = Function.prototype.bind;
  Function.prototype.bind = function (...args) {
      if (args[0] && args[0].hasOwnProperty("editingTarget") && args[0].hasOwnProperty("runtime")) {
          Function.prototype.bind = oldBind;
          window._scratchAddonsScratchVM = args[0];
      }
      return oldBind.apply(this, args);
  };
};

const injectFindVmScript = document.createElement('script');
injectFindVmScript.append(document.createTextNode('(' + injectFindVm + ')()'));
(document.head || document.documentElement).appendChild(injectFindVmScript);