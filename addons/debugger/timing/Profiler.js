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

    vm.runtime.on("PROJECT_CHANGED", () => profiler.clearRtcCache());
  }

  profile() {
    this.profilerActive = false;

    const blockId = this.thread.peekStack();
    if (blockId === null || this.thread.blockContainer._blocks[blockId]?.isMonitored === true) return;

    if (this.config.showLineByLine) this.tm.startTimer(blockId, this.thread.target.id, blockId);

    if (this.config.showLineByLine && this.currentBlock !== null) this.tm.stopTimer(this.currentBlock);

    if (this.config.showRTC)
      this.totalRTC += this.getRTCofBlockLine(blockId, this.thread.blockContainer._blocks, this.thread.target);

    this.currentBlock = blockId;
  }

  getN(block, variables) {
    if ("LIST" in block.fields) {
      // if the block has a LIST field return the length of the list in that field
      return variables[block.fields.LIST.id].value.length;
    } else if (block.inputs.length) {
      // this block is almost certainly string contains but unfortunately there's no way to get the reported value of just the elements inside this string
      // instead we'll just pretend the reported string was length 10
      return 10;
    }
    // something has gone wrong as all O(n) blocks have either a LIST field or an input field.
    // If 0 is returned, the RTC table is likely formatted wrong, and needs fixing.
    return 0;
  }

  getRTCofBlockLine(rootBlockId, blocks, target) {
    if (this.rtcCache.has(rootBlockId)) {
      return this.rtcCache.get(rootBlockId);
    }
    const block = blocks[rootBlockId];
    if (block === undefined) return 0;
    const inputs = Object.values(block.inputs);
    const fields = Object.values(block.fields);
    const fieldKeys = Object.keys(block.fields);
    let field =
      fields.length && ["EFFECT", "OPERATOR"].includes(fieldKeys[0]) ? ":" + fields[0].value.toLowerCase() : "";

    if (block.opcode == "pen_stamp") {
      // if the block is stamp then RTC depends on whether we are stamping bitmap or vector
      field = target.sprite.costumes[target.currentCostume].dataFormat == "svg" ? ":vector" : ":bitmap";
    }
    let rtc = this.rtcTable[block.opcode + field];

    // If RTC is given by two values in the table then the operation has O(n) time complexity and depends on the string/list length
    const input_dependent = Array.isArray(rtc);
    rtc = input_dependent ? rtc[1] + rtc[0] * this.getN(block, variables) : rtc;
    let ownRTC = block?.opcode && rtc && rtc != "N/A" ? rtc : 0;
    const childrenRTC =
      inputs.length !== 0
        ? inputs
            .filter((input) => !input.name.includes("SUBSTACK"))
            .map((input) => this.getRTCofBlockLine(input.block, blocks, target))
            .reduce((acc, curr) => acc + curr, 0)
        : 0;
    const totalRTC = ownRTC + childrenRTC;

    // If the RTC is independent of the input then it never changes and we can cache it
    const input_dependent = Array.isArray(rtc) || block.opcode == "pen_stamp";
    if (!input_dependent) this.rtcCache.set(rootBlockId, totalRTC);

    return totalRTC;
  }

  clearRtcCache() {
    this.rtcCache.clear();
  }
}

export default Profiler;
