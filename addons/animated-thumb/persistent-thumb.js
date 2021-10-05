const COMMENT_PREFIX = "\u200b\u200b\ufe0e\u200b";

let disabled = true;
export const init = (console) => {
  // animated-thumb uses fetch to set thumbnails.
  // Therefore all XMLHttpRequest to thumbnail endpoint is ones we need to block.
  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, path, ...args) {
    if (!disabled && method === "POST" && String(path).startsWith("/internalapi/project/thumbnail/")) {
      console.log("Blocked overwriting thumbnails.");
      method = "OPTIONS"; // This makes sure thumbnail request errors.
    }
    return xhrOpen.call(this, method, path, ...args);
  };
};

export const blockOverwriting = (value) => {
  disabled = !value;
};

export const isOverwritingEnabled = (vm) => {
  const stage = vm.runtime.getTargetForStage();
  return Object.keys(stage.comments).find((key) => stage.comments[key].text.startsWith(COMMENT_PREFIX));
};

export const saveConfig = (vm, enabled, msg) => {
  blockOverwriting(enabled);
  const stage = vm.runtime.getTargetForStage();
  const key = isOverwritingEnabled(vm);
  if (enabled && !key) {
    stage.createComment(`${Date.now()}`, null, COMMENT_PREFIX + msg, 0, 0, 0, 0, true);
  } else if (!enabled && key) {
    delete stage.comments[key];
    vm.emitWorkspaceUpdate();
    vm.runtime.emitProjectChanged();
  }
};
