/*
 * custom-fps
 *
 * Adds:
 *   set FPS to (60)
 *   change FPS by (10)
 *   FPS
 *
 * The FPS value controls the VM's stepping interval.
 */

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  if (!vm || !vm.runtime) {
    console.warn("custom-fps: VM/runtime unavailable.");
    return;
  }

  const runtime = vm.runtime;

  // Don't install twice.
  if (runtime.__customFpsAddon) {
    return;
  }

  const state = {
    fps: 30,
    timer: null,
    running: false,
    registered: false,
  };

  const clampFPS = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return state.fps;
    }

    return Math.max(0, Math.min(240, number));
  };

  /*
   * Stop only the timer created by this addon.
   * We deliberately do NOT modify Scratch's _steppingInterval.
   */
  const stopCustomTimer = () => {
    if (state.timer !== null) {
      clearInterval(state.timer);
      state.timer = null;
    }

    state.running = false;
  };

  const startCustomTimer = () => {
    if (addon.self.disabled) {
      return;
    }

    if (state.running) {
      return;
    }

    state.running = true;

    /*
     * FPS 0 = use Scratch's normal timing.
     * We don't replace Scratch's normal loop in this mode.
     */
    if (state.fps === 0) {
      state.running = false;
      return;
    }

    const interval = 1000 / state.fps;

    state.timer = setInterval(() => {
      if (addon.self.disabled) {
        stopCustomTimer();
        return;
      }

      try {
        runtime._step();
      } catch (error) {
        console.error("custom-fps: VM step failed.", error);
        stopCustomTimer();
      }
    }, interval);
  };

  const setFPS = (value) => {
    state.fps = clampFPS(value);

    /*
     * Only restart our timer if it is currently active.
     */
    if (state.running) {
      stopCustomTimer();
      startCustomTimer();
    }
  };

  runtime.__customFpsAddon = state;
  runtime.__customFpsSetFPS = setFPS;

  class CustomFPS {
    getInfo() {
      return {
        id: "customfps",
        name: "Custom FPS",

        color1: "#5C4B8A",
        color2: "#493B70",
        color3: "#3F315F",

        blocks: [
          {
            opcode: "setFPS",
            blockType: "command",
            text: "set FPS to [FPS]",
            arguments: {
              FPS: {
                type: "number",
                defaultValue: 60,
              },
            },
          },

          {
            opcode: "changeFPS",
            blockType: "command",
            text: "change FPS by [AMOUNT]",
            arguments: {
              AMOUNT: {
                type: "number",
                defaultValue: 10,
              },
            },
          },

          {
            opcode: "getFPS",
            blockType: "reporter",
            text: "FPS",
          },
        ],
      };
    }

    setFPS(args) {
      setFPS(args.FPS);
    }

    changeFPS(args) {
      const amount = Number(args.AMOUNT);

      if (Number.isFinite(amount)) {
        setFPS(state.fps + amount);
      }
    }

    getFPS() {
      return state.fps;
    }
  }

  try {
    const extensionManager = vm.extensionManager;

    if (!extensionManager) {
      throw new Error("Scratch VM extension manager not found.");
    }

    if (
      typeof extensionManager._registerInternalExtension !== "function"
    ) {
      throw new Error(
        "Scratch VM does not expose _registerInternalExtension."
      );
    }

    extensionManager._registerInternalExtension(new CustomFPS());

    state.registered = true;

    if (typeof extensionManager.refreshBlocks === "function") {
      await extensionManager.refreshBlocks();
    }

    console.info("custom-fps: Custom FPS blocks registered.");
  } catch (error) {
    console.error(
      "custom-fps: Failed to register Custom FPS extension.",
      error
    );

    delete runtime.__customFpsAddon;
    delete runtime.__customFpsSetFPS;

    return;
  }

  /*
   * Start our timer when Scratch starts the runtime.
   *
   * We save the original start function but DO NOT replace it.
   * This prevents Custom FPS from breaking Scratch Addons startup.
   */
  const originalStart = runtime.start;

  if (typeof originalStart === "function") {
    const originalStartWrapper = function (...args) {
      const result = originalStart.apply(this, args);

      if (!addon.self.disabled) {
        startCustomTimer();
      }

      return result;
    };

    /*
     * Only wrap once.
     */
    if (!runtime.__customFpsStartWrapped) {
      runtime.__customFpsStartWrapped = true;
      runtime.__customFpsOriginalStart = originalStart;
      runtime.start = originalStartWrapper;
    }
  }

  addon.self.addEventListener("disabled", () => {
    stopCustomTimer();
  });

  addon.self.addEventListener("reenabled", () => {
    /*
     * If Scratch is already running, restart our timer.
     */
    if (!addon.self.disabled) {
      startCustomTimer();
    }
  });

  console.info("custom-fps: Loaded successfully.");
}
