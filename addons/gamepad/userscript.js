import GamepadLib from "./gamepadlib.js";

export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  const virtualCursorContainer = document.createElement("div");
  virtualCursorContainer.hidden = true;
  const virtualCursorImageContainer = document.createElement("div");
  virtualCursorImageContainer.className = "sa-gamepad-cursor-container";
  const virtualCursorImage = document.createElement("img");
  virtualCursorImage.className = "sa-gamepad-cursor-image";
  virtualCursorImage.src = addon.self.dir + "/inactive.png";
  virtualCursorImageContainer.appendChild(virtualCursorImage);
  virtualCursorContainer.appendChild(virtualCursorImageContainer);

  const virtualCursorSetVisible = (visible) => {
    virtualCursorContainer.hidden = !visible;
  };
  const virtualCursorSetDown = (down) => {
    virtualCursorSetVisible(true);
    if (down) {
      virtualCursorImage.src = addon.self.dir + "/active.png";
    } else {
      virtualCursorImage.src = addon.self.dir + "/inactive.png";
    }
  };
  const virtualCursorSetPosition = (x, y) => {
    virtualCursorSetVisible(true);
    const stageX = 240 + x;
    const stageY = 180 - y;
    virtualCursorImageContainer.style.transform = `translate(${stageX}px, ${stageY}px)`;
  };

  document.addEventListener("mousemove", () => {
    virtualCursorSetVisible(false);
  });

  const handleGamepadButtonDown = (e) => {
    const key = e.detail;
    vm.postIOData("keyboard", {
      key: key,
      isDown: true,
    });
  };
  const handleGamepadButtonUp = (e) => {
    const key = e.detail;
    vm.postIOData("keyboard", {
      key: key,
      isDown: false,
    });
  };
  const handleGamepadMouseDown = () => {
    virtualCursorSetDown(true);
    vm.postIOData("mouse", {
      isDown: true,
      canvasWidth: 480,
      x: vm.runtime.ioDevices.mouse._clientX,
      canvasHeight: 360,
      y: vm.runtime.ioDevices.mouse._clientY,
    });
  };
  const handleGamepadMouseUp = () => {
    virtualCursorSetDown(false);
    vm.postIOData("mouse", {
      isDown: false,
    });
  };
  const handleGamepadMouseMove = (e) => {
    const { x, y } = e.detail;
    virtualCursorSetPosition(x, y);
    vm.postIOData("mouse", {
      canvasWidth: 480,
      x: x + 240,
      canvasHeight: 380,
      y: 180 - y,
    });
  };

  const gamepad = new GamepadLib();
  gamepad.virtualCursor.maxX = 240;
  gamepad.virtualCursor.minX = -240;
  gamepad.virtualCursor.maxY = 180;
  gamepad.virtualCursor.minY = -180;
  gamepad.addEventListener("keydown", handleGamepadButtonDown);
  gamepad.addEventListener("keyup", handleGamepadButtonUp);
  gamepad.addEventListener("mousedown", handleGamepadMouseDown);
  gamepad.addEventListener("mouseup", handleGamepadMouseUp);
  gamepad.addEventListener("mousemove", handleGamepadMouseMove);

  const stageClass = addon.tab.scratchClass("stage_stage");
  while (true) {
    const stage = await addon.tab.waitForElement(`.${stageClass}`, {
      markAsSeen: true,
    });
    stage.appendChild(virtualCursorContainer);
  }
}
