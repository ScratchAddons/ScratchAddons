/*
 * custom-fps
 *
 * Cloudberry Pi Technology
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

  /*
   * Don't install twice.
   */
  if (runtime.__customFpsAddon) {
    return;
  }

  const state = {
    fps: 30,
    timer: null,
    running: false,
    registered: false
  };

  /*
   * Keep FPS between 0 and 240.
   */
  const clampFPS = value => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return state.fps;
    }

    return Math.max(0, Math.min(240, number));
  };

  /*
   * Stop only the timer created by this addon.
   */
  const stopCustomTimer = () => {
    if (state.timer !== null) {
      clearInterval(state.timer);
      state.timer = null;
    }

    state.running = false;
  };

  /*
   * Start the custom stepping timer.
   *
   * FPS 0 disables the custom timer and leaves Scratch's
   * normal timing system alone.
   */
  const startCustomTimer = () => {
    if (addon.self.disabled) {
      return;
    }

    if (state.running) {
      return;
    }

    /*
     * FPS 0 = normal Scratch timing.
     */
    if (state.fps === 0) {
      state.running = false;
      return;
    }

    const interval = 1000 / state.fps;

    state.running = true;

    state.timer = setInterval(() => {
      if (addon.self.disabled) {
        stopCustomTimer();
        return;
      }

      try {
        /*
         * Scratch VM's internal stepping function.
         */
        runtime._step();
      } catch (error) {
        console.error("custom-fps: VM step failed.", error);
        stopCustomTimer();
      }
    }, interval);
  };

  /*
   * Change the FPS value.
   */
  const setFPS = value => {
    state.fps = clampFPS(value);

    /*
     * Restart our timer if it is already running.
     */
    if (state.running) {
      stopCustomTimer();
      startCustomTimer();
    }
  };

  /*
   * Store addon state on the runtime.
   */
  runtime.__customFpsAddon = state;
  runtime.__customFpsSetFPS = setFPS;

  /*
   * Custom FPS Scratch extension.
   */
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
                defaultValue: 60
              }
            }
          },

          {
            opcode: "changeFPS",
            blockType: "command",
            text: "change FPS by [AMOUNT]",
            arguments: {
              AMOUNT: {
                type: "number",
                defaultValue: 10
              }
            }
          },

          {
            opcode: "getFPS",
            blockType: "reporter",
            text: "FPS"
          }
        ]
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

  /*
   * Register the extension with Scratch.
   */
  try {
    const extensionManager = vm.extensionManager;

    if (!extensionManager) {
      throw new Error(
        "Scratch VM extension manager not found."
      );
    }

    if (
      typeof extensionManager._registerInternalExtension !==
      "function"
    ) {
      throw new Error(
        "Scratch VM does not expose _registerInternalExtension."
      );
    }

    if (!extensionManager._loadedExtensions) {
      throw new Error(
        "Scratch VM does not expose _loadedExtensions."
      );
    }

    /*
     * Do not register twice.
     */
    if (
      typeof extensionManager.isExtensionLoaded === "function" &&
      extensionManager.isExtensionLoaded("customfps")
    ) {
      state.registered = true;

      if (
        typeof extensionManager.refreshBlocks === "function"
      ) {
        await extensionManager.refreshBlocks();
      }

      console.info(
        "custom-fps: Custom FPS extension was already registered."
      );
    } else {
      /*
       * Create the extension object.
       */
      const extensionInstance = new CustomFPS();

      /*
       * Register the internal extension.
       *
       * IMPORTANT:
       * _registerInternalExtension returns the service name.
       */
      const serviceName =
        extensionManager._registerInternalExtension(
          extensionInstance
        );

      /*
       * IMPORTANT FIX:
       * Add the extension ID and service name to the loaded
       * extension map. Scratch's refreshBlocks() uses this map.
       */
      extensionManager._loadedExtensions.set(
        extensionInstance.getInfo().id,
        serviceName
      );

      state.registered = true;

      /*
       * Refresh the Scratch toolbox/block information.
       */
      if (
        typeof extensionManager.refreshBlocks === "function"
      ) {
        await extensionManager.refreshBlocks();
      }

      console.info(
        "custom-fps: Custom FPS blocks registered."
      );
    }
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
   * Start our timer when Scratch starts.
   */
  const originalStart = runtime.start;

  if (typeof originalStart === "function") {
    /*
     * Only wrap runtime.start once.
     */
    if (!runtime.__customFpsStartWrapped) {
      runtime.__customFpsStartWrapped = true;
      runtime.__customFpsOriginalStart = originalStart;

      runtime.start = function (...args) {
        const result = originalStart.apply(this, args);

        if (!addon.self.disabled) {
          startCustomTimer();
        }

        return result;
      };
    }
  }

  /*
   * Stop the custom timer when the addon is disabled.
   */
  addon.self.addEventListener("disabled", () => {
    stopCustomTimer();
  });

  /*
   * Restart the timer when the addon is re-enabled.
   */
  addon.self.addEventListener("reenabled", () => {
    if (!addon.self.disabled) {
      startCustomTimer();
    }
  });

  /*
   * If Scratch is already running when the addon loads,
   * start the timer immediately.
   */
  if (
    runtime.paused === false &&
    typeof runtime._step === "function"
  ) {
    startCustomTimer();
  }

  console.info(
    "custom-fps: Loaded successfully."
  );
}
