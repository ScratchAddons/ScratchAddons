class Profiler {
  constructor(config) {
    this.currentBlock = null;
    this.thread = null;
    this.config = config;
    this.profilerActive = false;
    this.tm = null;
  }

  polluteStepThread(vm) {
    this.config.isStepThreadPolluted = true;
    this.vm = vm;
    this.originalStepThread = vm.runtime.sequencer.stepThread;
    this.threadPrototype = null;
    this.originalBlockGlowDescriptor = null;
    const profiler = this;
    let propSet = false;

    /*
    Execute() is called once per line of scratch code to evaluate recursively every block in that line.
    We aim to start out timer just before execute is called, and then stop it the next time execute is called.
    Ideally we'd just wrap execute() with a function that calls profile(),
    however without access to execute() we can't just wrap it, so we need to be creative in how we hook our code in.

    The key idea is that there are two properties that are got/set just before and after execute() that we can use.
    - runtime.profiler is got once before execute() so we start the profiler here.
    - manthread.blockGlowInFrame is set once after execute() so we use this to reset runtime.profiler and stop it triggering further
    */

    this.originalProfilerDescriptor = Object.getOwnPropertyDescriptor(vm.runtime, "profiler");
    Object.defineProperty(vm.runtime, "profiler", {
      get() {
        if (profiler.profilerActive) profiler.profile();
        return null;
      },
    });

    vm.runtime.sequencer.stepThread = function (...args) {
      if (!propSet) {
        // we define the property inside stepThread because initially there isn't an activeThread for us to use.
        profiler.threadPrototype = Object.getPrototypeOf(this.activeThread);
        profiler.originalBlockGlowDescriptor = Object.getOwnPropertyDescriptor(
          profiler.threadPrototype,
          "blockGlowInFrame"
        );

        Object.defineProperty(profiler.threadPrototype, "blockGlowInFrame", {
          set(value) {
            profiler.profilerActive = true;
            this._blockGlowInFrame = value;
          },
          configurable: true,
        });
        propSet = true;
      }

      profiler.profilerActive = true;
      profiler.thread = this.activeThread;

      const result = profiler.originalStepThread.apply(this, args);

      profiler.profilerActive = false;
      if (profiler.currentBlock !== null) profiler.tm.stopTimer(profiler.currentBlock);
      profiler.currentBlock = null;

      return result;
    };
  }

  /*
  Cleanup to prevent VM crashes when single-step debugger also hooks blockGlowInFrame.
  Store original state, make properties configurable, restore on cleanup.
  */
  unpollutStepThread() {
    if (!this.config.isStepThreadPolluted) return;

    this.vm.runtime.sequencer.stepThread = this.originalStepThread;

    if (this.originalProfilerDescriptor) {
      Object.defineProperty(this.vm.runtime, "profiler", this.originalProfilerDescriptor);
    } else {
      delete this.vm.runtime.profiler;
    }

    if (this.threadPrototype) {
      if (this.originalBlockGlowDescriptor) {
        Object.defineProperty(this.threadPrototype, "blockGlowInFrame", this.originalBlockGlowDescriptor);
      } else {
        delete this.threadPrototype.blockGlowInFrame;
      }
    }

    this.config.isStepThreadPolluted = false;
  }

  profile() {
    this.profilerActive = false;

    const blockId = this.thread.peekStack();
    if (blockId === null || this.thread.blockContainer._blocks[blockId]?.isMonitored === true) return;

    if (this.config.showLineByLine) this.tm.startTimer(blockId, this.thread.target.id, blockId);

    if (this.config.showLineByLine && this.currentBlock !== null) this.tm.stopTimer(this.currentBlock);

    this.currentBlock = blockId;
  }
}

export default Profiler;
