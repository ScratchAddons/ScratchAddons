export default async function ({ addon, console }) {
  var posContainerContainer = document.createElement("div");
  addon.tab.displayNoneWhileDisabled(posContainerContainer, { display: "flex" });

  var posContainer = document.createElement("div");
  var pos = document.createElement("span");

  posContainerContainer.className = "pos-container-container";
  posContainer.className = "pos-container";

  posContainerContainer.appendChild(posContainer);
  posContainer.appendChild(pos);

  const vm = addon.tab.traps.vm;

  vm.runtime.ioDevices.mouse.__scratchX = vm.runtime.ioDevices.mouse._scratchX;
  vm.runtime.ioDevices.mouse.__scratchY = vm.runtime.ioDevices.mouse._scratchY;

  var x = vm.runtime.ioDevices.mouse.__scratchX ? vm.runtime.ioDevices.mouse.__scratchX : 0;
  var y = vm.runtime.ioDevices.mouse.__scratchY ? vm.runtime.ioDevices.mouse.__scratchY : 0;

  const showUpdatedValue = () => pos.setAttribute("data-content", `${x}, ${y}`);

  Object.defineProperty(vm.runtime.ioDevices.mouse, "_scratchX", {
    get: function () {
      return this.__scratchX;
    },
    set: function (setx) {
      x = setx;
      showUpdatedValue();
      this.__scratchX = setx;
    },
  });

  Object.defineProperty(vm.runtime.ioDevices.mouse, "_scratchY", {
    get: function () {
      return this.__scratchY;
    },
    set: function (sety) {
      y = sety;
      showUpdatedValue();
      this.__scratchY = sety;
    },
  });

  const updateStageSize = () => {
    if (!addon.tab.redux.state) return;
    const size = addon.tab.redux.state.scratchGui.stageSize.stageSize;
    const isFullScreen = addon.tab.redux.state.scratchGui.mode.isFullScreen;
    document.body.classList.toggle("sa-mouse-pos-small", size === "small" && !isFullScreen);
  };
  updateStageSize();
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (
      e.detail.action.type === "scratch-gui/StageSize/SET_STAGE_SIZE" ||
      e.detail.action.type === "scratch-gui/mode/SET_FULL_SCREEN"
    ) {
      updateStageSize();
    }
  });

  while (true) {
    await addon.tab.waitForElement('[class*="controls_controls-container"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });

    if (addon.tab.editorMode === "editor") {
      addon.tab.appendToSharedSpace({ space: "afterStopButton", element: posContainerContainer, order: 1 });
    }
  }
}
