export default async function ({ addon, global, console }) {
  let gloabal_fps = 30;
  const vm = addon.tab.traps.onceValues.vm;
  let altPressesCount = 0;
  let altPressedRecently = false;
  window.addEventListener("keydown", (event) => {
    if (event.key === "Alt") {
      altPressesCount++;
      const pressCount = altPressesCount;
      altPressedRecently = true;
      setTimeout(() => {
        if (pressCount === altPressesCount) altPressedRecently = false;
      }, 2500);
    }
  });
  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", { markAsSeen: true });
    let mode = false;
    const flagListener = (e) => {
      if (altPressedRecently) {
        e.preventDefault();
        mode = !mode;
        if (mode) setFPS(addon.settings.get("framerate"));
        else setFPS(30);
        button.style.filter = mode ? "hue-rotate(90deg)" : "";
      }
    }
    button.addEventListener("click", (e) => flagListener(e));
    button.addEventListener("contextmenu", (e) => flagListener(e));

    const setFPS = (fps) => {
      gloabal_fps = fps;
      clearInterval(vm.runtime._steppingInterval);
      vm.runtime._steppingInterval = null;
      vm.runtime.start();
    };
    const checkFPS = (fps) => {
      let valid = 30;
      // if framerate is a number and is not negitive or 0
      if (Number(fps) == Number(fps) && fps > 0) {
        if (vm.runtime.compatibilityMode) valid = 1000 / fps;
      }
      return valid;
    };
    addon.settings.addEventListener("change", function () {
      if (vm.runtime._steppingInterval) {
        setFPS(addon.settings.get("framerate"));
      }
    });
    vm.runtime.start = function () {
      if (this._steppingInterval) return;
      let interval = checkFPS(gloabal_fps);
      this.currentStepTime = interval;
      this._steppingInterval = setInterval(() => {
        this._step();
      }, interval);
      this.emit("RUNTIME_STARTED");
    };
  }
}
