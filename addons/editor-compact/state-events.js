export const eventTarget = new EventTarget();

const detectCompactEditorActive = () =>
  [...document.querySelectorAll(".scratch-addons-style[data-addon-id='editor-compact']")].some(
    (style) => style.disabled !== true
  );

let compactEditorActive = detectCompactEditorActive();

export function isCompactEditorActive() {
  return compactEditorActive;
}

export function updateCompactEditorState(active = detectCompactEditorActive()) {
  compactEditorActive = active;
  eventTarget.dispatchEvent(new CustomEvent("change", { detail: { active } }));
}
