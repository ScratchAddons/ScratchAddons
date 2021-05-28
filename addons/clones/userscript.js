export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  if (addon.tab.redux.state && addon.tab.redux.state.scratchGui.stageSize.stageSize === "small") {
    document.body.classList.add("sa-clones-small");
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("[class*='stage-header_stage-button-first']")) {
        document.body.classList.add("sa-clones-small");
      } else if (e.target.closest("[class*='stage-header_stage-button-last']")) {
        document.body.classList.remove("sa-clones-small");
      }
    },
    { capture: true }
  );

  let countContainerContainer = document.createElement("div");

  addon.tab.displayNoneWhileDisabled(countContainerContainer, { display: "flex" });

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

  function doCloneChecks() {
    const v = vm.runtime._cloneCounter;
    // performance
    if (v === lastChecked) return false;
    countContainerContainer.dataset.count = lastChecked = v;
    count.dataset.str = cache[v] || "";
    return true;
  }

  const check = () => {
    if (doCloneChecks() && addon.tab.editorMode === "editor") {
      if (!countContainerContainer.isConnected) {
        const elem = document.querySelector("[class^='controls_controls-container']");
        elem.appendChild(countContainerContainer);
      }
    }
  };
  vm.runtime.on("targetWasRemoved", (t) => {
    // Fix bug with inaccurate clone counter
    if (t.isOriginal) vm.runtime.changeCloneCounter(1);
  });
  const oldStep = vm.runtime.constructor.prototype._step;
  vm.runtime.constructor.prototype._step = function (...args) {
    check();
    return oldStep.call(this, ...args);
  };
}
