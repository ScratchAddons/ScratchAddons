export default async function ({ addon, global, console }) {
  console.log("mouse pos enabled");

  const vm = addon.tab.traps.onceValues.vm;

  while (true) {
    let bar = await addon.tab.waitForElement(".controls_controls-container_2xinB", { markAsSeen: true });

    if (addon.tab.editorMode === "editor") {
      // my attempt at detecting if they're in the editor?
      var posContainerContainer = document.createElement("div");
      var posContainer = document.createElement("div");
      var pos = document.createElement("span");

      posContainerContainer.className = "pos-container-container";
      posContainer.className = "pos-container";

      posContainerContainer.appendChild(posContainer);
      posContainer.appendChild(pos);

      bar.appendChild(posContainerContainer);

      vm.runtime.ioDevices.mouse.__scratchX = vm.runtime.ioDevices.mouse._scratchX;
      vm.runtime.ioDevices.mouse.__scratchY = vm.runtime.ioDevices.mouse._scratchY;

      var x = vm.runtime.ioDevices.mouse.__scratchX ? vm.runtime.ioDevices.mouse.__scratchX : 0;
      var y = vm.runtime.ioDevices.mouse.__scratchY ? vm.runtime.ioDevices.mouse.__scratchY : 0;

      pos.innerText = `${x}, ${y}`;

      Object.defineProperty(vm.runtime.ioDevices.mouse, "_scratchX", {
        get: function () {
          return this.__scratchX;
        },
        set: function (setx) {
          x = setx;
          return (this.__scratchX = setx);
        },
      });

      Object.defineProperty(vm.runtime.ioDevices.mouse, "_scratchY", {
        get: function () {
          return this.__scratchY;
        },
        set: function (sety) {
          y = sety;
          pos.innerText = `${x}, ${y}`;
          return (this.__scratchY = sety);
        },
      });
    }
  }
}
