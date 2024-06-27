import downloadBlob from "../../libraries/common/cs/download-blob.js";
import LogView from "./log-view.js";

export default async function createLogsTab({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  const tab = debug.createHeaderTab({
    text: msg("tab-logs"),
    icon: addon.self.dir + "/icons/logs.svg",
  });

  const logView = new LogView();
  logView.placeholderElement.textContent = msg("no-logs");

  const getInputOfBlock = (targetId, blockId) => {
    const target = vm.runtime.getTargetById(targetId);
    if (!target) {
      return null;
    }
    const block = debug.getBlock(target, blockId);
    if (!block) {
      return null;
    }
    return Object.values(block.inputs)[0]?.block;
  };

  logView.generateRow = (row) => {
    const root = document.createElement("div");
    root.className = "sa-debugger-log";
    if (row.internal) {
      root.classList.add("sa-debugger-log-internal");
    }
    root.dataset.type = row.type;

    const icon = document.createElement("div");
    icon.className = "sa-debugger-log-icon";
    if (row.type === "warn" || row.type === "error") {
      icon.title = msg("icon-" + row.type);
    }
    root.appendChild(icon);

    const repeats = document.createElement("div");
    repeats.className = "sa-debugger-log-repeats";
    repeats.style.display = "none";
    root.appendChild(repeats);

    if (row.preview && row.blockId && row.targetInfo) {
      const originalId = row.targetInfo.originalId;
      const inputBlock = getInputOfBlock(originalId, row.blockId);
      if (inputBlock) {
        const preview = debug.createBlockPreview(originalId, inputBlock);
        if (preview) {
          root.appendChild(preview);
        }
      }
    }

    const text = document.createElement("div");
    text.className = "sa-debugger-log-text";
    if (row.text.length === 0) {
      text.classList.add("sa-debugger-log-text-empty");
      text.textContent = msg("empty-string");
    } else {
      text.textContent = row.text;
      text.title = row.text;
    }
    root.appendChild(text);

    if (row.targetInfo && row.blockId) {
      root.appendChild(debug.createBlockLink(row.targetInfo, row.blockId));
    }

    return {
      root,
      repeats,
    };
  };

  logView.renderRow = (elements, row) => {
    const { repeats } = elements;
    if (row.count > 1) {
      repeats.style.display = "";
      repeats.textContent = row.count;
    }
  };

  const exportButton = debug.createHeaderButton({
    text: msg("export"),
    icon: addon.self.dir + "/icons/download-white.svg",
    description: msg("export-desc"),
  });
  const downloadText = (filename, text) => {
    downloadBlob(filename, new Blob([text], { type: "text/plain" }));
  };
  exportButton.element.addEventListener("click", async (e) => {
    const defaultFormat = "{sprite}: {content} ({type})";
    const exportFormat = e.shiftKey
      ? await addon.tab.prompt(msg("export"), msg("enter-format"), defaultFormat, { useEditorClasses: true })
      : defaultFormat;
    if (!exportFormat) return;
    const file = logView.rows
      .map(({ text, targetInfo, type, count }) =>
        (
          exportFormat.replace(
            /\{(sprite|type|content)\}/g,
            (_, match) =>
              ({
                sprite: targetInfo ? targetInfo.name : msg("unknown-sprite"),
                type,
                content: text,
              })[match]
          ) + "\n"
        ).repeat(count)
      )
      .join("");
    downloadText("logs.txt", file);
  });

  const trashButton = debug.createHeaderButton({
    text: msg("clear"),
    icon: addon.self.dir + "/icons/delete.svg",
  });
  trashButton.element.addEventListener("click", () => {
    clearLogs();
  });

  const areLogsEqual = (a, b) =>
    a.text === b.text &&
    a.type === b.type &&
    a.internal === b.internal &&
    a.blockId === b.blockId &&
    a.targetId === b.targetId;

  const addLog = (text, thread, type) => {
    const log = {
      text,
      type,
      count: 1,
      preview: true,
    };
    if (thread) {
      log.blockId = thread.peekStack();
      const targetId = thread.target.id;
      log.targetId = targetId;
      log.targetInfo = debug.getTargetInfoById(targetId);
    }
    if (type === "internal") {
      log.internal = true;
      log.preview = false;
      log.type = "log";
    }
    if (type === "internal-warn") {
      log.internal = true;
      log.type = "warn";
    }

    const previousLog = logView.rows[logView.rows.length - 1];
    if (previousLog && areLogsEqual(log, previousLog)) {
      previousLog.count++;
      logView.queueUpdateContent();
    } else {
      logView.append(log);
    }

    if (!logView.visible && !log.internal) {
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
    clearLogs,
  };
}
