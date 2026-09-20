/*
 * custom-fps
 *
 * Cloudberry Pi Technology
 *
 * Runs the Scratch VM at a controlled 120 Hz simulation rate.
 */

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  if (!vm || !vm.runtime) {
    console.warn("custom-fps: VM/runtime unavailable.");
    return;
  }

  const runtime = vm.runtime;

  /*
   * Do not install this addon more than once.
   */
  if (runtime.__customFpsAddon) {
    console.info("custom-fps: Already installed.");
    return;
  }

  const FPS = 120;
  const STEP = 1000 / FPS;

  /*
   * State owned by this addon.
   */
  const state = {
    fps: FPS,
    step: STEP,

    /*
     * The timeout used by the custom clock.
     */
    timer: null,

    /*
     * Whether our clock is currently active.
     */
    running: false,

    /*
     * Absolute deadline for the next VM step.
     */
    nextTick: 0,

    /*
     * Whether Scratch's runtime was running when the addon
     * was disabled.
     */
    wasRunningBeforeDisable: false,

    /*
     * Used to prevent an old timeout callback from starting
     * another timer after the clock has been stopped.
     */
    generation: 0
  };

  /*
   * ----------------------------------------------------------
   * Utility: clear our timer
   * ----------------------------------------------------------
   */
  const clearCustomTimer = () => {
    if (state.timer !== null) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  };

  /*
   * ----------------------------------------------------------
   * Stop the custom 120 Hz clock
   * ----------------------------------------------------------
   */
  const stopCustomTimer = () => {
    state.generation++;

    clearCustomTimer();

    state.running = false;
    state.nextTick = 0;
  };

  /*
   * ----------------------------------------------------------
   * Schedule exactly one future VM step.
   * ----------------------------------------------------------
   *
   * We use an absolute deadline rather than:
   *
   *   setTimeout(..., STEP)
   *
   * repeatedly.
   *
   * This prevents timer drift from accumulating over time.
   */
  const scheduleNextStep = generation => {
    if (
      !state.running ||
      addon.self.disabled ||
      generation !== state.generation
    ) {
      return;
    }

    const now = performance.now();

    let delay = state.nextTick - now;

    /*
     * Never schedule a negative delay.
     */
    if (delay < 0) {
      delay = 0;
    }

    state.timer = setTimeout(() => {
      runStep(generation);
    }, delay);

    /*
     * Scratch expects _steppingInterval to contain a non-null
     * value while its runtime is running.
     *
     * We put our active timeout here so another call to
     * runtime.start() will not create a second VM clock.
     */
    runtime._steppingInterval = state.timer;
  };

  /*
   * ----------------------------------------------------------
   * Execute exactly ONE VM step.
   * ----------------------------------------------------------
   */
  const runStep = generation => {
    /*
     * Ignore callbacks from an old timer.
     */
    if (
      generation !== state.generation ||
      !state.running ||
      addon.self.disabled
    ) {
      return;
    }

    /*
     * The timeout has already fired, so clear our reference.
     */
    state.timer = null;

    /*
     * Keep Scratch's running marker alive.
     *
     * A non-null value prevents runtime.start() from creating
     * another native 60 Hz interval.
     */
    runtime._steppingInterval = 1;

    try {
      /*
       * ONE and ONLY ONE VM step per callback.
       *
       * This is the most important part of the fix.
       *
       * We intentionally do NOT do:
       *
       *   while (accumulator >= STEP) _step();
       *
       * because catch-up bursts can produce apparent FPS values
       * such as 180, 200, 300, etc.
       */
      runtime._step();
    } catch (error) {
      console.error(
        "custom-fps: VM step failed.",
        error
      );

      stopCustomTimer();

      runtime._steppingInterval = null;
      return;
    }

    /*
     * Advance the absolute schedule by exactly one 120 Hz step.
     */
    state.nextTick += STEP;

    const now = performance.now();

    /*
     * If the browser was suspended or heavily throttled,
     * discard the old backlog instead of rapidly executing
     * many VM steps.
     *
     * At most 4 frame intervals of lateness are tolerated.
     */
    if (state.nextTick < now - STEP * 4) {
      state.nextTick = now + STEP;
    }

    /*
     * Schedule exactly one more step.
     */
    scheduleNextStep(generation);
  };

  /*
   * ----------------------------------------------------------
   * Start the custom 120 Hz clock.
   * ----------------------------------------------------------
   */
  const startCustomTimer = () => {
    if (addon.self.disabled) {
      return;
    }

    if (state.running) {
      return;
    }

    if (typeof runtime._step !== "function") {
      console.warn(
        "custom-fps: runtime._step() is unavailable."
      );
      return;
    }

    /*
     * Scratch normally puts its native 60 Hz setInterval()
     * inside _steppingInterval.
     *
     * Remove it before starting our own clock.
     */
    if (runtime._steppingInterval !== null) {
      try {
        clearInterval(runtime._steppingInterval);
      } catch (error) {
        console.debug(
          "custom-fps: Could not clear native stepping timer.",
          error
        );
      }

      runtime._steppingInterval = null;
    }

    /*
     * Mark this clock as active.
     */
    state.running = true;
    state.generation++;

    const generation = state.generation;

    /*
     * Reset the schedule from the current time.
     *
     * This is especially important after:
     *
     *   pause → resume
     *   addon disable → enable
     *   browser throttling
     */
    state.nextTick = performance.now() + STEP;

    /*
     * Tell the Scratch sequencer that one logical VM step is
     * 8.333... ms long.
     */
    runtime.currentStepTime = STEP;

    scheduleNextStep(generation);
  };

  /*
   * ----------------------------------------------------------
   * Original runtime.start()
   * ----------------------------------------------------------
   */
  const originalStart = runtime.start;

  if (typeof originalStart !== "function") {
    console.warn(
      "custom-fps: runtime.start() is unavailable."
    );
    return;
  }

  /*
   * Keep a reference to the custom wrapper.
   */
  let customStart;

  /*
   * ----------------------------------------------------------
   * Replace runtime.start()
   * ----------------------------------------------------------
   *
   * Scratch's current Runtime.start():
   *
   *   if (_steppingInterval) return;
   *   _steppingInterval = setInterval(_step, interval);
   *
   * Therefore we let the original function create Scratch's
   * normal timer, then immediately replace that timer with our
   * 120 Hz clock.
   */
  customStart = function (...args) {
    /*
     * If our custom timer is already running, Scratch is
     * already running too.
     */
    if (state.running) {
      return;
    }

    /*
     * Let Scratch perform its normal start behavior first.
     *
     * This preserves the normal RUNTIME_STARTED event.
     */
    let result;

    try {
      result = originalStart.apply(this, args);
    } catch (error) {
      console.error(
        "custom-fps: Scratch runtime.start() failed.",
        error
      );
      throw error;
    }

    /*
     * Replace Scratch's native clock immediately.
     */
    if (!addon.self.disabled) {
      startCustomTimer();
    }

    return result;
  };

  /*
   * ----------------------------------------------------------
   * Register addon state
   * ----------------------------------------------------------
   */
  runtime.__customFpsAddon = state;
  runtime.__customFpsOriginalStart = originalStart;
  runtime.__customFpsStartWrapped = true;
  runtime.__customFpsStartWrapper = customStart;

  /*
   * Install wrapper.
   */
  runtime.start = customStart;

  /*
   * ----------------------------------------------------------
   * Handle addon disabling
   * ----------------------------------------------------------
   *
   * When custom-fps is disabled, return Scratch to its normal
   * clock instead of leaving our timer running.
   */
  addon.self.addEventListener("disabled", () => {
    /*
     * Remember whether Scratch was running.
     */
    state.wasRunningBeforeDisable =
      state.running ||
      runtime._steppingInterval !== null;

    /*
     * Stop our 120 Hz timer.
     */
    stopCustomTimer();

    /*
     * Remove our fake stepping handle.
     */
    runtime._steppingInterval = null;

    /*
     * Restore Scratch's original start function.
     */
    if (runtime.start === customStart) {
      runtime.start = originalStart;
    }

    /*
     * If Scratch was running before the addon was disabled,
     * restore its normal 60 Hz timer.
     */
    if (state.wasRunningBeforeDisable) {
      try {
        originalStart.apply(runtime);
      } catch (error) {
        console.warn(
          "custom-fps: Failed to restore Scratch's normal timer.",
          error
        );
      }
    }
  });

  /*
   * ----------------------------------------------------------
   * Handle addon re-enabling
   * ----------------------------------------------------------
   */
  addon.self.addEventListener("reenabled", () => {
    /*
     * Put our wrapper back.
     */
    runtime.start = customStart;

    /*
     * If Scratch was running before we were disabled,
     * replace the restored 60 Hz timer with our 120 Hz timer.
     */
    if (state.wasRunningBeforeDisable) {
      startCustomTimer();
    }

    state.wasRunningBeforeDisable = false;
  });

  /*
   * ----------------------------------------------------------
   * Protect against Scratch changing its timer internally.
   * ----------------------------------------------------------
   *
   * Some Scratch operations can call start() again.
   *
   * Our wrapper prevents another timer from being created
   * while state.running is true.
   */

  /*
   * ----------------------------------------------------------
   * If the addon loads after Scratch is already running,
   * replace the existing Scratch clock immediately.
   * ----------------------------------------------------------
   */
  if (
    runtime._steppingInterval !== null &&
    typeof runtime._step === "function"
  ) {
    startCustomTimer();
  }

  /*
   * ----------------------------------------------------------
   * Final information
   * ----------------------------------------------------------
   */
  console.info(
    `custom-fps: Loaded. Target = ${FPS} Hz (${STEP.toFixed(6)} ms/step).`
  );
}
