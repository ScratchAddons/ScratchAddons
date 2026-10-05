export const eventTarget = new EventTarget();

let compactEditorActive = false;

export function isCompactEditorActive() {
  return compactEditorActive;
}

export function updateCompactEditorState(active) {
  if (compactEditorActive === active) return;
  compactEditorActive = active;
  eventTarget.dispatchEvent(new CustomEvent("change", { detail: { active } }));
}
