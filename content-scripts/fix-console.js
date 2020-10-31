function fixConsole() {
  window._realConsole = {
    ...console,
  };
}

const fixConsoleScript = document.createElement("script");
fixConsoleScript.append(document.createTextNode("(" + fixConsole + ")()"));
(document.head || document.documentElement).appendChild(fixConsoleScript);
