export default async function ({ addon, global, cons, msg }) {

  await new Promise((resolve) => {
    if (addon.tab.traps.vm.editingTarget) return resolve();
    addon.tab.traps.vm.runtime.once("PROJECT_LOADED", resolve);
  });

  const renderer = addon.tab.traps.vm.runtime.renderer;

  let fpsCounterElement = document.createElement("span");
  fpsCounterElement.className = "fps-counter";

  function updateVisibility() {
    if (addon.tab.redux && addon.tab.redux.state.scratchGui.stageSize.stageSize === "small") {
      fpsCounterElement.style.display = "none";
    } else {
      addon.tab.displayNoneWhileDisabled(fpsCounterElement, { display: "flex" });
    }
  }

  updateVisibility();

  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type !== "scratch-gui/StageSize/SET_STAGE_SIZE") return;
    updateVisibility();
  });

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
    console.log("Hai :D");
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: fpsCounterElement, order: 3 });
  }
}
