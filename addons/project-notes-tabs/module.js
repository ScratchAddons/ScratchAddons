export const eventTarget = new EventTarget();

export const enableTabs = () => {
  eventTarget.dispatchEvent(new CustomEvent("enable"));
};

export const addPreviewToggle = () => {
  eventTarget.dispatchEvent(new CustomEvent("addToggle"));
};
