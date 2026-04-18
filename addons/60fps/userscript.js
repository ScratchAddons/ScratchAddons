export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const runtime = vm.runtime;

  let mode = false;
  let monitorUpdateFixed = false;
  let global_fps = 30;

  const fastFlag = addon.self.dir + "/svg/fast-flag.svg";
  let vanillaFlag = null;

  // --- 1. VMの挙動をカスタマイズ (モンキーパッチ) ---
  const originalStart = runtime.start;

  const setFPS = (fps) => {
    // アドオン無効時は強制的に30、有効時は設定値 or 30
    global_fps = addon.self.disabled ? 30 : fps;
    
    if (runtime._steppingInterval) {
      clearInterval(runtime._steppingInterval);
      runtime._steppingInterval = null;
      runtime.start();
    }
  };

  // 実行ループを書き換え
  runtime.start = function () {
    if (this._steppingInterval) return;
    let interval = 1000 / global_fps;
    this.currentStepTime = interval;
    this._steppingInterval = setInterval(() => {
      this._step();
    }, interval);
    this.emit("RUNTIME_STARTED");
  };

  // --- 2. モニターの更新制限を解除 ---
  const fixMonitorThrottling = () => {
    if (monitorUpdateFixed) return;
    // Scratch標準の低速モニター更新リスナーを探して差し替える
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

  // --- 3. モード切替ロジック ---
  const updateFlagVisuals = (button) => {
    if (!button) return;
    if (!vanillaFlag) vanillaFlag = button.src;
    
    button.src = mode ? fastFlag : vanillaFlag;
    if (mode) {
      button.setAttribute("data-sa-60fps", "true");
    } else {
      button.removeAttribute("data-sa-60fps");
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
    // 表示されている全ての緑の旗を更新
    const buttons = document.querySelectorAll("[class*='green-flag_green-flag_']");
    buttons.forEach(updateFlagVisuals);
  };

  // --- 4. イベント監視と後処理 ---
  addon.settings.addEventListener("change", () => {
    if (mode) setFPS(addon.settings.get("framerate"));
  });

  addon.self.addEventListener("disabled", () => {
    changeMode(false);
  });

  // --- 5. DOMの監視 (旗が生成されるたびに実行) ---
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

    // キャプチャフェーズでイベントを奪い取る
    button.addEventListener("click", flagListener, { capture: true });
    button.addEventListener("contextmenu", flagListener, { capture: true });
  }
}
