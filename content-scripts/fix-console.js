function fixConsole() {
  window._realConsole = {
    ...console,
  };
}

if (!(document.documentElement instanceof SVGElement)) {
  immediatelyRunFunctionInMainWorld(fixConsole);
}
