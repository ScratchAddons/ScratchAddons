class Profiler {
  constructor(config) {
    this.currentBlock = null;
    this.thread = null;
    this.config = config;
    this.profilerActive = false;
    this.tm = null;
  }

  patchThreadBlockGlowInFrame(thread, profiler) {
    if (!thread) return;

    const desc = Object.getOwnPropertyDescriptor(thread, "blockGlowInFrame");

    // already patched?
    if (desc && typeof desc.set === "function" && desc.set.__profilerPatched) return;

    Object.defineProperty(thread, "blockGlowInFrame", {
      get() { return this._blockGlowInFrame; },
      set(v) {
        profiler.profilerActive = true;
        this._blockGlowInFrame = v;
      },
      configurable: true
    });
    Object.getOwnPropertyDescriptor(thread, "blockGlowInFrame").set.__profilerPatched = true;
  }

  polluteStepThread(vm) {
    this.config.isStepThreadPolluted = true;
    this.vm = vm;
    this.originalStepThread = vm.runtime.sequencer.stepThread;
    const profiler = this;

    /*
    Execute() is called once per line of scratch code to evaluate recursively every block in that line.
    We aim to start our timer just before execute is called, and then stop it the next time execute is called.
    Ideally we'd just wrap execute() with a function that calls profile(),
    however without access to execute() we can't just wrap it, so we need to be creative in how we hook our code in.

    The key idea is that there are two properties that are got/set just before and after execute() that we can use.
    - runtime.profiler is got once before execute() so we start the profiler here. We then set profiling to inactive to prevent triggering during execute
      https://github.com/scratchfoundation/scratch-vm/blob/b3266a0cfe5122f20b72ccd738a3dd4dff4fc5a5/src/engine/sequencer.js#L201
    - mainthread.blockGlowInFrame is set once after execute() so we use this to set profiler back to active priming for next loop
      https://github.com/scratchfoundation/scratch-vm/blob/b3266a0cfe5122f20b72ccd738a3dd4dff4fc5a5/src/engine/sequencer.js#L214

    Since there are many points in runtime and execute where runtime.profiler is got, we must make sure to have profiler start inactive and only become active inside stepThread.
    StepThread will run a while loop of block execution and the key is to have the profiler active just before execute, inactive during and reactivate after.

    we only start timers in profile() and we don't end them in blockGlowInFrame because we want to measure the full time from one block to the other.
    After profile starts the new timer it will end the previous one.
    */

    this.originalProfilerDescriptor = Object.getOwnPropertyDescriptor(vm.runtime, "profiler");
    Object.defineProperty(vm.runtime, "profiler", {
      get() {
        if (profiler.profilerActive) profiler.profile();
        return null;
      },
    });

    vm.runtime.sequencer.stepThread = function (...args) {
      profiler.thread = this.activeThread;
      profiler.patchThreadBlockGlowInFrame(profiler.thread, profiler);

      profiler.profilerActive = true; // set to active here before the stepThread so that our first profile() will get called just before execute
      const result = profiler.originalStepThread.apply(this, args);
      profiler.profilerActive = false;

      if (profiler.currentBlock !== null) profiler.tm.stopTimer(profiler.currentBlock); // stop timer at end of thread to end any timers that are still open.
      profiler.currentBlock = null;

      return result;
    };
  }

  /*
  Cleanup to prevent VM crashes when single-step debugger also hooks blockGlowInFrame.
  Store original state, make properties configurable, restore on cleanup.
  */
  unpolluteStepThread() {
    if (!this.config.isStepThreadPolluted) return;

    this.profilerActive = false;
    this.vm.runtime.sequencer.stepThread = this.originalStepThread;

    if (this.originalProfilerDescriptor) {
      Object.defineProperty(this.vm.runtime, "profiler", this.originalProfilerDescriptor);
    } else {
      delete this.vm.runtime.profiler;
    }

    // technically we should be unpolluting every thread that we polluted whilst running the debugger to remove the block blockGlowInFrame property definition change,
    // but this doesn't cause a conflict with the stepThreading, and the next time you click green flag you'll get all new threads,
    // so we're going to be lazy and not unpollute the instance

    this.config.isStepThreadPolluted = false;
  }

  profile() {
    this.profilerActive = false;  // set to false so that it won't be triggered during execute (which contains a profile get)

    const blockId = this.thread.peekStack();
    if (blockId === null || this.thread.blockContainer._blocks[blockId]?.isMonitored === true) return;

    if (this.config.showLineByLine) this.tm.startTimer(blockId, this.thread.target.id, blockId);

    if (this.config.showLineByLine && this.currentBlock !== null) this.tm.stopTimer(this.currentBlock);

    this.currentBlock = blockId;
  }
}

export default Profiler;
