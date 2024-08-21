export const eventTarget = new EventTarget();

export function disableTabs() {
  eventTarget.dispatchEvent(new CustomEvent("disable"));
}

export function enableTabs() {
  eventTarget.dispatchEvent(new CustomEvent("enable"));
}
