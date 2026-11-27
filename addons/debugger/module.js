// https://github.com/scratchfoundation/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/thread.js#L198
const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

let vm;

let paused = false;
let pausedThreadState = new WeakMap();
let pauseNewThreads = false;
let blocksAreRunning = false;

let deletedClones = new WeakSet();

let steppingThread = null;

let savedThreadList = null;
const getSteppingThreads = () => savedThreadList || vm.runtime.threads;

const eventTarget = new EventTarget();

let audioContextStateChange = Promise.resolve();

export const isPaused = () => paused;

const pauseThread = (thread) => {
  if (thread.updateMonitor) {
    // Monitor threads shouldn't be paused.
    return;
  }

  if (!pausedThreadState.has(thread)) {
    const pauseState = {
      time: vm.runtime.currentMSecs,
      status: thread.status,
      isKilled: thread.isKilled,
    };
    pausedThreadState.set(thread, pauseState);
  }

  // Pausing a thread now works by just setting its status to STATUS_PROMISE_WAIT.
  // At the start of each frame, we make sure each paused thread is still paused.
  // This is really the best way to implement this.
  // Converting thread.status into a getter/setter causes Scratch's sequencer to permanently
  //    perform significantly slower in some projects. I think this is because it causes some
  //    very hot functions to be deoptimized.
  // Trapping sequencer.stepThread to no-op for a paused thread causes Scratch's sequencer
  //    to waste 24ms of CPU time every frame because it thinks a thread is running.
  freezeThreadIfPaused(thread);
};

const fakeBlockIDtoPreventDespawning = Symbol("stopped thread");

const freezeThreadIfPaused = (thread) => {
  const pauseState = pausedThreadState.get(thread);
  if (pauseState) {
    // We'll record any changes so we can properly resume the thread, but the thread must still be paused for now.
    if (thread.status !== STATUS_PROMISE_WAIT) {
      pauseState.status = thread.status;
      thread.status = STATUS_PROMISE_WAIT;
    }
    if (thread.isKilled) {
      pauseState.status = thread.isKilled;
      thread.isKilled = false;
    }
    if (thread.stack.length === 0) {
      thread.stack.unshift(fakeBlockIDtoPreventDespawning);
    }
  }
};

const unpauseThread = (thread) => {
  // if something changed about the thread since it was paused, update the pauseState
  freezeThreadIfPaused(thread);
  // unpause
  const pauseState = pausedThreadState.get(thread);
  if (pauseState) {
    compensateForTimePassedWhilePaused(thread, pauseState);
    thread.status = pauseState.status;
    thread.isKilled = pauseState.isKilled;
    if (thread.stack[0] === fakeBlockIDtoPreventDespawning) {
      thread.stack.shift();
    }
  }
  pausedThreadState.delete(thread);
};

const setSteppingThread = (thread) => {
  steppingThread = thread;
};

const compensateForTimePassedWhilePaused = (thread, pauseState) => {
  const stackFrame = thread.peekStackFrame();
  if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.timer) {
    stackFrame.executionContext.timer.startTime += vm.runtime.currentMSecs - pauseState.time;
  }
};

const stepUnsteppedThreads = (lastSteppedThread) => {
  // If we paused in the middle of a tick, we need to make sure to step the scripts that didn't get
  // stepped in that tick to avoid affecting project behavior.
  const threads = getSteppingThreads();
  const startingIndex = getThreadIndex(lastSteppedThread);
  if (startingIndex !== -1) {
    for (let i = startingIndex; i < threads.length; i++) {
      const thread = threads[i];
      const status = thread.status;
      if (status === STATUS_RUNNING || status === STATUS_YIELD || status === STATUS_YIELD_TICK) {
        vm.runtime.sequencer.activeThread = thread;
        blocksAreRunning = true;
        try {
          vm.runtime.sequencer.stepThread(thread);
        } finally {
          blocksAreRunning = false;
        }
      }
    }
  }
};

export const setPaused = (_paused) => {
  const didChange = paused !== _paused;
  if (didChange) {
    paused = _paused;
    eventTarget.dispatchEvent(new CustomEvent("change"));
  }

  // Don't check didChange as new threads could've started that we need to pause.
  if (paused) {
    audioContextStateChange = audioContextStateChange.then(() => {
      return vm.runtime.audioEngine.audioContext.suspend();
    });
    if (!vm.runtime.ioDevices.clock._paused) {
      vm.runtime.ioDevices.clock.pause();
    }
    // We always need to pause the threads in the runtime.threads list, because Scratch
    //   will try to run those in the next frame.
    // When pausing after a "stop all", the sequencer is possibly still stepping through
    //   its saved thread list, so we also need to pause the threads there.
    for (const threadList of [vm.runtime.threads, savedThreadList || []]) {
      for (const thread of threadList) {
        if (!canDeleteThreadBeforeEndOfTick(thread)) {
          pauseThread(thread);
        }
      }
    }

    const activeThread = vm.runtime.sequencer.activeThread;
    if (activeThread) {
      setSteppingThread(activeThread);
      eventTarget.dispatchEvent(new CustomEvent("step"));
    }
  }

  // Only run unpausing logic when pause state changed to avoid unnecessary work
  if (!paused && didChange) {
    audioContextStateChange = audioContextStateChange.then(() => {
      return vm.runtime.audioEngine.audioContext.resume();
    });
    vm.runtime.ioDevices.clock.resume();

    const lastSteppedThread = steppingThread;
    // unpause the threads used by stepUnsteppedThreads()
    for (const thread of getSteppingThreads()) {
      unpauseThread(thread);
    }
    // This must happen after the "change" event is fired to fix https://github.com/ScratchAddons/ScratchAddons/issues/4281
    stepUnsteppedThreads(lastSteppedThread);
    // recheck, as we might have hit a breakpoint
    if (!paused) {
      steppingThread = null;
      cleanThreadListAtEndOfTick();
      // unpause threads for next VM tick (might be a different list of threads, if a "stop all" has ran)
      for (const thread of vm.runtime.threads) {
        unpauseThread(thread);
      }
      pausedThreadState = new WeakMap();
    }
  }
};

export const onPauseChanged = (listener) => {
  eventTarget.addEventListener("change", () => listener(paused));
};

export const onSingleStep = (listener) => {
  eventTarget.addEventListener("step", listener);
};

export const getRunningThread = () => steppingThread;

// A modified version of this function
// https://github.com/scratchfoundation/scratch-vm/blob/0e86a78a00db41af114df64255e2cd7dd881329f/src/engine/sequencer.js#L179
// Returns if we should continue executing this thread.
const singleStepThread = (thread) => {
  unpauseThread(thread);
  pauseNewThreads = blocksAreRunning = true;

  try {
    if (thread.status === STATUS_DONE || thread.status === STATUS_PROMISE_WAIT) {
      return false;
    }

    const currentBlockId = thread.peekStack();
    if (!currentBlockId) {
      thread.popStack();

      if (thread.stack.length === 0) {
        thread.status = STATUS_DONE;
        return false;
      }
    }

    vm.runtime.sequencer.activeThread = thread;

    /*
      We need to call execute(this, thread) like the original sequencer. We don't
      have access to that method, so we need to force the original stepThread to run
      execute for us then exit before it tries to run more blocks.
      So, we make `thread.blockGlowInFrame = ...` throw an exception, so this line:
      https://github.com/scratchfoundation/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/sequencer.js#L214
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
      thread.status = STATUS_RUNNING;

      // Restart the warp timer on each step.
      // If we don't do this, Scratch will think a lot of time has passed and may yield this thread.
      if (thread.warpTimer) {
        thread.warpTimer.start();
      }

      try {
        vm.runtime.sequencer.stepThread(thread);
      } catch (err) {
        if (err !== specialError) throw err;
      }

      // in case a breakpoint was triggered
      unpauseThread(thread);

      if (thread.status !== STATUS_RUNNING) {
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
          if (thread.peekStackFrame().warpMode) {
            continue;
          } else {
            return false;
          }
        } else if (stackFrame.waitingReporter) {
          return false;
        }

        thread.goToNextBlock();
      }

      return true;
    } finally {
      vm.runtime.sequencer.activeThread = null;
      Object.defineProperty(thread, "blockGlowInFrame", {
        value: currentBlockId,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    }
  } finally {
    pauseNewThreads = blocksAreRunning = false;
    pauseThread(thread);
  }
};

const getRealStatus = (thread) => {
  const pauseState = pausedThreadState.get(thread);
  if (pauseState) {
    return pauseState.status;
  }
  return thread.status;
};

export const isThreadStopped = (thread) => {
  if (thread.stack.length === 0 || (thread.stack.length === 1 && thread.stack[0] === fakeBlockIDtoPreventDespawning)) {
    // Stack is empty (or would be empty if it wasn't paused)
    return true;
  }
  const pauseState = pausedThreadState.get(thread);
  if (pauseState) {
    if (pauseState.status === STATUS_DONE || pauseState.isKilled) return true;
    // also check the thread itself to also detect if it was stopped since the last freeze
  }
  if (thread.status === STATUS_DONE || thread.isKilled) return true;
  return false;
};

const canDeleteThreadBeforeEndOfTick = (thread) => {
  if (!isThreadStopped(thread)) {
    // it is still running
    return false;
  }
  const hatBlock = thread.target?.blocks?._blocks?.[thread.topBlock];
  const hatInfo = vm.runtime._hats[hatBlock?.opcode];
  if (hatInfo?.restartExistingThreads) {
    // it might be restarted in-place by a broadcast block or something
    return false;
  }
  return true;
};

const getThreadIndex = (thread) => {
  // We can't use threads.indexOf(thread) because threads can be restarted.
  // This can happens when, for example, a "when I receive message1" script broadcasts message1.
  // The object in runtime.threads is replaced when this happens.
  if (!thread) return -1;
  return getSteppingThreads().findIndex(
    (otherThread) =>
      otherThread.target === thread.target &&
      otherThread.topBlock === thread.topBlock &&
      otherThread.stackClick === thread.stackClick &&
      otherThread.updateMonitor === thread.updateMonitor
  );
};

const findNewSteppingThread = (startingIndex) => {
  const threads = getSteppingThreads();
  for (let i = startingIndex; i < threads.length; i++) {
    const possibleNewThread = threads[i];
    if (possibleNewThread.updateMonitor) {
      // Never single-step monitor update threads.
      continue;
    }
    const status = getRealStatus(possibleNewThread);
    if (status === STATUS_RUNNING || status === STATUS_YIELD || status === STATUS_YIELD_TICK) {
      // Pause thread to let highlighting a block to be stepped next.
      pauseThread(possibleNewThread);
      return possibleNewThread;
    }
  }
  return null;
};

export const singleStep = () => {
  if (steppingThread) {
    // Execute the block
    const continueExecuting = singleStepThread(steppingThread);

    if (!continueExecuting) {
      // Try to move onto the next thread
      steppingThread = findNewSteppingThread(getThreadIndex(steppingThread) + 1);
    }
  }

  // If we don't have a thread, than we are between VM steps and should search for a new thread
  if (!steppingThread) {
    // End of VM step.

    cleanThreadListAtEndOfTick();

    // Try to run edge activated hats
    // Do this before incrementing the timer, to prevent breaking "when timer > (variable set to timer in last frame)"
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

    // Emulate one frame of time passing.
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

    // Select thread after starting hats, so that the new threads can also be selected
    setSteppingThread(findNewSteppingThread(0));
  }

  eventTarget.dispatchEvent(new CustomEvent("step"));
};

const cleanThreadListAtEndOfTick = () => {
  savedThreadList = null;
  vm.runtime.threads = vm.runtime.threads.filter((thread) => !isThreadStopped(thread));
};

export const setup = (addon) => {
  if (vm) {
    return;
  }

  vm = addon.tab.traps.vm;

  const originalStepThreads = vm.runtime.sequencer.stepThreads;
  vm.runtime.sequencer.stepThreads = function () {
    if (isPaused()) {
      for (const thread of this.runtime.threads) {
        if (deletedClones.has(thread.target) && isThreadStopped(thread)) {
          // if it belongs to a deleted target, let it get deleted
          unpauseThread(thread);
        } else {
          freezeThreadIfPaused(thread);
        }
      }
    } else {
      // when pausing in a tick where the project has already recovered from a "stop all", don't try to go back to the old thread list
      savedThreadList = null;
    }
    blocksAreRunning = true;
    try {
      return originalStepThreads.call(this);
    } finally {
      blocksAreRunning = false;
    }
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
    // These hats can be manually started by the user when paused or while single stepping.
    const isUserInitiated = hat === "event_whenbroadcastreceived" || hat === "control_start_as_clone";
    if (pauseNewThreads) {
      if (!isUserInitiated && !this.getIsEdgeActivatedHat(hat)) {
        return [];
      }
      const newThreads = originalStartHats.apply(this, args);
      for (const thread of newThreads) {
        if (!canDeleteThreadBeforeEndOfTick(thread)) {
          pauseThread(thread);
        }
      }
      return newThreads;
    } else if (paused && !isUserInitiated) {
      return [];
    }
    return originalStartHats.apply(this, args);
  };

  const originalRetireThread = vm.runtime.sequencer.retireThread;
  vm.runtime.sequencer.retireThread = function (...args) {
    const out = originalRetireThread.apply(this, args);
    if (blocksAreRunning) {
      freezeThreadIfPaused(args[0]);
    }
    return out;
  };

  // keep track of deleted clones to let letting go of their threads
  vm.runtime.on("targetWasRemoved", function (target) {
    deletedClones.add(target);
  });

  // Save the thread list at "stop all" blocks to let stepping through the rest of them like the sequencer would do.
  // Can't do this earlier, because we wouldn't get the hat blocks started later in the tick, as the runtime replaces its thread list with a clone in each tick
  vm.runtime.on("PROJECT_STOP_ALL", function () {
    if (blocksAreRunning && !savedThreadList) {
      savedThreadList = vm.runtime.threads;
    }
  });

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

  // All instances of AudioEngine use the same AudioContext by default,
  // which means that opening the sound library resumes the VM's context. See #6847.
  // This can be fixed by creating a separate context from the sound library.
  addon.tab
    .waitForElement("[class*='play-button_play-button_']", {
      reduxEvents: ["scratch-gui/modals/OPEN_MODAL"],
    })
    .then(() => {
      const soundLibrary = document.querySelector("[class*='modal_modal-content_']");
      const reactInternalKey = addon.tab.traps.getInternalKey(soundLibrary);
      let reactInternalInstance = soundLibrary[reactInternalKey];
      while (!reactInternalInstance.stateNode?.audioEngine) {
        reactInternalInstance = reactInternalInstance.return;
      }
      const soundLibraryInstance = reactInternalInstance.stateNode;
      const SoundLibrary = soundLibraryInstance.constructor;
      const AudioEngine = soundLibraryInstance.audioEngine.constructor;
      const soundLibraryContext = new AudioContext();
      soundLibraryInstance.audioEngine = new AudioEngine(soundLibraryContext);
      SoundLibrary.prototype.componentDidMount = function () {
        this.audioEngine = new AudioEngine(soundLibraryContext);
        this.playingSoundPromise = null;
      };
    });

  // Prevent the VM's context from being resumed while the project is paused
  const newResume = function () {
    if (!paused) AudioContext.prototype.resume.call(this);
  };
  if (vm.runtime.audioEngine) {
    vm.runtime.audioEngine.audioContext.resume = newResume;
  } else {
    const originalAttachAudioEngine = vm.runtime.attachAudioEngine;
    vm.runtime.attachAudioEngine = function (audioEngine) {
      audioEngine.audioContext.resume = newResume;
      return originalAttachAudioEngine.call(this, audioEngine);
    };
  }
};
