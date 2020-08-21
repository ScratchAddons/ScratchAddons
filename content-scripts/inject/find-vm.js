Function.prototype.__bind__ = Function.prototype.bind;
Function.prototype.bind = function(...args) {
    if (args[0] && args[0].hasOwnProperty("editingTarget") && args[0].hasOwnProperty("runtime")) {
        Function.prototype.bind = Function.prototype.__bind__;
        window._scratchAddonsScratchVM = args[0];
    }
    return Function.prototype.__bind__.apply(this, args);
};