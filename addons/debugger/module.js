// https://github.com/LLK/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/thread.js#L198
const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

let vm;

let paused = false;
let pausedThreadState = new WeakMap();
let pauseNewThreads = false;

let steppingThread = null;
let isInSingleStep = false;
let steppingThreadIndex = -1;

const eventTarget = new EventTarget();

export const isPaused = () => paused;

const pauseThread = (thread) => {
  if (thread.updateMonitor || pausedThreadState.has(thread)) {
    // Thread is already paused or shouldn't be paused.
    return;
  }

  const pausedState = {
    time: vm.runtime.currentMSecs,
    status: thread.status
  };
  pausedThreadState.set(thread, pausedState);

  // We must make thread.status return STATUS_PROMISE_WAIT on paused threads so that the sequencer doesn't
  // think this thread is active as otherwise Scratch will do 24ms of unnecessary main thread work every frame.
  Object.defineProperty(thread, "status", {
    get() {
      if (isInSingleStep && steppingThread === thread) {
        return pausedState.status;
      }
      return STATUS_PROMISE_WAIT;
    },
    set(status) {
      pausedState.status = status;
    },
  });
};

const setSteppingThread = (thread) => {
  steppingThread = thread;
  steppingThreadIndex = vm.runtime.threads.indexOf(steppingThread);
};

const compensateForTimePassedWhilePaused = (thread, pauseState) => {
  const stackFrame = thread.peekStackFrame();
  if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
    stackFrame.executionContext.timer.startTime += vm.runtime.currentMSecs - pauseState.time;
  }
};

export const setPaused = (_paused) => {
  if (_paused) {
    vm.runtime.audioEngine.audioContext.suspend();
    if (!vm.runtime.ioDevices.clock._paused) {
      vm.runtime.ioDevices.clock.pause();
    }
    vm.runtime.threads.forEach(pauseThread);

    const activeThread = vm.runtime.sequencer.activeThread;
    if (activeThread) {
      setSteppingThread(activeThread);
      eventTarget.dispatchEvent(new CustomEvent('step'));
    }
  } else {
    vm.runtime.audioEngine.audioContext.resume();
    vm.runtime.ioDevices.clock.resume();
    for (const thread of vm.runtime.threads) {
      const pauseState = pausedThreadState.get(thread);
      if (pauseState) {
        compensateForTimePassedWhilePaused(thread, pauseState);
        Object.defineProperty(thread, 'status', {
          value: pauseState.status,
          configurable: true,
          enumerable: true,
          writable: true,  
        });
      }
    }
    pausedThreadState = new WeakMap();
  }
  if (paused !== _paused) {
    paused = _paused;
    eventTarget.dispatchEvent(new CustomEvent("change"));
  }
};

export const onPauseChanged = (listener) => {
  eventTarget.addEventListener("change", () => listener(paused));
};

export const onSingleStep = (listener) => {
  eventTarget.addEventListener("step", listener);
};

export const getRunningThread = () => {
  return steppingThread;
};

// A modified version of this function
// https://github.com/LLK/scratch-vm/blob/0e86a78a00db41af114df64255e2cd7dd881329f/src/engine/sequencer.js#L179
// Returns if we should continue executing this thread.
const singleStepThread = (thread) => {
  const currentBlockId = thread.peekStack();
  if (!currentBlockId) {
    thread.popStack();

    if (thread.stack.length === 0) {
      thread.status = STATUS_DONE;
      return false;
    }
  }

  isInSingleStep = true;
  pauseNewThreads = true;
  vm.runtime.sequencer.activeThread = thread;

  /*
    We need to call execute(this, thread) like the original sequencer. We don't
    have access to that method, so we need to force the original stepThread to run
    execute for us then exit before it tries to run more blocks.
    So, we make `thread.blockGlowInFrame = ...` throw an exception, so this line:
    https://github.com/LLK/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/sequencer.js#L214
    will end the function early. We then have to set it back to normal afterward.

    Why are we here just to suffer?
  */
  const specialError = ["special error used by Scratch Addons for implementing single-stepping"];
  Object.defineProperty(thread, "blockGlowInFrame", {
    set(_block) {
      throw specialError;
    },
  });

  try {
    try {
      vm.runtime.sequencer.stepThread(thread);
    } catch (err) {
      if (err !== specialError) throw err;
    }

    if (thread.status === STATUS_YIELD) {
      thread.status = STATUS_RUNNING;
      return false;
    } else if (thread.status === STATUS_PROMISE_WAIT || thread.status === STATUS_YIELD_TICK) {
      return false;
    }

    if (thread.peekStack() === currentBlockId) {
      thread.goToNextBlock();
    }

    while (!thread.peekStack()) {
      thread.popStack();

      if (thread.stack.length === 0) {
        thread.status = STATUS_DONE;
        return false;
      }

      const stackFrame = thread.peekStackFrame();

      if (stackFrame.isLoop) {
        if (!thread.isWarpMode) {
          return false;
        } else {
          continue;
        }
      } else if (stackFrame.waitingReporter) {
        return false;
      }

      thread.goToNextBlock();
    }

    return true;
  } finally {
    isInSingleStep = false;
    pauseNewThreads = false;
    vm.runtime.sequencer.activeThread = null;
    Object.defineProperty(thread, "blockGlowInFrame", {
      value: currentBlockId,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }
};

const getRealStatus = (thread) => {
  const pauseState = pausedThreadState.get(thread);
  if (pauseState) {
    return pauseState.status;
  }
  return thread.status;
};

const findNewSteppingThread = (startIndex) => {
  for (var i = startIndex; i < vm.runtime.threads.length; i++) {
    const possibleNewThread = vm.runtime.threads[i];
    const status = getRealStatus(possibleNewThread);
    if (status === STATUS_YIELD_TICK || status === STATUS_RUNNING || status === STATUS_YIELD) {
      // TODO: what happens if status === STATUS_YIELD_TICK
      return possibleNewThread;
    }
  }
  return null;
};

export const singleStep = () => {
  const pauseState = pausedThreadState.get(steppingThread);
  if (steppingThread) {
    // Make it look like no time has passed
    compensateForTimePassedWhilePaused(steppingThread, pauseState);
    pauseState.time = vm.runtime.currentMSecs;

    // Execute the block
    const continueExecuting = singleStepThread(steppingThread);

    if (!continueExecuting) {
      // Try to move onto the next thread
      steppingThread = findNewSteppingThread(steppingThreadIndex + 1);
    }
  }

  // If we don't have a thread, than we are between VM steps and should search for a new thread
  if (!steppingThread) {
    setSteppingThread(findNewSteppingThread(0));

    // End of VM step, emulate one frame of time passing.
    vm.runtime.ioDevices.clock._pausedTime += vm.runtime.currentStepTime;
    // Skip all sounds forward by vm.runtime.currentStepTime milliseconds so it's as
    //  if they where playing for one frame.
    const audioContext = vm.runtime.audioEngine.audioContext;
    for (const target of vm.runtime.targets) {
      for (const soundId of Object.keys(target.sprite.soundBank.soundPlayers)) {
        const soundPlayer = target.sprite.soundBank.soundPlayers[soundId];
        if (soundPlayer.outputNode) {
          soundPlayer.outputNode.stop(audioContext.currentTime);
          soundPlayer._createSource();
          soundPlayer.outputNode.start(
            audioContext.currentTime,
            audioContext.currentTime - soundPlayer.startingUntil + vm.runtime.currentStepTime / 1000
          );
          soundPlayer.startingUntil -= vm.runtime.currentStepTime / 1000;
        }
      }
    }
    // Move all threads forward one frame in time. For blocks like `wait () seconds`
    for (const thread of vm.runtime.threads) {
      if (pausedThreadState.has(thread)) {
        pausedThreadState.get(thread).time += vm.runtime.currentStepTime;
      }
    }

    // Try to run edge activated hats
    pauseNewThreads = true;

    const hats = vm.runtime._hats;
    for (const hatType in hats) {
      if (!Object.prototype.hasOwnProperty.call(hats, hatType)) continue;
      const hat = hats[hatType];
      if (hat.edgeActivated) {
        vm.runtime.startHats(hatType);
      }
    }

    pauseNewThreads = false;
  }

  eventTarget.dispatchEvent(new CustomEvent("step"));
};

export const setup = (_vm) => {
  if (vm) {
    return;
  }

  vm = _vm;

  const originalStepThreads = vm.runtime.sequencer.stepThreads;
  vm.runtime.sequencer.stepThreads = function () {
    // If we where half way through a vm step and have unpaused, pick up were we left off.
    if (steppingThread && !paused) {
      const threads = vm.runtime.threads;
      if (steppingThreadIndex !== -1) {
        for (let i = steppingThreadIndex; i < threads.length; i++) {
          const thread = threads[i];

          if (thread.status === STATUS_YIELD_TICK) {
            thread.status = STATUS_RUNNING;
          }

          if (thread.status === STATUS_RUNNING || thread.status === STATUS_YIELD) {
            vm.runtime.sequencer.activeThread = thread;
            vm.runtime.sequencer.stepThread(thread);
          }
        }
      }

      steppingThread = null;
    }

    return originalStepThreads.call(this);
  };

  // Unpause when green flag
  const originalGreenFlag = vm.runtime.greenFlag;
  vm.runtime.greenFlag = function () {
    setPaused(false);
    return originalGreenFlag.call(this);
  };

  // Disable edge-activated hats and hats like "when key pressed" while paused.
  const originalStartHats = vm.runtime.startHats;
  vm.runtime.startHats = function (...args) {
    const hat = args[0];
    if (pauseNewThreads) {
      if (
        hat !== "event_whenbroadcastreceived" &&
        hat !== "control_start_as_clone" &&
        !this.getIsEdgeActivatedHat(hat)
      ) {
        return [];
      }
      const newThreads = originalStartHats.apply(this, args);
      for (const thread of newThreads) {
        pauseThread(thread);
      }
      return newThreads;
    } else {
      if (paused) {
        // We don't want to stop broadcasts or clone starts as they can be run by a user
        //  while paused or run by paused threads while single stepping.
        if (hat !== "event_whenbroadcastreceived" && hat !== "control_start_as_clone") {
          return [];
        }
      }

      return originalStartHats.apply(this, args);
    }
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
