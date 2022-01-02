import downloadBlob from "../../libraries/common/cs/download-blob.js";
import LogView from "./log-view.js";

export default async function createLogsTab ({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const tab = debug.createHeaderTab({
    text: msg('tab-logs'),
    icon: addon.self.dir + "/icons/logs.svg"
  });

  const logView = new LogView({msg, addon});

  const createBlockPreview = (blockId, targetId) => {
    const target = vm.runtime.getTargetById(targetId);
    const block = target.blocks.getBlock(blockId);
    if (!block || !ScratchBlocks) {
      return null;
    }

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
          const element = document.createElement("span");
          element.textContent = text;
          element.className = "sa-debugger-input-block";
          const colorCategoryMap = {
            list: "data-lists",
            more: "custom",
          };
          element.dataset.category = colorCategoryMap[category] || category;
          element.style.backgroundColor = blocklyColor.primary;
          return element;
        }
      }
    }
    return null;
  };

  logView.compareLogs = (a, b) => (
    a.text === b.text &&
    a.type === b.type &&
    a.internal === b.internal &&
    // TODO: if the same message is logged from a different spot, should those messages be grouped?
    a.blockId === b.blockId &&
    a.targetId === b.targetId
  );

  logView.buildDOM = (log) => {
    const element = document.createElement('div');
    element.dataset.type = log.type;
    element.className = 'sa-debugger-log';

    if (log.internal) {
      element.classList.add('sa-debugger-log-internal');
    }

    if (log.count !== 1) {
      const repeats = document.createElement('div');
      repeats.className = 'sa-debugger-log-repeats';
      repeats.textContent = log.count;
      element.appendChild(repeats);
    }

    if (log.type === 'warn' || log.type === 'error') {
      const icon = document.createElement('div');
      icon.className = 'sa-debugger-log-icon';
      icon.title = msg('icon-' + log.type);
      element.appendChild(icon);
    }

    if (log.blockId && log.targetId) {
      const preview = createBlockPreview(log.blockId, log.targetId);
      if (preview) {
        element.appendChild(preview);
      }
    }

    const body = document.createElement('div');
    body.className = 'sa-debugger-log-body';
    if (log.text.length === 0) {
      body.textContent = msg('empty-string');
      body.classList.add('sa-debugger-log-body-empty');
    } else {
      body.textContent = log.text;
    }
    body.title = log.text;
    element.appendChild(body);

    if (log.targetId && log.blockId) {
      element.appendChild(debug.createBlockLink(log.targetId, log.blockId));
    }

    return element;
  };

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
    const exportFormat = e.shiftKey ? prompt(msg("enter-format"), defaultFormat) : defaultFormat;
    if (!exportFormat) return;
    const file = logView.logs
      .map(({ text, targetId, type, count }) =>
        (exportFormat.replace(
          /\{(sprite|type|content)\}/g,
          (_, match) =>
          ({
            sprite: logView.getTargetInfoById(targetId).name,
            type,
            content: text,
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

  const addLog = (text, thread, type) => {
    const log = {
      text,
      type
    };
    if (thread) {
      log.blockId = thread.peekStack();
      log.targetId = thread.target.id;
    }
    if (type === 'internal') {
      log.internal = true;
      log.type = 'log';
    }
    if (type === 'internal-warn') {
      log.internal = true;
      log.type = 'warn';
    }

    logView.append(log);

    if (!logView.visible) {
      debug.setHasUnreadMessage(true);
    }
  };

  const clearLogs = () => {
    logView.clear();
  };

  const show = () => {
    logView.show();
    debug.setHasUnreadMessage(false);
  };
  const hide = () => {
    logView.hide();
  };

  return {
    tab,
    content: logView.outerElement,
    buttons: [exportButton, trashButton],
    show,
    hide,
    addLog,
    clearLogs
  };
}
