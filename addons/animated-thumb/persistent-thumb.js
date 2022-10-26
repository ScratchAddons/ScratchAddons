let disabled = true;
const isDisabled = () => disabled;
export const init = (console) => {
  // animated-thumb uses fetch to set thumbnails.
  // Therefore all XMLHttpRequest to thumbnail endpoint is ones we need to block.
  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, path, ...args) {
    if (!isDisabled() && method === "POST" && String(path).startsWith("/internalapi/project/thumbnail/")) {
      console.log("Blocked overwriting thumbnails.");
      method = "OPTIONS"; // This makes sure thumbnail request errors.
    }
    return xhrOpen.call(this, method, path, ...args);
  };
};

export const blockOverwriting = (value) => {
  disabled = !value;
};

export const isOverwritingEnabled = (projectId) => {
  const value = localStorage.getItem("saPersistentThumb");
  if (value) {
    const settings = JSON.parse(value);
    return settings.includes(Number(projectId));
  }
  return false;
};

export const saveConfig = (projectId, enabled) => {
  blockOverwriting(enabled);
  const value = localStorage.getItem("saPersistentThumb");
  if (value) {
    const settings = new Set(JSON.parse(value));
    if (enabled) {
      settings.add(Number(projectId));
    } else {
      settings.delete(Number(projectId));
    }
    localStorage.setItem("saPersistentThumb", JSON.stringify([...settings]));
    return;
  } else if (enabled) {
    localStorage.setItem("saPersistentThumb", JSON.stringify([Number(projectId)]));
  }
};
