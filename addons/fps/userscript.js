import addSmallStageClass from "../../libraries/common/cs/small-stage.js";

export default async function ({ addon, console, msg }) {
  const { vm } = addon.tab.traps;
  const { runtime } = vm;
  if (!vm.editingTarget) {
    await new Promise((resolve) => runtime.once("PROJECT_LOADED", resolve));
  }

  let fpsCounterElement = document.createElement("span");
  fpsCounterElement.className = "fps-counter";
  addon.tab.displayNoneWhileDisabled(fpsCounterElement);
  addSmallStageClass();

  let lastRender;
  let lastFps;
  let wasRunning = false;

  const { renderer } = runtime;
  const _draw = renderer.draw;
  renderer.draw = function () {
    _draw.call(this);

    const now = runtime.currentMSecs;
    // If it's been more than 500ms since the last draw, we want to reset the variables.
    if (typeof lastRender !== "number" || now - lastRender > 500) {
      lastRender = now;
      lastFps = null;
      return;
    }
    // If the current time has been rendered, return, Don't show infinity.
    if (now === lastRender) return;
    // Every time this function is ran, store the current time and remove times from half a second ago
    let smoothing = 0.9;
    let calculatedFps = 1000 / (now - lastRender);
    if (typeof lastFps !== "number") lastFps = calculatedFps;
    // Calculate a smoothed FPS so that numbers aren't changing too fast.
    const fps = Math.round(lastFps * smoothing + calculatedFps * (1 - smoothing));
    lastRender = now;

    // Show/Hide the element based on if there are any threads running
    if (runtime.threads.length === 0) {
      if (wasRunning) fpsCounterElement.classList.remove("show");
      wasRunning = false;
      return;
    }
    if (!wasRunning) fpsCounterElement.classList.add("show");
    if (fps !== lastFps || !wasRunning) fpsCounterElement.innerText = msg("fpsCounter", { fps: (lastFps = fps) });
    wasRunning = true;
  };

  while (true) {
    await addon.tab.waitForElement('[class*="controls_controls-container"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: fpsCounterElement, order: 3 });
  }
}
