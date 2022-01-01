import { onPauseChanged, isPaused, onSingleStepped } from "./module.js";

const removeAllChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export default async function createThreadsTab ({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const tab = debug.createHeaderTab({
    text: msg("tab-threads"),
    icon: addon.self.dir + "/icons/threads.svg"
  });

  const content = Object.assign(document.createElement("div"), {
    className: "logs",
  });

  const updateContent = (scrollToRunning = false) => {
    removeAllChildren(content);
    if (isPaused()) {
      var addedThreads = [];
      const runningBlockId = getRunningBlock();
      var runningBlockElement;

      const createThreadElement = (thread, idx, iconUrl) => {
        const element = document.createElement("div");
        const subelements = Object.assign(document.createElement("div"), {
          className: "subthread",
        });

        const threadInfo = Object.assign(document.createElement("div"), {
          className: "log",
        });
        if (iconUrl) {
          const icon = document.createElement("img");
          icon.src = addon.self.dir + iconUrl;
          icon.className = "logIcon";
          threadInfo.append(icon);
        }
        const threadTitle = document.createElement("span");
        threadTitle.append(Object.assign(document.createElement("b"), { innerText: thread.target.getName() }));
        threadTitle.append(
          Object.assign(document.createElement("span"), { innerText: " " + msg("thread", { threadNum: idx }) })
        );
        threadInfo.append(threadTitle);
        element.append(threadInfo);

        const createThreadBlockElement = (blockId, stackFrame, iconUrl) => {
          const block = thread.target.blocks.getBlock(blockId);

          var name, colour;
          if (block)
            if (block.opcode == "procedures_call") {
              colour = ScratchBlocks.Colours.more.primary;
              if (block.mutation) {
                name = block.mutation.proccode.replaceAll("%s", "()").replaceAll("%b", "()");
                const customBlock = addon.tab.getCustomBlock(block.mutation.proccode);
                if (customBlock) {
                  colour = customBlock.color;
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
                colour = ScratchBlocks.Colours[category];
                if (!colour) {
                  colour = ScratchBlocks.Colours.pen;
                }
              } else {
                colour = { primary: "#979797" }
              }
              if (colour) colour = colour.primary;

              // Calling `new Block` above adds it to two lists in the workspace.
              // So we remove it from them again.
              delete workspace.blockDB_["debugger-temp"];
              workspace.topBlocks_.pop();

              ScratchBlocks.Events.disabled_ = 0; // Re-enable events
            }

          if (!name) {
            name = "?";
          }

          const blockContainer = document.createElement("div");
          const blockDiv = Object.assign(document.createElement("div"), {
            className: "log",
          });

          const blockTitle = Object.assign(document.createElement("span"), {
            innerText: name,
          });

          if (colour) {
            blockTitle.style.backgroundColor = colour;
            blockDiv.className += " block-log";
            blockTitle.className = "console-block";
          }

          if (runningBlockId && runningBlockId === blockId) {
            blockDiv.className += " block-log-running";
            runningBlockElement = blockContainer;
          }

          if (iconUrl) {
            const icon = document.createElement("img");
            icon.src = addon.self.dir + iconUrl;
            icon.className = "logIcon";
            blockContainer.append(icon);
          }
          const blockLink = document.createElement("a");
          blockLink.textContent = thread.target.isOriginal
            ? thread.target.getName()
            : msg("clone-of", {
              spriteName: thread.target.getName(),
            });
          blockLink.className = "logLink";
          blockLink.dataset.blockId = blockId;
          blockLink.dataset.targetId = thread.target.id;
          if (!thread.target.isOriginal) {
            blockLink.dataset.isClone = "true";
          }
          blockDiv.append(blockTitle, blockLink);
          blockContainer.append(blockDiv);

          if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.startedThreads) {
            for (const thread of stackFrame.executionContext.startedThreads) {
              addedThreads.push(thread);
              blockContainer.append(
                createThreadElement(
                  thread,
                  idx + "." + (stackFrame.executionContext.startedThreads.indexOf(thread) + 1),
                  "/icons/subthread.svg"
                )
              );
            }
          }
          return blockContainer;
        }

        subelements.append(createThreadBlockElement(thread.topBlock));
        for (var i = 0; i < thread.stack.length; i++) {
          if (!(thread.stack[i] == thread.topBlock && i == 0))
            subelements.append(createThreadBlockElement(thread.stack[i], thread.stackFrames[i]));
        }

        element.append(subelements);

        return element;
      }

      for (const thread of vm.runtime.threads) {
        // thread.updateMonitor is for threads that update monitors. We don't want to show these.
        // https://github.com/LLK/scratch-vm/blob/b3afd407f12630b1d27c4edadfa5ec4b5e1c820d/src/engine/runtime.js#L1717
        if (!thread.updateMonitor && !addedThreads.includes(thread)) {
          addedThreads.push(thread);
          content.append(createThreadElement(thread, vm.runtime.threads.indexOf(thread) + 1));
        }
      }

      if (runningBlockElement && scrollToRunning) {
        runningBlockElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      if (vm.runtime.threads.length === 0) {
        content.append(Object.assign(document.createElement("span"), {
          className: "thread-info",
          innerText: msg("threads-none-running"),
        }));
      }
    } else {
      content.append(Object.assign(document.createElement("span"), {
        className: "thread-info",
        innerText: msg("threads-pause"),
      }));
    }
  };

  const stepButton = debug.createHeaderButton({
    text: msg("step"),
    icon: addon.self.dir + "/icons/step.svg",
    description: msg("step-desc")
  });
  stepButton.element.addEventListener("click", () => {
    singleStep();
    updateContent();
  });

  const pauseChanged = (paused) => {
    stepButton.element.style.display = paused ? "" : 'none';
    updateContent();
  };
  pauseChanged(isPaused());
  onPauseChanged(pauseChanged);

  onSingleStepped(() => {
    updateContent(true);
  });

  return {
    tab,
    content,
    buttons: [stepButton]
  };
}
