export const eventTarget = new EventTarget();

export const disableTabs = () => {
  document.querySelectorAll(".description-block").forEach((e) => (e.style.display = ""));
  document.body.classList.remove("sa-project-tabs-on");
};
export const enableTabs = () => {
  eventTarget.dispatchEvent(new CustomEvent("enable"));
};

export const addPreviewToggle = () => {
  eventTarget.dispatchEvent(new CustomEvent("addToggle"));
};
