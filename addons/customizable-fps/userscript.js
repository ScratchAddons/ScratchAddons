/*
 * custom-fps
 *
 * Cloudberry Pi Technology
 *
 * Runs the VM at a controlled 120 Hz simulation rate.
 */

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  if (!vm || !vm.runtime) {
    console.warn('custom-fps: VM/runtime unavailable.');
    return;
  }

  const runtime = vm.runtime;

  // Prevent the addon from being installed more than once.
  if (runtime.__customFpsAddon) {
    return;
  }

  const FPS = 120;
  const STEP = 1000 / FPS;

  const state = {
    fps: FPS,
    timer: null,
    running: false,
    lastTime: 0,
    accumulator: 0,
  };

  /*
   * Stop the timer created by this addon.
   */
  const stopCustomTimer = () => {
    if (state.timer !== null) {
      clearTimeout(state.timer);
      state.timer = null;
    }

    state.running = false;
    state.lastTime = 0;
    state.accumulator = 0;
  };

  /*
   * Schedule the next VM step.
   *
   * setTimeout is only used to wake the loop. The actual timing
   * is calculated using performance.now(), which prevents timer
   * jitter from directly changing the simulation rate.
   */
  const scheduleNextStep = () => {
    if (!state.running || addon.self.disabled) {
      return;
    }

    const now = performance.now();
    const elapsed = now - state.lastTime;

    state.lastTime = now;

    /*
     * Prevent a large backlog after the browser has been
     * suspended, throttled, or otherwise delayed.
     */
    state.accumulator += Math.min(elapsed, 100);

    /*
     * Run the VM according to elapsed real time.
     *
     * If the timer fires slightly early, no step is performed.
     * If it fires slightly late, the accumulated time is used
     * to compensate.
     */
    while (state.accumulator >= STEP) {
      try {
        runtime._step();
      } catch (error) {
        console.error('custom-fps: VM step failed.', error);
        stopCustomTimer();
        return;
      }

      state.accumulator -= STEP;
    }

    /*
     * Calculate how long until the next 120 Hz step is due.
     */
    const delay = Math.max(0, STEP - state.accumulator);

    state.timer = setTimeout(scheduleNextStep, delay);
  };

  /*
   * Start the custom 120 Hz VM clock.
   */
  const startCustomTimer = () => {
    if (addon.self.disabled || state.running) {
      return;
    }

    if (typeof runtime._step !== 'function') {
      console.warn('custom-fps: VM _step() is unavailable.');
      return;
    }

    state.running = true;
    state.lastTime = performance.now();
    state.accumulator = 0;

    state.timer = setTimeout(scheduleNextStep, STEP);
  };

  /*
   * Store addon state on the runtime.
   */
  runtime.__customFpsAddon = state;

  /*
   * Hook runtime.start() so the custom clock starts when
   * Scratch starts running.
   */
  const originalStart = runtime.start;

  if (
    typeof originalStart === 'function' &&
    !runtime.__customFpsStartWrapped
  ) {
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

  /*
   * Stop the custom clock when the addon is disabled.
   */
  addon.self.addEventListener('disabled', () => {
    stopCustomTimer();
  });

  /*
   * Restart the custom clock when the addon is re-enabled.
   */
  addon.self.addEventListener('reenabled', () => {
    if (!addon.self.disabled) {
      startCustomTimer();
    }
  });

  /*
   * If Scratch is already running when the addon loads,
   * start the custom clock immediately.
   */
  if (
    runtime.paused === false &&
    typeof runtime._step === 'function'
  ) {
    startCustomTimer();
  }

  console.info(`custom-fps: Loaded successfully at ${FPS} FPS.`);
}
