export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  let showIconOnly = addon.settings.get("showicononly");

  if (addon.tab.redux.state && addon.tab.redux.state.scratchGui.stageSize.stageSize === "small") {
    document.body.classList.add("sa-clones-small");
  }

  (async () => {
    while (true) {
      let lastSize = addon.tab.redux.state.scratchGui.stageSize.stageSize;
      await addon.tab.redux.waitForState((state) => state.scratchGui.stageSize.stageSize !== lastSize, {
        actions: ["scratch-gui/StageSize/SET_STAGE_SIZE"],
      });

      if (lastSize === "small") document.body.classList.remove("sa-clones-small");
      else document.body.classList.add("sa-clones-small");
    }
  })();

  let countContainerContainer = document.createElement("div");

  let countContainer = document.createElement("div");
  let count = document.createElement("span");
  let icon = document.createElement("span");

  countContainerContainer.className = "clone-container-container";
  countContainer.className = "clone-container";
  count.className = "clone-count";
  icon.className = "clone-icon";

  countContainerContainer.appendChild(icon);
  countContainerContainer.appendChild(countContainer);
  countContainer.appendChild(count);

  let lastChecked = 0;

  const cache = Array(301)
    .fill()
    .map((_, i) => msg("clones", { cloneCount: i }));

  function doCloneChecks(force) {
    const v = vm.runtime._cloneCounter;
    // performance
    if (v === lastChecked && !force) return;
    countContainerContainer.dataset.count = lastChecked = v;
    if (showIconOnly) {
      count.dataset.str = v;
    } else {
      count.dataset.str = cache[v] || msg("clones", { cloneCount: v });
    }

    if (v === 0) countContainerContainer.style.display = "none";
    else addon.tab.displayNoneWhileDisabled(countContainerContainer, { display: "flex" });
  }

  addon.settings.addEventListener("change", () => {
    showIconOnly = addon.settings.get("showicononly");
    doCloneChecks(true);
  });

  vm.runtime.on("targetWasRemoved", (t) => {
    // Fix bug with inaccurate clone counter
    if (t.isOriginal) vm.runtime.changeCloneCounter(1);
  });
  const oldStep = vm.runtime._step;
  vm.runtime._step = function (...args) {
    const ret = oldStep.call(this, ...args);
    doCloneChecks();
    return ret;
  };

  while (true) {
    await addon.tab.waitForElement('[class*="controls_controls-container"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });

    if (addon.tab.editorMode === "editor") {
      addon.tab.appendToSharedSpace({ space: "afterStopButton", element: countContainerContainer, order: 2 });
    }
  }
}
