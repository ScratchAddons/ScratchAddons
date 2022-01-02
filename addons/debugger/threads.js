import { onPauseChanged, isPaused, onSingleStepped, getRunningBlock, singleStep } from "./module.js";
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

      const index = document.createElement('div');
      index.className = 'sa-debugger-thread-index';
      index.textContent = msg("thread", {
        threadNum: log.index
      });
      element.appendChild(index);
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

      const index = threads.indexOf(thread);

      const result = [];
      const target = thread.target;

      if (!threadInfoCache.has(thread)) {
        threadInfoCache.set(thread, {
          headerItem: {
            type: 'thread-header',
            depth,
            targetName: target.getName(),
            index: index + 1
          },
          blockCache: new WeakMap()
        });
      }
      const cacheInfo = threadInfoCache.get(thread);
      result.push(cacheInfo.headerItem);

      const createBlockInfo = (blockId, stackFrame) => {
        const block = thread.target.blocks.getBlock(blockId);
        if (!cacheInfo.blockCache.get(block)) {
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

      for (let i = 0; i < thread.stack.length; i++) {
        const blockId = thread.stack[i];
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

  onSingleStepped(() => {
    threadInfoCache = new WeakMap();
    updateContent(getRunningBlock());
    const runningBlockIndex = logView.logs.findIndex((i) => i.running);
    if (runningBlockIndex !== -1) {
      logView.scrollIntoView(runningBlockIndex);
    }
  });

  const handlePauseChanged = (paused) => {
    stepButton.element.style.display = paused ? "" : 'none';
    updateContent();
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
