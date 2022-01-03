
// https://github.com/LLK/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/thread.js#L198
const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

let vm;
let sequencerStepThread;

let paused = false;
let pausedThreadState = new WeakMap();

let steppingThread = null;

let eventTarget = new EventTarget();


export const isPaused = () => paused;

const pauseThread = (thread) => {
    if (!thread.updateMonitor && !pausedThreadState.has(thread)) {
        pausedThreadState.set(thread, {
            time: vm.runtime.currentMSecs
        });
    }
}

export const setPaused = (_paused) => {
    paused = _paused;

    if (paused) {
        vm.runtime.audioEngine.audioContext.suspend();
        if (!vm.runtime.ioDevices.clock._paused) {
            vm.runtime.ioDevices.clock.pause();
        }

        vm.runtime.threads.forEach(pauseThread);

        // TODO Comment
        if (vm.runtime.sequencer.activeThread) {
            const thread = vm.runtime.sequencer.activeThread;
            pausedThreadState.get(thread).status = thread.status;

            Object.defineProperty(thread, "status", {
                get() {
                    return STATUS_PROMISE_WAIT;
                },
                set(status) {
                    pausedThreadState.get(this).status = status;
                }
            });
        }
    } else {

        vm.runtime.audioEngine.audioContext.resume();
        vm.runtime.ioDevices.clock.resume();

        for (const thread of vm.runtime.threads) {
            if (pausedThreadState.has(thread)) {
                // TODO Ajust timing
            }
        }

        pausedThreadState = new WeakMap();
    }

    eventTarget.dispatchEvent(new CustomEvent("change"));
}

export const onPauseChanged = (listener) => {
    eventTarget.addEventListener("change", () => listener(paused));
};

export const onSingleStep = (listener) => {
    eventTarget.addEventListener("step", listener);
}

export const getRunningBlockId = () => {
    if (steppingThread) return steppingThread.peekStack();
}

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

    if (thread.target == null) {
        vm.runtime.sequencer.retireThread(thread);
    } else {
        // Call execute()
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
}

const findNewSteppingThread = (startIndex) => {
    for (var i = startIndex; i < vm.runtime.threads.length; i++) {
        const newThread = vm.runtime.threads[i];

        if (newThread.status === STATUS_YIELD_TICK) { // TODO is `&& !this.stepRanFirstTick` needed for perfect emulation?
            newThread.status = STATUS_RUNNING;
        }

        if (newThread.status === STATUS_RUNNING || newThread.status === STATUS_YIELD) {
            return newThread;
        }
    }
    return null;
}

export const singleStep = () => {
    if (steppingThread) {
        // TODO Make it look like no time has passed

        console.log("Stepping thread");
        console.log(steppingThread);
        const continueExecuting = singleStepThread(steppingThread);

        if (!continueExecuting) {
            steppingThread = findNewSteppingThread(vm.runtime.threads.indexOf(steppingThread) + 1);
            console.log("Thread finished. Trying to move to next one.");
            console.log(steppingThread);
        }
    }

    if (!steppingThread) {
        steppingThread = findNewSteppingThread(0);
        console.log("Trying to start VM step");
        console.log(steppingThread);

        // TODO Everything else in here
    }

    eventTarget.dispatchEvent(new CustomEvent("step"));
}

export const setup = (addon) => {
    if (vm) {
        return;
    }

    vm = addon.tab.traps.vm;

    sequencerStepThread = vm.runtime.sequencer.stepThread;
    vm.runtime.sequencer.stepThread = function (thread) {

        if (pausedThreadState.has(thread)) {
            return;
        }

        sequencerStepThread.call(this, thread);

        // Thread was paused in the middle of execution
        if (pausedThreadState.has(thread)) {
            const threadPauseState = pausedThreadState.get(thread);

            steppingThread = thread;

            Object.defineProperty(thread, "status", {
                value: threadPauseState.status,
                configurable: true,
                enumerable: true,
                writable: true,
            });

            delete threadPauseState.status;

            eventTarget.dispatchEvent(new CustomEvent("step"));
        }
    }

    const ogStepThreads = vm.runtime.sequencer.stepThreads;
    vm.runtime.sequencer.stepThreads = function () {

        if (steppingThread && !paused) {

            const threads = vm.runtime.threads;
            for (var i = threads.indexOf(steppingThread); i < threads.length; i++) {
                const thread = threads[i];

                if (thread.status == STATUS_YIELD_TICK) { // TODO Like above
                    thread.status = STATUS_RUNNING;
                }

                if (thread.status == STATUS_RUNNING || thread.status == STATUS_YIELD) {
                    vm.runtime.sequencer.stepThread(thread);
                }
            }

            steppingThread = null;
        }

        return ogStepThreads.call(this);
    }

    // Disable edge-activated hats and hats like "when key pressed" while paused.
    const originalStartHats = vm.runtime.startHats;
    vm.runtime.startHats = function (...args) {
        const hat = args[0];
        if (paused) {
            // We don't want to stop broadcasts or clone starts as they can be run by a user
            //  while paused or run by paused threads while single stepping.
            if (hat !== "event_whenbroadcastreceived" && hat !== "control_start_as_clone") {
                return [];
            }
        }
        if (hat !== "event_whentouchingobject" && hat !== "event_whengreaterthan") {
            console.log("Here!");
            console.log(hat);
            console.log(vm.runtime.sequencer.activeThread);
        }
        if (pausedThreadState.get(vm.runtime.sequencer.activeThread)) {
            // If this hat was activated by a paused thread, pause the newly created
            //  threads as well.
            const newThreads = originalStartHats.apply(this, args);
            for (const idx in newThreads) {
                pauseThread(newThreads[idx]);
            }
            return newThreads;
        } else {
            return originalStartHats.apply(this, args);
        }
    };

    // TODO Paused threads should not be counted as running when updating GUI state.
}