export default async function ({ addon, global, console }) {
  // TODO: test whether e.altKey is true in chromebooks when alt+clicking.
  // If so, no timeout needed, similar to mute-project addon.

  let global_fps = 30;
  const vm = addon.tab.traps.vm;
  let altPressesCount = 0;
  let altPressedRecently = false;
  window.addEventListener("keydown", (event) => {
    if (event.key === "Alt") {
      altPressesCount++;
      const pressCount = altPressesCount;
      altPressedRecently = true;
      setTimeout(() => {
        if (pressCount === altPressesCount) altPressedRecently = false;
      }, 250);
    }
  });
  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", { markAsSeen: true });
    let mode = false;
    const changeMode = (_mode = !mode) => {
      mode = _mode;
      if (mode) setFPS(addon.settings.get("framerate"));
      else setFPS(30);
      button.style.filter = mode ? "hue-rotate(90deg)" : "";
    };
    const flagListener = (e) => {
      if (altPressedRecently && !addon.self.disabled) {
        e.cancelBubble = true;
        e.preventDefault();
        changeMode();
      }
    };
    button.addEventListener("click", (e) => flagListener(e));
    button.addEventListener("contextmenu", (e) => flagListener(e));

    const setFPS = (fps) => {
      global_fps = addon.self.disabled ? 30 : fps;

      clearInterval(vm.runtime._steppingInterval);
      vm.runtime._steppingInterval = null;
      vm.runtime.start();
    };
    addon.settings.addEventListener("change", () => {
      if (vm.runtime._steppingInterval) {
        setFPS(addon.settings.get("framerate"));
      }
    });
    addon.self.addEventListener("disabled", () => changeMode(false));
    vm.runtime.start = function () {
      if (this._steppingInterval) return;
      let interval = 1000 / global_fps;
      this.currentStepTime = interval;
      this._steppingInterval = setInterval(() => {
        this._step();
      }, interval);
      this.emit("RUNTIME_STARTED");
    };
  }
}
