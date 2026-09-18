/*
 * custom-fps
 *
 * Scratch Addons userscript which registers an unsandboxed VM extension.
 * The extension exposes:
 *   set FPS to (60)
 *   change FPS by (10)
 *   FPS
 *
 * It changes Runtime.start so the VM's actual stepping/rendering loop runs
 * at the selected rate. This follows the same Runtime internals used by
 * Scratch Addons' existing higher-project-framerate addon.
 */

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  if (!vm || !vm.runtime) {
    console.warn("custom-fps: Scratch VM/runtime not available.");
    return;
  }

  const runtime = vm.runtime;

  // The extension category is registered only once per VM. The userscript
  // may be re-enabled dynamically without rebuilding the VM.
  if (runtime.__customFpsAddon) {
    return;
  }

  const state = {
    fps: 30,
    runtime,
    raf: null,
    registered: false,
  };

  const clampFPS = (value) => {
    value = Number(value);
    if (!Number.isFinite(value)) return state.fps;

    // 0 means "display synchronized" in this addon.
    // Positive values are limited to a practical browser/VM range.
    return Math.max(0, Math.min(240, value));
  };

  const stopTimer = () => {
    if (runtime._steppingInterval !== null) {
      clearInterval(runtime._steppingInterval);
      runtime._steppingInterval = null;
    }

    if (state.raf !== null) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }
  };

  const startCustomTimer = () => {
    // If this addon is disabled, pass control to the function that was
    // installed before us. This lets the addon be dynamically disabled
    // without breaking another framerate addon.
    if (addon.self.disabled) {
      return runtime.__customFpsOriginalStart.call(runtime);
    }

    if (runtime._steppingInterval) return;

    const interval = state.fps === 0 ? 0 : 1000 / state.fps;
    runtime.currentStepTime = interval;

    if (state.fps === 0) {
      // Display-synchronized mode.
      const tick = () => {
        if (addon.self.disabled) {
          state.raf = null;
          runtime._steppingInterval = null;
          return;
        }

        runtime._step();
        state.raf = requestAnimationFrame(tick);
        // Keep the runtime's normal "started" flag truthy.
        runtime._steppingInterval = state.raf || "custom-fps-raf";
      };

      state.raf = requestAnimationFrame(tick);
      runtime._steppingInterval = state.raf || "custom-fps-raf";
    } else {
      runtime._steppingInterval = setInterval(() => {
        runtime._step();
      }, interval);
    }

    runtime.emit("RUNTIME_STARTED");
  };

  // Keep the original start method in case another addon needs it.
  if (!runtime.__customFpsOriginalStart) {
    runtime.__customFpsOriginalStart = runtime.start;
  }

  runtime.__customFpsAddon = state;

  runtime.__customFpsSetFPS = (fps) => {
    state.fps = clampFPS(fps);

    const wasRunning = Boolean(runtime._steppingInterval) || state.raf !== null;

    if (wasRunning) {
      stopTimer();
      startCustomTimer();
    }
  };

  runtime.start = function () {
    startCustomTimer();
  };

  class CustomFPS {
    constructor(vmRuntime) {
      this.runtime = vmRuntime;
    }

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
      runtime.__customFpsSetFPS(args.FPS);
    }

    changeFPS(args) {
      runtime.__customFpsSetFPS(state.fps + Number(args.AMOUNT || 0));
    }

    getFPS() {
      return state.fps;
    }
  }

  try {
    const extensionManager = vm.extensionManager;

    if (!extensionManager) {
      throw new Error("Scratch VM extension manager was not found.");
    }

    /*
     * Scratch VM's internal extension manager has a private
     * _registerInternalExtension method. Scratch Addons userscripts run
     * in Scratch's main world, so it is available to this addon.
     */
    if (!extensionManager._registerInternalExtension) {
      throw new Error(
        "This Scratch VM version does not expose _registerInternalExtension."
      );
    }

    extensionManager._registerInternalExtension(new CustomFPS(runtime));

    state.registered = true;

    // Ask Scratch's toolbox to rebuild so the new category appears.
    if (typeof runtime.requestToolboxExtensionsUpdate === "function") {
      runtime.requestToolboxExtensionsUpdate();
    }

    console.info("custom-fps: Custom FPS blocks registered.");
  } catch (error) {
    console.error("custom-fps: Failed to register Custom FPS extension.", error);
    return;
  }

  // Keep the wrapper installed. Scratch Addons recommends not restoring a
  // polluted VM method because another addon may have wrapped it after us.
  // While disabled, our wrapper delegates to the previous implementation.
  addon.self.addEventListener("disabled", () => {
    const wasRunning = Boolean(runtime._steppingInterval) || state.raf !== null;

    stopTimer();

    if (wasRunning && runtime.__customFpsOriginalStart) {
      runtime.__customFpsOriginalStart.call(runtime);
    }
  });

  addon.self.addEventListener("reenabled", () => {
    // The next project start will use custom FPS. If the project is already
    // running, restart its timer immediately.
    if (runtime._steppingInterval) {
      stopTimer();
      startCustomTimer();
    }
  });
}
