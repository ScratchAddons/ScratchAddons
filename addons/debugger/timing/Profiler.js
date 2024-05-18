class Profiler {
  constructor(config) {
    this.currentBlock = null;
    this.totalRTC = 0;
    this.thread = null;
    this.originalStepThread;
    this.config = config;
    this.rtcCache = new Map();
    this.rtcTable = {};
    this.profilerActive = false;
    this.tm = null;
  }

  polluteStepThread(vm){
    const originalStepThread = vm.runtime.sequencer.stepThread;
    const profiler = this;
    let propSet = false;

    /* the goal is to call profile() just before execute(),
    however without access to execute() we need to be creative in how we hook our code in.
    The key idea is that there are two properties that are got/set just before and after execute() that we can use.
    - runtime.profiler is got once before execute() so we start the timer here
    - thread.blockGlowInFrame is set once after execute() so we use this to avoid checking runtime.profiler more than once.
    */

    Object.defineProperty(vm.runtime, "profiler", {
      get() {
        if (profiler.profilerActive) profiler.profile();
        return null;
      },
    });

    vm.runtime.sequencer.stepThread = function (...args) {
      if(!propSet){
        // we define the property inside stepThread because initially there isn't an activeThread for us to use.
        Object.defineProperty(Object.getPrototypeOf(this.activeThread), "blockGlowInFrame", {
          set(value) {
            profiler.profilerActive = true
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

    vm.runtime.on("PROJECT_CHANGED", profiler.clearRtcCache);
  }

  profile() {
    this.profilerActive = false;

    const blockId = this.thread.peekStack();
    if (blockId === null || this.thread.blockContainer._blocks[blockId]?.isMonitored === true) return;

    if (this.config.showLineByLine) this.tm.startTimer(blockId, this.thread.target.id, blockId);

    if (this.config.showLineByLine && this.currentBlock !== null) this.tm.stopTimer(this.currentBlock);

    if (this.config.showRTC) this.totalRTC += this.getRTCofBlockLine(blockId, this.thread.blockContainer._blocks);

    this.currentBlock = blockId;
  }

  getRTCofBlockLine(rootBlockId, blocks) {
    if (this.rtcCache.has(rootBlockId)) {
      return this.rtcCache.get(rootBlockId);
    }
    const block = blocks[rootBlockId];
    if (block === undefined) return 0;
    const inputs = Object.values(block.inputs);
    const rtc = this.rtcTable[block.opcode];
    let ownRTC = block?.opcode && rtc && rtc !== "" ? rtc : 0;
    const childrenRTC =
      inputs.length !== 0
        ? inputs
            .filter((input) => !input.name.includes("SUBSTACK"))
            .map((input) => this.getRTCofBlockLine(input.block, blocks))
            .reduce((acc, curr) => acc + curr, 0)
        : 0;
    const totalRTC = ownRTC + childrenRTC;
    this.rtcCache.set(rootBlockId, totalRTC);
    return totalRTC;
  }

  clearRtcCache(){
    this.rtcCache.clear()
  }
}

export default Profiler;
