function fixConsole() {
  // April Fools 2023 test code
  Object.defineProperty(Function.prototype, "defaultProps", {
    get: function () {
      return this.__defaultProps;
    },
    set: function (newValue) {
      newValue.isTotallyNormal = true;
      this.__defaultProps = newValue;
      return newValue;
    },
  });
  // April Fools 2023 test code end

  window._realConsole = {
    ...console,
  };
}

if (!(document.documentElement instanceof SVGElement)) {
  const fixConsoleScript = document.createElement("script");
  fixConsoleScript.append(document.createTextNode("(" + fixConsole + ")()"));
  (document.head || document.documentElement).appendChild(fixConsoleScript);
}
