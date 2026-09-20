/*
 * custom-fps
 *
 * Cloudberry Pi Technology
 *
 * Automatically sets the VM stepping interval to 120 FPS.
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

  const FPS = 120;
  const interval = 1000 / FPS;

  const state = {
    fps: FPS,
    timer: null,
    running: false,
  };

  // Stop only the timer created by this addon.
  const stopCustomTimer = () => {
    if (state.timer !== null) {
      clearInterval(state.timer);
      state.timer = null;
    }

    state.running = false;
  };

  /*
   * Start the 120 FPS timer.
   */
  const startCustomTimer = () => {
    if (addon.self.disabled || state.running) {
      return;
    }

    if (typeof runtime._step !== "function") {
      console.warn("custom-fps: VM _step() is unavailable.");
      return;
    }

    state.running = true;

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

  /*
   * Store addon state on the runtime.
   */
  runtime.__customFpsAddon = state;

  /*
   * Start our timer when Scratch starts.
   */
  const originalStart = runtime.start;

  if (typeof originalStart === "function") {
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

  console.info(`custom-fps: Loaded successfully at ${FPS} FPS.`);
}
