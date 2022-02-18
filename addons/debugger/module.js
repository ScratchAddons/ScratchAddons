// https://github.com/LLK/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/thread.js#L198
const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

let vm;
let sequencerStepThread; // The unmodified sequencer.stepThread function

let paused = false;
let pausedThreadState = new WeakMap();
let pauseNewThreads = false;

let steppingThread = null;
let steppingThreadIndex = -1;

let eventTarget = new EventTarget();

export const isPaused = () => paused;

const pauseThread = (thread) => {
  if (!thread.updateMonitor && !pausedThreadState.has(thread)) {
    pausedThreadState.set(thread, {
      time: vm.runtime.currentMSecs,
    });
    if (thread === vm.runtime.sequencer.activeThread) {
      // If we are the active thread, we hit paused in the middle of executing a block
      if (vm.runtime.sequencer.activeThread) {
        const thread = vm.runtime.sequencer.activeThread;
        pausedThreadState.get(thread).status = thread.status;

        // Force the block to exit immediately
        Object.defineProperty(thread, "status", {
          get() {
            return STATUS_PROMISE_WAIT;
          },
          set(status) {
            pausedThreadState.get(this).status = status;
          },
        });
      }
    }
  }
};

const setSteppingThred = (thread) => {
  steppingThread = thread;
  steppingThreadIndex = vm.runtime.threads.indexOf(steppingThread);
};

export const setPaused = (_paused) => {
  if (_paused) {
    vm.runtime.audioEngine.audioContext.suspend();
    if (!vm.runtime.ioDevices.clock._paused) {
      vm.runtime.ioDevices.clock.pause();
    }
    vm.runtime.threads.forEach(pauseThread);
  } else {
    vm.runtime.audioEngine.audioContext.resume();
    vm.runtime.ioDevices.clock.resume();
    for (const thread of vm.runtime.threads) {
      const pauseState = pausedThreadState.get(thread);
      if (pauseState) {
        const stackFrame = thread.peekStackFrame();
        if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
          stackFrame.executionContext.timer.startTime += vm.runtime.currentMSecs - pauseState.time;
        }
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
  let currentBlockId = thread.peekStack();

  if (!currentBlockId) {
    thread.popStack();

    if (thread.stack.length === 0) {
      thread.status = STATUS_DONE;
      return false;
    }
  }

  vm.runtime.sequencer.activeThread = thread;
  pauseNewThreads = true;

  if (!thread.target) {
    vm.runtime.sequencer.retireThread(thread);
  } else {
    /*
          We need to call execute(this, thread) like the original sequencer. We don't
          have access to that method, so we need to force the original stepThread to run
          execute for us then exit before it tries to run more blocks.
          So, we make `thread.blockGlowInFrame = ...` throw an exception, so this line:
          https://github.com/LLK/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/sequencer.js#L214
          will end the function early. We then have to set it back to normal afterward.

          Why are we here just to suffer?
         */
    const throwMsg = ["special error used by Scratch Addons for implementing single-stepping"];

    Object.defineProperty(thread, "blockGlowInFrame", {
      set(block) {
        throw throwMsg;
      },
    });

    try {
      sequencerStepThread.call(vm.runtime.sequencer, thread);
    } catch (err) {
      if (err !== throwMsg) throw err;
    }

    Object.defineProperty(thread, "blockGlowInFrame", {
      value: null,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  vm.runtime.sequencer.activeThread = null;
  pauseNewThreads = false;
  thread.blockGlowInFrame = currentBlockId;

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
};

const findNewSteppingThread = (startIndex) => {
  for (var i = startIndex; i < vm.runtime.threads.length; i++) {
    const newThread = vm.runtime.threads[i];

    if (newThread.status === STATUS_YIELD_TICK) {
      newThread.status = STATUS_RUNNING;
    }

    if (newThread.status === STATUS_RUNNING || newThread.status === STATUS_YIELD) {
      return newThread;
    }
  }
  return null;
};

export const singleStep = () => {
  const pauseState = pausedThreadState.get(steppingThread);
  if (steppingThread) {
    // Make it look like no time has passed
    const stackFrame = steppingThread.peekStackFrame();
    if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
      stackFrame.executionContext.timer.startTime += vm.runtime.currentMSecs - pauseState.time;
    }
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
    setSteppingThred(findNewSteppingThread(0));

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

  sequencerStepThread = vm.runtime.sequencer.stepThread;
  vm.runtime.sequencer.stepThread = function (thread) {
    if (pausedThreadState.has(thread)) {
      return;
    }

    sequencerStepThread.call(this, thread);

    // Thread was paused in the middle of execution
    if (pausedThreadState.has(thread)) {
      const threadPauseState = pausedThreadState.get(thread);

      setSteppingThred(thread);

      Object.defineProperty(thread, "status", {
        value: threadPauseState.status,
        configurable: true,
        enumerable: true,
        writable: true,
      });

      delete threadPauseState.status;

      eventTarget.dispatchEvent(new CustomEvent("step"));
    }
  };

  const ogStepThreads = vm.runtime.sequencer.stepThreads;
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

    return ogStepThreads.call(this);
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
