import { onPauseChanged, isPaused, setPauseStartedHats, getRealStatus } from "../pause/module.js";
import LogView from './log-view.js';

const areArraysEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

const concatInPlace = (copyInto, copyFrom) => {
  for (const i of copyFrom) {
    copyInto.push(i);
  }
};

// https://github.com/LLK/scratch-vm/blob/bb352913b57991713a5ccf0b611fda91056e14ec/src/engine/thread.js#L198
const STATUS_RUNNING = 0;
const STATUS_PROMISE_WAIT = 1;
const STATUS_YIELD = 2;
const STATUS_YIELD_TICK = 3;
const STATUS_DONE = 4;

export default async function createThreadsTab ({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const tab = debug.createHeaderTab({
    text: msg("tab-threads"),
    icon: addon.self.dir + "/icons/threads.svg"
  });

  const logView = new LogView({ addon, msg });
  logView.canAutoScrollToEnd = false;
  logView.outerElement.classList.add('sa-debugger-threads');

  const allThreadIds = new WeakMap();
  let nextThreadId = 1;

  logView.buildDOM = (log) => {
    const INDENT = 16;

    const element = document.createElement('div');
    element.className = 'sa-debugger-log';

    if (log.type === 'thread-header') {
      if (log.depth > 0) {
        const icon = document.createElement('div');
        icon.className = 'sa-debugger-log-icon';
        icon.style.marginLeft = `${log.depth * INDENT}px`;
        element.appendChild(icon);
      }

      const name = document.createElement('div');
      name.textContent = log.targetName;
      name.className = 'sa-debugger-thread-target-name';
      element.appendChild(name);

      const id = document.createElement('div');
      id.className = 'sa-debugger-thread-id';
      id.textContent = msg("thread", {
        id: log.id
      });
      element.appendChild(id);
    }

    if (log.type === 'thread-stack') {
      const block = document.createElement('div');
      block.textContent = log.name;
      block.className = 'sa-debugger-stacked-block';
      block.style.backgroundColor = log.color;
      block.style.marginLeft = `${(log.depth + 1) * INDENT}px`;
      element.appendChild(block);
    }

    if (log.running) {
      element.classList.add('sa-debugger-thread-running');
    }

    if (log.targetId && log.blockId) {
      element.appendChild(debug.createBlockLink(log.targetId, log.blockId));
    }

    return element;
  }

  let threadInfoCache = new WeakMap();
  let previousContent = [];

  const getBlockInfo = (block) => {
    var name, color;
    if (block)
      if (block.opcode == "procedures_call") {
        color = ScratchBlocks.Colours.more.primary;
        if (block.mutation) {
          name = block.mutation.proccode.replaceAll("%s", "()").replaceAll("%b", "()");
          const customBlock = addon.tab.getCustomBlock(block.mutation.proccode);
          if (customBlock) {
            color = customBlock.color;
          }
        }
      } else {
        // This quickly creates a Blockly block so we can get its name, than removes it again.
        const workspace = Blockly.getMainWorkspace();

        ScratchBlocks.Events.disabled_ = 1; // We disable events to the block isn't added to the DOM

        // https://github.com/LLK/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/core/block.js#L52
        var blocklyBlock = new ScratchBlocks.Block(workspace, block.opcode, "debugger-temp");

        name = blocklyBlock.toLocaleString().replaceAll("?", "()");

        var category = blocklyBlock.getCategory();
        if (category == "data-lists") category = "data_lists";
        if (category == "events") category = "event"; // ST why?
        if (category) {
          color = ScratchBlocks.Colours[category];
          if (!color) {
            color = ScratchBlocks.Colours.pen;
          }
        } else {
          color = { primary: "#979797" }
        }
        if (color) color = color.primary;

        // Calling `new Block` above adds it to two lists in the workspace.
        // So we remove it from them again.
        delete workspace.blockDB_["debugger-temp"];
        workspace.topBlocks_.pop();

        ScratchBlocks.Events.disabled_ = 0; // Re-enable events
      }

    if (!name) {
      name = "?";
    }

    return {
      name,
      color
    };
  };

  const updateContent = (runningBlockId) => {
    if (!logView.visible) {
      return;
    }

    const newContent = [];
    const threads = vm.runtime.threads;
    const visitedThreads = new Set();

    const createThreadInfo = (thread, depth) => {
      if (visitedThreads.has(thread)) {
        return [];
      }
      visitedThreads.add(thread);

      if (!allThreadIds.has(thread)) {
        allThreadIds.set(thread, nextThreadId++);
      }
      const id = allThreadIds.get(thread);

      const target = thread.target;

      if (!threadInfoCache.has(thread)) {
        threadInfoCache.set(thread, {
          headerItem: {
            type: 'thread-header',
            depth,
            targetName: target.getName(),
            id
          },
          blockCache: new WeakMap()
        });
      }
      const cacheInfo = threadInfoCache.get(thread);

      const createBlockInfo = (blockId, stackFrame) => {
        const block = thread.target.blocks.getBlock(blockId);
        if (!cacheInfo.blockCache.has(block)) {
          const {name, color} = getBlockInfo(block);
          cacheInfo.blockCache.set(block, {
            type: 'thread-stack',
            depth,
            name,
            color,
            targetId: target.id,
            blockId
          });
        }

        const blockInfo = cacheInfo.blockCache.get(block);
        if (runningBlockId) {
          if (blockId === runningBlockId) {
            blockInfo.running = true;
          } else {
            blockInfo.running = false;
          }
        }

        const result = [blockInfo];
        if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.startedThreads) {
          for (const thread of stackFrame.executionContext.startedThreads) {
            concatInPlace(result, createThreadInfo(thread, depth + 1));
          }
        }

        return result;
      };

      const topBlock = thread.topBlock;
      const result = [
        cacheInfo.headerItem
      ];
      concatInPlace(result, createBlockInfo(topBlock, null));
      for (let i = 0; i < thread.stack.length; i++) {
        const blockId = thread.stack[i];
        if (blockId === topBlock) continue;
        const stackFrame = thread.stackFrames[i];
        concatInPlace(result, createBlockInfo(blockId, stackFrame));
      }

      return result;
    };

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      // Do not display threads used to update variable and list monitors.
      if (thread.updateMonitor) {
        continue;
      }
      concatInPlace(newContent, createThreadInfo(thread, 0));
    }

    if (!areArraysEqual(newContent, previousContent)) {
      logView.logs = newContent;
      logView.invalidateAllLogDOM();
      logView.queueUpdateContent();
    }
    previousContent = newContent;
  };

  debug.addAfterStepCallback(() => {
    updateContent();
  });

  const stepButton = debug.createHeaderButton({
    text: msg("step"),
    icon: addon.self.dir + "/icons/step.svg",
    description: msg("step-desc")
  });
  stepButton.element.addEventListener("click", () => {
    singleStep();
  });

  let singleSteppingThread = null;
  // Value of magicError doesn't matter as long as it's a unique object
  const magicError = ['special error used by Scratch Addons for implementing single-stepping'];
  const fakeProfiler = {
    idByName: () => {
      throw magicError;
    }
  };

  const singleStepThread = (thread) => {
    const sequencer = vm.runtime.sequencer;

    // This is the worst code you have ever seen.
    // Basically, we want to run vm.runtime.sequencer.stepThread.
    // (https://github.com/LLK/scratch-vm/blob/701dd5091341b51328fec26fb121c9959f856cc3/src/engine/sequencer.js#L179)
    // However, we want stepThread's inner loop to terminate after at most 1 iteration so that the block only steps
    // once, but there is no easy way to do that. So, instead, you get this absolute disaster.

    // Here's an annotated version of the important parts of that function:
    /*
      let currentBlockId = thread.peekStack();
      if (!currentBlockId) {} // ...

      // This is the loop we only want to run once
      while ((currentBlockId = thread.peekStack())) {
        // ...

        // We trap profiler to be !== null so that this code runs.
        if (this.runtime.profiler !== null) {
          if (executeProfilerId === -1) {
            // We trap idByName to throw an error so that the loop aborts before executing another block.
            executeProfilerId = this.runtime.profiler.idByName(executeProfilerFrame);
          }
          this.runtime.profiler.increment(executeProfilerId);
        }

        // This is the bit that actually runs the blocks.
        if (thread.target === null) {
          this.retireThread(thread);
        } else {
          execute(this, thread);
        }

        // We are able to trap this setter.
        thread.blockGlowInFrame = currentBlockId;

        if (thread.status === Thread.STATUS_YIELD) return; // ...
        } else if (thread.status === Thread.STATUS_PROMISE_WAIT) return; // ...
        } else if (thread.status === Thread.STATUS_YIELD_TICK) return; // ...

        // This section must run as it will set the stack up so that the block has something to do
        // on the next step.
        if (thread.peekStack() === currentBlockId) {} // ...
        while (!thread.peekStack()) {} // ...
      }
    */

    let newBlockGlowInFrame = thread.blockGlowInFrame;
    Object.defineProperty(thread, 'blockGlowInFrame', {
      get: () => newBlockGlowInFrame,
      set: (value) => {
        newBlockGlowInFrame = value;
        vm.runtime.profiler = fakeProfiler;
      },
      configurable: true,
      enumerable: true
    });

    const oldStatus = Object.getOwnPropertyDescriptor(thread, 'status');
    Object.defineProperty(thread, 'status', {
      value: 0,
      writable: true,
      enumerable: true,
      configurable: true
    });

    setPauseStartedHats(true);

    try {
      sequencer.stepThread(thread);
    } catch (e) {
      if (e !== magicError) throw e;
    } finally {
      setPauseStartedHats(false);
      Object.defineProperty(thread, 'blockGlowInFrame', {
        value: newBlockGlowInFrame,
        configurable: true,
        enumerable: true,
        writable: true
      });

      // this little mess will let the pause module know what happened
      const newStatus = thread.status;
      Object.defineProperty(thread, 'status', oldStatus);
      thread.status = newStatus;

      vm.runtime.profiler = null;
    }
  };

  const findNewSingleSteppingThread = (startIndex) => {
    const threads = vm.runtime.threads;
    for (let i = startIndex; i < threads.length; i++) {
      const thread = threads[i];
      const status = getRealStatus(thread);
      if (status === STATUS_RUNNING || status === STATUS_YIELD || status === STATUS_YIELD_TICK) {
        console.log('Switched to', thread);
        return thread;
      }
    }
    return null;
  };

  const singleStep = () => {
    if (!singleSteppingThread) {
      singleSteppingThread = findNewSingleSteppingThread(0);
    }
    if (!singleSteppingThread) {
      return;
    }

    singleStepThread(singleSteppingThread);

    const status = getRealStatus(singleSteppingThread);
    if (status !== STATUS_RUNNING && status !== STATUS_YIELD) {
      const index = vm.runtime.threads.indexOf(singleSteppingThread);
      singleSteppingThread = findNewSingleSteppingThread(index + 1);
    }
    if (!singleSteppingThread) {
      singleSteppingThread = findNewSingleSteppingThread(0);
    }

    threadInfoCache = new WeakMap();
    updateContent(singleSteppingThread ? singleSteppingThread.peekStack() : null);
    const runningBlockIndex = logView.logs.findIndex((i) => i.running);
    if (runningBlockIndex !== -1) {
      logView.scrollIntoView(runningBlockIndex);
    }
  }

  const handlePauseChanged = (paused) => {
    stepButton.element.style.display = paused ? "" : 'none';
    updateContent();

    if (paused) {
      singleSteppingThread = vm.runtime.sequencer.activeThread;
    }
  };
  handlePauseChanged(isPaused());
  onPauseChanged(handlePauseChanged);

  const show = () => {
    logView.show();
    updateContent();
  };
  const hide = () => {
    logView.hide();
  };

  return {
    tab,
    content: logView.outerElement,
    buttons: [stepButton],
    show,
    hide
  };
}
