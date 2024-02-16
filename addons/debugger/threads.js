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

  const tab = debug.createHeaderTab({
    text: msg("tab-threads"),
    icon: addon.self.dir + "/icons/threads.svg",
  });

  const logView = new LogView();
  logView.canAutoScrollToEnd = false;
  logView.outerElement.classList.add("sa-debugger-threads");
  logView.placeholderElement.textContent = msg("no-threads-running");

  const highlighter = new Highlighter(10, "#ff0000");

  logView.generateRow = (row) => {
    const root = document.createElement("div");
    root.className = "sa-debugger-log";

    const isHeader = row.type === "thread-header";
    const indenter = document.createElement("div");
    indenter.className = "sa-debugger-thread-indent";
    indenter.style.setProperty("--level", isHeader ? row.depth : row.depth + 1);
    root.appendChild(indenter);

    if (isHeader) {
      root.classList.add("sa-debugger-thread-title");

      if (row.depth > 0) {
        const icon = document.createElement("div");
        icon.className = "sa-debugger-log-icon";
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
      const preview = debug.createBlockPreview(row.targetId, row.blockId);
      if (preview) {
        root.appendChild(preview);
      }
    }

    if (row.targetId && row.blockId) {
      root.appendChild(debug.createBlockLink(debug.getTargetInfoById(row.targetId), row.blockId));
    }

    return {
      root,
    };
  };

  logView.renderRow = (elements, row) => {
    const { root } = elements;
    root.classList.toggle("sa-debugger-thread-running", !!row.running);
  };

  let threadInfoCache = new WeakMap();

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
    const runningThread = getRunningThread();

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

      const createBlockInfo = (block, stackFrameIdx) => {
        const blockId = block.id;
        if (!block) return;

        const stackFrame = thread.stackFrames[stackFrameIdx];

        if (!cacheInfo.blockCache.has(block)) {
          cacheInfo.blockCache.set(block, {});
        }

        const blockInfoMap = cacheInfo.blockCache.get(block);
        let blockInfo = blockInfoMap[stackFrameIdx];

        if (!blockInfo) {
          blockInfo = blockInfoMap[stackFrameIdx] = {
            type: "thread-stack",
            depth,
            targetId: target.id,
            blockId,
          };
        }

        blockInfo.running =
          thread === runningThread &&
          blockId === runningThread.peekStack() &&
          stackFrameIdx === runningThread.stackFrames.length - 1;

        const result = [blockInfo];
        if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.startedThreads) {
          for (const thread of stackFrame.executionContext.startedThreads) {
            concatInPlace(result, createThreadInfo(thread, depth + 1));
          }
        }

        return result;
      };

      const topBlock = debug.getBlock(thread.target, thread.topBlock);
      const result = [cacheInfo.headerItem];
      if (topBlock) {
        concatInPlace(result, createBlockInfo(topBlock, 0));
        for (let i = 0; i < thread.stack.length; i++) {
          const blockId = thread.stack[i];
          if (blockId === topBlock.id) continue;
          const block = debug.getBlock(thread.target, blockId);
          if (block) {
            concatInPlace(result, createBlockInfo(block, i));
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
      highlighter.setGlowingThreads([runningThread]);
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

  onSingleStep(() => {
    updateContent();
    queueMicrotask(() => {
      const runningIndex = logView.rows.findIndex((i) => i.running);
      if (runningIndex !== -1 && !logView.isInView(runningIndex, logView.rowHeight)) {
        // Try to show the entire thread if we can fit it on screen
        let found = false;
        const maxScrollback = Math.floor(logView.height / logView.rowHeight);
        for (let i = 1; i < maxScrollback; i++) {
          const checkIndex = runningIndex - i;
          if (logView.rows[checkIndex].type === "thread-header") {
            logView.scrollTo(checkIndex);
            found = true;
            break;
          }
        }

        if (!found) {
          // We somehow couldn't find the header or the stack is too big for us to show the header
          // and the current stack item at the same time. Settle for showing as much of the stack
          // as we can while also leaving some room on the bottom for the stack to grow.
          logView.scrollTo(Math.max(0, runningIndex - maxScrollback + 5));
        }
      }
    });
  });

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
