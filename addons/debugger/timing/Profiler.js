class Profiler {
  constructor(vm, timingManager, config) {
    this.currentBlock = null;
    this.totalRTC = 0;
    this.thread = null;
    this.vm = vm;
    this.originalStepThread;
    this.tm = timingManager;
    this.config = config;
    this.rtcCache = new Map();
    this.rtcTable = {};
  }

  // to avoid an error, we mock "idByName" and "frame"
  idByName() {
    return 0;
  }
  frame() {
    return 0;
  }

  polluteStepThread() {
    const profiler = this;
    this.originalStepThread = this.vm.runtime.sequencer.stepThread;
    this.vm.runtime.sequencer.stepThread = function (...args) {
      this.runtime.profiler = profiler;
      profiler.thread = this.activeThread;
      const result = profiler.originalStepThread.apply(this, args);

      if (profiler.currentBlock !== null) profiler.tm.stopTimer(profiler.currentBlock);
      profiler.currentBlock = null;
      this.runtime.profiler = null;

      return result;
    };

    this.vm.runtime.on("PROJECT_CHANGED", () => this.rtcCache.clear());
  }

  increment() {
    const blockId = this.thread.peekStack();
    if (this.thread.blockContainer._blocks[blockId]?.isMonitored === true) return;

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
}

export default Profiler;
