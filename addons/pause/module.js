const vm = window.__scratchAddonsTraps._onceMap.vm;

export let paused = false;
let pausedThreadState = new WeakMap();
let eventTarget = new EventTarget();

export const onPauseChanged = (listener) => {
  eventTarget.addEventListener("change", () => listener(paused));
};

export const setPaused = (_paused) => {
  paused = _paused;

  if (paused) {
    vm.runtime.audioEngine.audioContext.suspend();
    if (!vm.runtime.ioDevices.clock._paused) {
      vm.runtime.ioDevices.clock.pause();
    }

    for (const thread of vm.runtime.threads) {
      if (!thread.updateMonitor && !pausedThreadState.has(thread)) {
        const pauseState = {
          pauseTime: vm.runtime.currentMSecs,
          status: thread.status,
        };
        pausedThreadState.set(thread, pauseState);
        // Make sure that paused threads will always be paused.
        // Setting thread.status is not enough for blocks like "ask and wait"
        Object.defineProperty(thread, "status", {
          get() {
            return /* STATUS_PROMISE_WAIT */ 1;
          },
          set(status) {
            // Status will be set when the thread is unpaused.
            pauseState.status = status;
          },
          configurable: true,
          enumerable: true,
        });
      }
    }

    // Immediately emit project stop
    // Scratch will do this automatically, but there may be a slight delay.
    vm.runtime.emit("PROJECT_RUN_STOP");
  } else {
    vm.runtime.audioEngine.audioContext.resume();
    vm.runtime.ioDevices.clock.resume();

    const now = Date.now();
    for (const thread of vm.runtime.threads) {
      const pauseState = pausedThreadState.get(thread);
      if (pauseState) {
        const stackFrame = thread.peekStackFrame();
        if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
          const dt = now - pauseState.pauseTime;
          stackFrame.executionContext.timer.startTime += dt;
        }
        Object.defineProperty(thread, "status", {
          value: pauseState.status,
          configurable: true,
          enumerable: true,
          writable: true,
        });
      }
    }
    pausedThreadState = new WeakMap();
  }

  eventTarget.dispatchEvent(new CustomEvent("change"));
};

export const singleStep = () => {
  if (!paused) setPaused(true);

  // Unpause threads only
  const now = Date.now();
  for (const thread of vm.runtime.threads) {
    const pauseState = pausedThreadState.get(thread);
    if (pauseState) {
      const stackFrame = thread.peekStackFrame();
      if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
        const dt = now - pauseState.pauseTime;
        stackFrame.executionContext.timer.startTime += dt;
      }
      Object.defineProperty(thread, "status", {
        value: pauseState.status,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }
  }
  pausedThreadState = new WeakMap();

  // Run 1 step
  vm.runtime._step();

  // Emulate a frame of time passing
  vm.runtime.ioDevices.clock._pausedTime += vm.runtime.currentStepTime;
  // Skip all sounds forward by vm.runtime.currentStepTime miliseconds so it's as
  //  if they where playing for one frame. 
  const audioContext = vm.runtime.audioEngine.audioContext;
  for (const target of vm.runtime.targets) {
    for (const soundId in target.sprite.soundBank.soundPlayers) {
      const soundPlayer = target.sprite.soundBank.soundPlayers[soundId];
      if (soundPlayer.outputNode) {
        soundPlayer.outputNode.stop(audioContext.currentTime);
        soundPlayer._createSource();
        soundPlayer.outputNode.start(audioContext.currentTime, audioContext.currentTime - soundPlayer.startingUntil + (vm.runtime.currentStepTime / 1000));
        soundPlayer.startingUntil -= (vm.runtime.currentStepTime / 1000);
      }
    }
  }

  // Pause again
  for (const thread of vm.runtime.threads) {
    if (!thread.updateMonitor && !pausedThreadState.has(thread)) {
      const pauseState = {
        pauseTime: vm.runtime.currentMSecs + vm.runtime.currentStepTime, // Once again emulate a frame of time
        // pauseTime: vm.runtime.currentMSecs,
        status: thread.status,
      };
      pausedThreadState.set(thread, pauseState);
      // Make sure that paused threads will always be paused.
      // Setting thread.status is not enough for blocks like "ask and wait"
      Object.defineProperty(thread, "status", {
        get() {
          return /* STATUS_PROMISE_WAIT */ 1;
        },
        set(status) {
          // Status will be set when the thread is unpaused.
          pauseState.status = status;
        },
        configurable: true,
        enumerable: true,
      });
    }
  }
}

const originalGreenFlag = vm.runtime.greenFlag;
vm.runtime.greenFlag = function () {
  setPaused(false);
  return originalGreenFlag.call(this);
};

// Disable edge-activated hats and hats like "when key pressed" while paused.
const originalStartHats = vm.runtime.startHats;
vm.runtime.startHats = function (...args) {
  if (paused) {
    const hat = args[0];
    // The project can still be edited and the user might manually trigger some events. Let these run.
    if (hat !== "event_whenbroadcastreceived" && hat !== "control_start_as_clone") {
      return [];
    }
  }
  return originalStartHats.apply(this, args);
};

// Paused threads should not be counted as running when updating GUI state.
const originalGetMonitorThreadCount = vm.runtime._getMonitorThreadCount;
vm.runtime._getMonitorThreadCount = function (threads) {
  let count = originalGetMonitorThreadCount.call(this, threads);
  if (paused) {
    for (const thread of threads) {
      if (pausedThreadState.has(thread)) {
        count++;
      }
    }
  }
  return count;
};
