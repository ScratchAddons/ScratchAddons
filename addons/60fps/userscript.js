export default async function ({ addon, console }) {
  // TODO: test whether e.altKey is true in chromebooks when alt+clicking.
  // If so, no timeout needed, similar to mute-project addon.

  let global_fps = 30;
  const vm = addon.tab.traps.vm;
  let mode = false;
  let monitorUpdateFixed = false;

  const fastFlag = addon.self.dir + "/svg/fast-flag.svg";
  let vanillaFlag = null;

  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });

    const updateFlag = () => {
      if (!vanillaFlag) vanillaFlag = button.src;
      button.src = mode ? fastFlag : vanillaFlag;
    };

    const changeMode = (_mode = !mode) => {
      mode = _mode;
      if (mode) {
        setFPS(addon.settings.get("framerate"));

        // monitor updates are throttled by default
        // https://github.com/scratchfoundation/scratch-gui/blob/ba76db7/src/reducers/monitors.js
        if (!monitorUpdateFixed) {
          const originalListener = vm.listeners("MONITORS_UPDATE").find((f) => f.name === "onMonitorsUpdate");
          if (originalListener) vm.removeListener("MONITORS_UPDATE", originalListener);
          vm.on("MONITORS_UPDATE", (monitors) =>
            addon.tab.redux.dispatch({
              type: "scratch-gui/monitors/UPDATE_MONITORS",
              monitors,
            })
          );
          monitorUpdateFixed = true;
        }
      } else setFPS(30);
      updateFlag();
    };
    const flagListener = (e) => {
      if (addon.self.disabled) return;
      const isAltClick = e.type === "click" && e.altKey;
      const isChromebookAltClick = navigator.userAgent.includes("CrOS") && e.type === "contextmenu";
      if (isAltClick || isChromebookAltClick) {
        e.cancelBubble = true;
        e.preventDefault();
        changeMode();
      }
    };
    button.addEventListener("click", flagListener);
    button.addEventListener("contextmenu", flagListener);

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
    updateFlag();
  }
}
