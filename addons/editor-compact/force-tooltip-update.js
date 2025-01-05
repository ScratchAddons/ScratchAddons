export const eventTarget = new EventTarget();

export function updateTooltips() {
  eventTarget.dispatchEvent(new CustomEvent("update"));
}
