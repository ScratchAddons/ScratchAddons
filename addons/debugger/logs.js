import downloadBlob from "../../libraries/common/cs/download-blob.js";

export default function createLogsTab ({ debug, addon, console, msg }) {
  const tab = debug.createHeaderTab({
    text: msg('tab-logs'),
    icon: addon.self.dir + "/icons/logs.svg"
  });

  const content = Object.assign(document.createElement("div"), {
    className: "logs",
  });

  const exportButton = debug.createHeaderButton({
    text: msg('export'),
    icon: addon.self.dir + "/icons/download-white.svg",
    description: msg('export-desc')
  });
  const downloadText = (filename, text) => {
    downloadBlob(filename, new Blob([text], { type: "text/plain" }));
  };
  exportButton.element.addEventListener("click", (e) => {
    const defaultFormat = "{sprite}: {content} ({type})";
    const exportFormat = e.shiftKey ? prompt(this.msg("enter-format"), defaultFormat) : defaultFormat;
    if (!exportFormat) return;
    const targetInfoCache = Object.create(null);
    // TODO refactor
    let file = logs
      .map(({ targetId, type, content, count }) =>
        (exportFormat.replace(
          /\{(sprite|type|content)\}/g,
          (_, match) =>
          ({
            sprite: getTargetInfo(targetId, targetInfoCache).name,
            type,
            content,
          }[match])
        ) + "\n").repeat(count)
      ).join("");
    downloadText("logs.txt", file);
  });

  const trashButton = debug.createHeaderButton({
    text: msg('clear'),
    icon: addon.self.dir + "/icons/delete.svg"
  });
  trashButton.element.addEventListener("click", () => {
    clearLogs();
  });

  let logs = [];
  let scrollQueued = false;
  let isScrolledToEnd = false;

  const createLogWrapper = (type) => {
    const wrapper = document.createElement("div");
    wrapper.className = "log";
    wrapper.classList.add(type);
    return wrapper;
  };

  const createLogText = (text, count) => {
    const s = document.createElement("span");
    s.innerText = text;
    if (count !== 1) {
      const c = document.createElement("span");
      c.innerText = count;
      c.className = "log-count";
      s.appendChild(c);
    }
    return s;
  };

  // TODO this is way too low???
  const MAX_LOGS = 100;
  const addLog = (text, thread, type, internalLog = false) => {
    const wrapper = createLogWrapper(type);

    if (internalLog) {
      wrapper.className += " internal-log";
    }

    if (logs.length >= MAX_LOGS) {
      logs.shift(1);
      content.children[0].remove();
    }

    content.append(wrapper);
    if (type !== "log") {
      const imageURL = addon.self.dir + (type === "error" ? "/icons/error.svg" : "/icons/warning.svg");
      const icon = document.createElement("img");
      icon.src = imageURL;
      icon.alt = icon.title = msg("icon-" + type);
      icon.className = "logIcon";
      wrapper.appendChild(icon);
    }

    var targetId;

    if (thread) {
      const target = thread.target;
      const blockId = thread.peekStack();
      const parentTarget = target.isOriginal ? target : target.sprite.clones[0];
      targetId = parentTarget.id;
      const block = target.blocks.getBlock(blockId);
      if (block && ScratchBlocks) {
        const inputId = Object.values(block.inputs)[0]?.block;
        const inputBlock = target.blocks.getBlock(inputId);
        if (inputBlock && inputBlock.opcode !== "text") {
          let text, category;
          if (
            inputBlock.opcode === "data_variable" ||
            inputBlock.opcode === "data_listcontents" ||
            inputBlock.opcode === "argument_reporter_string_number" ||
            inputBlock.opcode === "argument_reporter_boolean"
          ) {
            text = Object.values(inputBlock.fields)[0].value;
            if (inputBlock.opcode === "data_variable") {
              category = "data";
            } else if (inputBlock.opcode === "data_listcontents") {
              category = "list";
            } else {
              category = "more";
            }
          } else {
            // Try to call things like https://github.com/LLK/scratch-blocks/blob/develop/blocks_vertical/operators.js
            let jsonData;
            const fakeBlock = {
              jsonInit(data) {
                jsonData = data;
              },
            };
            const blockConstructor = ScratchBlocks.Blocks[inputBlock.opcode];
            if (blockConstructor) {
              try {
                blockConstructor.init.call(fakeBlock);
              } catch (e) {
                // ignore
              }
            }
            // If the block has a simple message with no arguments, display it
            if (jsonData && jsonData.message0 && !jsonData.args0) {
              text = jsonData.message0;
              category = jsonData.category;
            }
          }
          if (text && category) {
            const blocklyColor = ScratchBlocks.Colours[category === "list" ? "data_lists" : category];
            if (blocklyColor) {
              const inputSpan = document.createElement("span");
              inputSpan.textContent = text;
              inputSpan.className = "console-variable";
              const colorCategoryMap = {
                list: "data-lists",
                more: "custom",
              };
              inputSpan.dataset.category = colorCategoryMap[category] || category;
              inputSpan.style.backgroundColor = blocklyColor.primary;
              wrapper.append(inputSpan);
            }
          }
        }
      }
    }

    var count = 1;

    // TODO This is not the right way to collapse messages
    const lastLog = logs[logs.length - 1];
    if (lastLog) {
      if (lastLog.targetId === targetId && lastLog.type === type && lastLog.text === text) {
        logs.pop();
        content.children[content.children.length - 2].remove();
        count += lastLog.count;
      }
    }

    logs.push({
      targetId,
      type,
      text,
      count
    });
    wrapper.append(createLogText(text, count));

    if (thread) {
      const target = thread.target;
      const parentTarget = target.isOriginal ? target : target.sprite.clones[0];
      const blockId = thread.peekStack();
      let link = document.createElement("a");
      link.textContent = target.isOriginal
        ? target.getName()
        : msg("clone-of", {
          spriteName: parentTarget.getName(),
        });
      link.className = "logLink";
      link.dataset.blockId = blockId;
      link.dataset.targetId = targetId;
      if (!target.isOriginal) {
        link.dataset.isClone = "true";
      }
      wrapper.appendChild(link);
    }

    if (!scrollQueued && isScrolledToEnd) {
      scrollQueued = true;
      queueMicrotask(scrollToEnd);
    }
    // TODO
    // if (!isInterfaceVisible) {
    //   const unreadImage = addon.self.dir + "/icons/debug-unread.svg";
    //   if (debuggerButtonImage.src !== unreadImage) debuggerButtonImage.src = unreadImage;
    // }
  };

  const clearLogs = () => {
    document.querySelectorAll(".log").forEach((log, i) => log.remove());
    logs = [];
    isScrolledToEnd = true;
  };

  // const scrollToEnd = () => {
  //   scrollQueued = false;
  //   tabContentContainer.scrollTop = tabContentContainer.scrollHeight;
  // };

  // tabContentContainer.addEventListener(
  //   "wheel",
  //   (e) => {
  //     // When user scrolls up, stop automatically scrolling down
  //     if (e.deltaY < 0) {
  //       isScrolledToEnd = false;
  //     }
  //   },
  //   { passive: true }
  // );
  // tabContentContainer.addEventListener(
  //   "scroll",
  //   () => {
  //     isScrolledToEnd = tabContentContainer.scrollTop + 5 >= tabContentContainer.scrollHeight - tabContentContainer.clientHeight;
  //   },
  //   { passive: true }
  // );

  return {
    tab,
    content,
    buttons: [exportButton, trashButton],
    addLog,
    clearLogs
  };
}
