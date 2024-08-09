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

  const renderTimes = [];
  let lastFps = 0;
  let wasRunning = false;

  const { renderer } = runtime;
  const _draw = renderer.draw;
  renderer.draw = function () {
    _draw.call(this);

    // Every time this function is ran, store the current time and remove times from half a second ago
    const now = runtime.currentMSecs;
    while (renderTimes.length > 0 && renderTimes[0] <= now - 500) renderTimes.shift();
    // Calculate FPS times of each render frame.
    const allFps = renderTimes.map((time, i) => 1000 / ((renderTimes[i + 1] ?? now) - time));
    renderTimes.push(now);
    let fps = 0;
    if (allFps.length !== 0) {
      // Average FPS times.
      fps = Math.round(allFps.reduce((prev, curr) => prev + curr, 0) / allFps.length);
    }

    // Show/Hide the element based on if there are any threads running
    if (runtime.threads.length === 0) {
      if (wasRunning) fpsCounterElement.classList.remove("show");
      wasRunning = false;
      return;
    }
    if (!wasRunning) fpsCounterElement.classList.add("show");
    wasRunning = true;

    // Update element text
    if (fps !== lastFps) fpsCounterElement.innerText = msg("fpsCounter", { fps: (lastFps = fps) });
  };

  while (true) {
    await addon.tab.waitForElement('[class*="controls_controls-container"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: fpsCounterElement, order: 3 });
  }
}
