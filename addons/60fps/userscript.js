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

    if (runtime._steppingInterval) {
      clearInterval(runtime._steppingInterval);
      runtime._steppingInterval = null;
      runtime.start();
    }
  };

  // 実行ループのモンキーパッチ
  runtime.start = function () {
    if (this._steppingInterval) return;
    const interval = 1000 / global_fps;
    this.currentStepTime = interval;
    this._steppingInterval = setInterval(() => this._step(), interval);
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

    const originalListener = vm.listeners("MONITORS_UPDATE")
      .find((f) => f.name === "onMonitorsUpdate");

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

    document
      .querySelectorAll("[class*='green-flag_green-flag_']")
      .forEach(updateFlagVisuals);
  };

  // --- 2. ライフサイクル管理 ---
  addon.settings.addEventListener("change", () => {
    if (mode) setFPS(addon.settings.get("framerate"));
  });

  addon.self.addEventListener("disabled", () => {
    changeMode(false);
    runtime.start = originalStart;

    // イベントリスナーの重複防止
    document
      .querySelectorAll("[class*='green-flag_green-flag_']")
      .forEach((btn) => {
        btn.replaceWith(btn.cloneNode(true));
      });
  });

  // --- 3. DOM監視ループ ---
  while (true) {
    const button = await addon.tab.waitForElement(
      "[class*='green-flag_green-flag_']",
      {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
        ],
      }
    );

    updateFlagVisuals(button);

    const flagListener = (e) => {
      if (addon.self.disabled) return;

      const isAltClick =
        e.altKey && (e.type === "click" || e.type === "contextmenu");
      const isChromebookAlt =
        navigator.userAgent.includes("CrOS") && e.type === "contextmenu";

      if (isAltClick || isChromebookAlt) {
        e.stopPropagation();
        e.preventDefault();
        changeMode();
      }
    };

    // 重複防止のため一度クローンしてから付け直す
    const cleanButton = button.cloneNode(true);
    button.replaceWith(cleanButton);

    cleanButton.addEventListener("click", flagListener, { capture: true });
    cleanButton.addEventListener("contextmenu", flagListener, { capture: true });
  }
}
