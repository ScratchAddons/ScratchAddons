import addSmallStageClass from "../../libraries/common/cs/small-stage.js";

export default async function ({ addon, console }) {
  var posContainerContainer = document.createElement("div");
  addon.tab.displayNoneWhileDisabled(posContainerContainer);

  var posContainer = document.createElement("div");
  var xPos = document.createElement("span");
  var yPos = document.createElement("span");

  posContainerContainer.className = "pos-container-container";
  posContainer.className = "pos-container";

  posContainerContainer.appendChild(posContainer);
  posContainer.appendChild(xPos);
  posContainer.appendChild(yPos);

  const vm = addon.tab.traps.vm;

  vm.runtime.ioDevices.mouse.__scratchX = vm.runtime.ioDevices.mouse._scratchX;
  vm.runtime.ioDevices.mouse.__scratchY = vm.runtime.ioDevices.mouse._scratchY;

  var x = vm.runtime.ioDevices.mouse.__scratchX ? vm.runtime.ioDevices.mouse.__scratchX : 0;
  var y = vm.runtime.ioDevices.mouse.__scratchY ? vm.runtime.ioDevices.mouse.__scratchY : 0;

  const showUpdatedValue = () => {
    xPos.setAttribute("data-content", `${x},`);
    yPos.setAttribute("data-content", `${y}`);
  };

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

  addSmallStageClass();

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
