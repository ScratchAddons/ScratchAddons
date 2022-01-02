// https://github.com/LLK/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/thread.js#L198
const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

let vm;
let paused = false;
let pausedThreadState = new WeakMap();
let eventTarget = new EventTarget();

export const isPaused = () => paused;

export const onPauseChanged = (listener) => {
  eventTarget.addEventListener("change", () => listener(paused));
};

const pauseThread = (thread, deferResume) => {
  const pauseState = {
    pauseTime: vm.runtime.currentMSecs,
    status: thread.status,
    deferResume
  };
  pausedThreadState.set(thread, pauseState);
  // Make sure that paused threads will remain paused.
  // Setting thread.status once is not enough for promise blocks like "ask and wait"
  Object.defineProperty(thread, "status", {
    get() {
      return STATUS_PROMISE_WAIT;
    },
    set(status) {
      // New status will be applied when the thread is unpaused.
      pauseState.status = status;
    },
    configurable: true,
    enumerable: true,
  });
};

export const setPaused = (_paused) => {
  paused = _paused;

  if (paused) {
    vm.runtime.audioEngine.audioContext.suspend();
    if (!vm.runtime.ioDevices.clock._paused) {
      vm.runtime.ioDevices.clock.pause();
    }

    const threads = vm.runtime.threads;
    const activeThread = vm.runtime.sequencer.activeThread;
    const activeThreadIndex = threads.indexOf(activeThread);

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      if (thread.updateMonitor || pausedThreadState.has(thread)) {
        continue;
      }
      pauseThread(thread, i < activeThreadIndex);
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
        // Let's imagine we have some threads: [A] [B] [C]
        // And while executing [B], we encounter a breakpoint. [B] is interrupted and [C] will not execute at all during this tick.
        // However, when we resume, the runtime will start running threads from [A], therefore [B] and [C] may
        // have had a tick skipped, which could impact project behavior.
        if (!pauseState.deferResume) {
          if (thread.status === STATUS_RUNNING || thread.status === STATUS_YIELD) {
            vm.runtime.sequencer.stepThread(thread);
          }
        }
      }
    }
    pausedThreadState = new WeakMap();
  }

  eventTarget.dispatchEvent(new CustomEvent("change"));
};

let pauseStartedHats = false;
export const setPauseStartedHats = (_pauseStartedHats) => {
  pauseStartedHats = _pauseStartedHats;
};

export const getRealStatus = (thread) => {
  if (pausedThreadState.has(thread)) {
    const pauseState = pausedThreadState.get(thread);
    return pauseState.status;
  }
  return thread.status;
};

export const setupPause = (addon) => {
  if (vm) {
    return;
  }

  vm = addon.tab.traps.vm;

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
    const newThreads = originalStartHats.apply(this, args);
    // Hats started by a paused thread should also be paused
    if (paused && pauseStartedHats) {
      for (const thread of newThreads) {
        pauseThread(thread, false);
      }
    }
    return newThreads;
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
};
