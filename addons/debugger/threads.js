import { onPauseChanged, isPaused, singleStep, onSingleStep, getRunningThread } from "./module.js";
import LogView from "./log-view.js";
import Highlighter from "../editor-stepping/highlighter.js";

const concatInPlace = (copyInto, copyFrom) => {
  for (const i of copyFrom) {
    copyInto.push(i);
  }
};

export default async function createThreadsTab({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const tab = debug.createHeaderTab({
    text: msg("tab-threads"),
    icon: addon.self.dir + "/icons/threads.svg",
  });

  const logView = new LogView();
  logView.canAutoScrollToEnd = false;
  logView.outerElement.classList.add("sa-debugger-threads");
  logView.placeholderElement.textContent = msg("no-threads-running");

  const highlighter = new Highlighter("#ff0000");

  logView.generateRow = (row) => {
    const INDENT = 16;

    const root = document.createElement("div");
    root.className = "sa-debugger-log";

    if (row.type === "thread-header") {
      if (row.depth > 0) {
        const icon = document.createElement("div");
        icon.className = "sa-debugger-log-icon";
        icon.style.marginLeft = `${row.depth * INDENT}px`;
        root.appendChild(icon);
      }

      const name = document.createElement("div");
      name.textContent = row.targetName;
      name.className = "sa-debugger-thread-target-name";
      root.appendChild(name);

      const id = document.createElement("div");
      id.className = "sa-debugger-thread-id";
      id.textContent = msg("thread", {
        id: row.id,
      });
      root.appendChild(id);
    }

    if (row.type === "thread-stack") {
      const block = document.createElement("div");
      block.textContent = row.name;
      block.className = "sa-debugger-stacked-block";
      block.style.backgroundColor = row.color;
      block.style.marginLeft = `${(row.depth + 1) * INDENT}px`;
      root.appendChild(block);
    }

    if (row.targetId && row.blockId) {
      root.appendChild(debug.createBlockLink(row.targetId, row.blockId));
    }

    return {
      root
    };
  };

  logView.renderRow = (elements, row) => {
    const {root} = elements;
    root.classList.toggle("sa-debugger-thread-running", !!row.running);
  };

  let threadInfoCache = new WeakMap();

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
          color = { primary: "#979797" };
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
      color,
    };
  };

  const allThreadIds = new WeakMap();
  let nextThreadId = 1;
  const getThreadId = (thread) => {
    if (!allThreadIds.has(thread)) {
      allThreadIds.set(thread, nextThreadId++);
    }
    return allThreadIds.get(thread);
  };

  const updateContent = () => {
    if (!logView.visible) {
      return;
    }

    const newRows = [];
    const threads = vm.runtime.threads;
    const visitedThreads = new Set();

    const createThreadInfo = (thread, depth) => {
      if (visitedThreads.has(thread)) {
        return [];
      }
      visitedThreads.add(thread);

      const id = getThreadId(thread);
      const target = thread.target;

      if (!threadInfoCache.has(thread)) {
        threadInfoCache.set(thread, {
          headerItem: {
            type: "thread-header",
            depth,
            targetName: target.getName(),
            id,
          },
          blockCache: new WeakMap(),
        });
      }
      const cacheInfo = threadInfoCache.get(thread);

      const runningThread = getRunningThread();
      const createBlockInfo = (block, stackFrame) => {
        const blockId = block.id;
        if (!block) return;

        if (!cacheInfo.blockCache.has(block)) {
          const { name, color } = getBlockInfo(block);
          cacheInfo.blockCache.set(block, {
            type: "thread-stack",
            depth,
            name,
            color,
            targetId: target.id,
            blockId,
          });
        }

        const blockInfo = cacheInfo.blockCache.get(block);
        blockInfo.running = thread === runningThread && blockId === runningThread.peekStack();

        const result = [blockInfo];
        if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.startedThreads) {
          for (const thread of stackFrame.executionContext.startedThreads) {
            concatInPlace(result, createThreadInfo(thread, depth + 1));
          }
        }

        return result;
      };

      const topBlock = thread.target.blocks.getBlock(thread.topBlock);
      const result = [cacheInfo.headerItem];
      if (topBlock) {
        concatInPlace(result, createBlockInfo(topBlock, null));
        for (let i = 0; i < thread.stack.length; i++) {
          const blockId = thread.stack[i];
          if (blockId === topBlock) continue;
          const stackFrame = thread.stackFrames[i];
          const block = thread.target.blocks.getBlock(blockId);
          if (block) {
            concatInPlace(result, createBlockInfo(block, stackFrame));
          }
        }
      }

      return result;
    };

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      // Do not display threads used to update variable and list monitors.
      if (thread.updateMonitor) {
        continue;
      }
      concatInPlace(newRows, createThreadInfo(thread, 0));
    }

    logView.rows = newRows;
    logView.queueUpdateContent();
  };

  debug.addAfterStepCallback(() => {
    updateContent();

    const runningThread = getRunningThread();
    if (runningThread) {
      highlighter.setGlowingThreads([runningThread])
    } else {
      highlighter.setGlowingThreads([]);
    }
  });

  const stepButton = debug.createHeaderButton({
    text: msg("step"),
    icon: addon.self.dir + "/icons/step.svg",
    description: msg("step-desc"),
  });
  stepButton.element.addEventListener("click", () => {
    singleStep();
  });

  const handlePauseChanged = (paused) => {
    stepButton.element.style.display = paused ? "" : "none";
    updateContent();
  };
  handlePauseChanged(isPaused());
  onPauseChanged(handlePauseChanged);

  onSingleStep(updateContent);

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
    hide,
  };
}
