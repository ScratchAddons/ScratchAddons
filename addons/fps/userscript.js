import addSmallStageClass from "../../libraries/common/cs/small-stage.js";

export default async function ({ addon, console, msg }) {
  await new Promise((resolve) => {
    if (addon.tab.traps.vm.editingTarget) return resolve();
    addon.tab.traps.vm.runtime.once("PROJECT_LOADED", resolve);
  });

  const renderer = addon.tab.traps.vm.runtime.renderer;

  let fpsCounterElement = document.createElement("span");
  fpsCounterElement.className = "fps-counter";

  addon.tab.displayNoneWhileDisabled(fpsCounterElement);
  addSmallStageClass();

  const renderTimes = [];
  var fps = "?";
  var lastFps = 0;
  var firstTime = -1;

  renderer.ogDraw = renderer.draw;
  renderer.draw = function () {
    const now = Date.now();
    while (renderTimes.length > 0 && renderTimes[0] <= now - 2000) renderTimes.shift();
    renderTimes.push(now);
    fps = Math.floor(renderTimes.length / 2);
    if (firstTime === -1) firstTime = now;
    if (now - firstTime <= 2500) fps = "?";
    if (fps !== lastFps) fpsCounterElement.innerText = msg("fpsCounter", { fps: (lastFps = fps) });
    renderer.ogDraw();
  };

  while (true) {
    await addon.tab.waitForElement('[class*="controls_controls-container"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: fpsCounterElement, order: 3 });
  }
}
