import downloadBlob from "../../libraries/common/cs/download-blob.js";
import LogView from "./log-view.js";

export default function createLogsTab ({ debug, addon, console, msg }) {
  const tab = debug.createHeaderTab({
    text: msg('tab-logs'),
    icon: addon.self.dir + "/icons/logs.svg"
  });

  const logView = new LogView({msg, addon});

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
    let blockId;
    let targetId;
    if (thread) {
      blockId = thread.peekStack();
      targetId = thread.target.id;
    }

    logView.append({
      text,
      type,
      blockId,
      targetId
    });

    if (!logView.visible) {
      debug.setHasUnreadMessage(true);
    }
  };

  const clearLogs = () => {
    logView.clear();
  };

  const show = () => {
    logView.show();
  };
  const hide = () => {
    logView.hide();
  };

  return {
    tab,
    content: logView.scrollElement,
    buttons: [exportButton, trashButton],
    show,
    hide,
    addLog,
    clearLogs
  };
}
