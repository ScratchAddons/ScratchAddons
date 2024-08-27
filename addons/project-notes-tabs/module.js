export const eventTarget = new EventTarget();
let preview = false;

export function disableTabs() {
  eventTarget.dispatchEvent(new CustomEvent("disable"));
}
export const enableTabs = () => {
  eventTarget.dispatchEvent(new CustomEvent("enable"));
};

export const addPreviewToggle = () => {
  eventTarget.dispatchEvent(new CustomEvent("addToggle"));
};

export const setPreviewEnabled = (value) => {
  preview = value;
};

export const getPreviewEnabled = () => {
  return preview;
};
