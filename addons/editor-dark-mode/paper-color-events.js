export const eventTarget = new EventTarget();

export function notifyPaperColorsChanged() {
  eventTarget.dispatchEvent(new CustomEvent("change"));
}
