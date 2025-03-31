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
    const originalStepThread = vm.runtime.sequencer.stepThread;
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

    Object.defineProperty(vm.runtime, "profiler", {
      get() {
        if (profiler.profilerActive) profiler.profile();
        return null;
      },
    });

    vm.runtime.sequencer.stepThread = function (...args) {
      if (!propSet) {
        // we define the property inside stepThread because initially there isn't an activeThread for us to use.
        Object.defineProperty(Object.getPrototypeOf(this.activeThread), "blockGlowInFrame", {
          set(value) {
            profiler.profilerActive = true;
            this._blockGlowInFrame = value;
          },
        });
        propSet = true;
      }

      profiler.profilerActive = true;
      profiler.thread = this.activeThread;

      const result = originalStepThread.apply(this, args);

      profiler.profilerActive = false;
      if (profiler.currentBlock !== null) profiler.tm.stopTimer(profiler.currentBlock);
      profiler.currentBlock = null;

      return result;
    };
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
