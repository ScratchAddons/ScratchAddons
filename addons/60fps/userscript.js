export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const runtime = vm.runtime;

  let mode = false;
  let monitorUpdateFixed = false;
  let global_fps = 30;

  const fastFlag = addon.self.dir + "/svg/fast-flag.svg";
  let vanillaFlag = null;

  // --- 1. VMの挙動をカスタマイズ ---
  const originalStart = runtime.start;

  const setFPS = (fps) => {
    global_fps = addon.self.disabled ? 30 : fps;
    
    // すでに動いている場合は再起動してインターバルを更新
    if (runtime._steppingInterval) {
      clearInterval(runtime._steppingInterval);
      runtime._steppingInterval = null;
      runtime.start();
    }
  };

  // 実行ループのモンキーパッチ
  runtime.start = function () {
    if (this._steppingInterval) return;
    let interval = 1000 / global_fps;
    this.currentStepTime = interval;
    this._steppingInterval = setInterval(() => {
      this._step();
    }, interval);
    this.emit("RUNTIME_STARTED");
  };

  const updateFlagVisuals = (button) => {
    if (!button) return;
    if (!vanillaFlag) vanillaFlag = button.src;
    button.src = mode ? fastFlag : vanillaFlag;
    if (mode) button.setAttribute("data-sa-60fps", "true");
    else button.removeAttribute("data-sa-60fps");
  };

  const fixMonitorThrottling = () => {
    if (monitorUpdateFixed) return;
    const originalListener = vm.listeners("MONITORS_UPDATE").find((f) => f.name === "onMonitorsUpdate");
    if (originalListener) {
      vm.removeListener("MONITORS_UPDATE", originalListener);
      vm.on("MONITORS_UPDATE", (monitors) =>
        addon.tab.redux.dispatch({
          type: "scratch-gui/monitors/UPDATE_MONITORS",
          monitors,
        })
      );
      monitorUpdateFixed = true;
    }
  };

  const changeMode = (newMode = !mode) => {
    mode = newMode;
    if (mode) {
      setFPS(addon.settings.get("framerate"));
      fixMonitorThrottling();
    } else {
      setFPS(30);
    }
    const buttons = document.querySelectorAll("[class*='green-flag_green-flag_']");
    buttons.forEach(updateFlagVisuals);
  };

  // --- 2. ライフサイクル管理 ---
  addon.settings.addEventListener("change", () => {
    if (mode) setFPS(addon.settings.get("framerate"));
  });

  addon.self.addEventListener("disabled", () => {
    changeMode(false);
    // アドオン無効化時は元のstart関数に戻す
    runtime.start = originalStart;
  });

  // --- 3. DOM監視ループ ---
  while (true) {
    const button = await addon.tab.waitForElement("[class*='green-flag_green-flag_']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });

    updateFlagVisuals(button);

    const flagListener = (e) => {
      if (addon.self.disabled) return;
      
      const isAltClick = e.altKey && (e.type === "click" || e.type === "contextmenu");
      const isChromebookAlt = navigator.userAgent.includes("CrOS") && e.type === "contextmenu";

      if (isAltClick || isChromebookAlt) {
        e.stopPropagation();
        e.preventDefault();
        changeMode();
      }
    };

    button.addEventListener("click", flagListener, { capture: true });
    button.addEventListener("contextmenu", flagListener, { capture: true });
  }
}
