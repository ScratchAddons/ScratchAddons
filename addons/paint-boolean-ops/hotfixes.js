// ── Hotfix: stuck modifier keys after Alt+Tab ────────────────────────
// When the user presses Alt+Tab to switch away, the browser never fires
// a keyup event for Alt. paper.js caches modifier state in
// paper.Key.modifiers and never resets it, so the next drag is treated
// as an alt-drag and triggers an unwanted clone.
//
// window blur / visibilitychange do not reliably fire when Alt+Tab shifts
// OS focus away in Chrome on Windows, so we can't use those.
//
// Instead, intercept mousedown in capture phase — which runs before
// paper.js reads modifiers — and sync paper.Key.modifiers against the
// native event's real hardware state. MouseEvent.altKey/shiftKey etc.
// always reflect actual key state regardless of what paper.js cached.
// Guarded by the "fix-stuck-modifiers" setting.
const applyModifierKeyFix = (addon, paper) => {
  const syncModifiers = (e) => {
    if (addon.self.disabled) return;
    if (!addon.settings.get("fix-stuck-modifiers")) return;
    const m = paper?.Key?.modifiers;
    if (!m) return;
    if (!e.altKey) m.alt = false;
    if (!e.shiftKey) m.shift = false;
    if (!e.ctrlKey) m.control = false;
    if (!e.metaKey) m.meta = false;
  };
  document.addEventListener("mousedown", syncModifiers, true);
  addon.self.addEventListener("disabled", () => document.removeEventListener("mousedown", syncModifiers, true));
  addon.self.addEventListener("reenabled", () => document.addEventListener("mousedown", syncModifiers, true));
};

// ── Hotfix: CompoundPath deselection cascade ──────────────────────────
// scratch-paint's cloneSelection() calls `item.selected = false` on the
// original CompoundPath after cloning it. In @scratch/paper, this does
// NOT cascade to child Path items — they stay selected. scratch-paint's
// getSelectedRootItems() has a fallback that includes a CompoundPath
// whenever any of its children are selected, even if the CP itself is
// not. Result: both the original (via still-selected children) and the
// clone (via its own selected=true) land in this.selectedItems, and both
// get dragged to the destination.
//
// Fix: shadow the `selected` setter on CompoundPath.prototype so that
// deselecting a CompoundPath also deselects its children. The cascade is
// gated on the "fix-compound-deselect" setting at call time, so toggling
// the setting takes effect immediately without unpatching the prototype.
// The patch is applied once and guarded against re-application on
// dynamic re-enable via a flag on the prototype.
const applyCompoundDeselect = (addon, paper) => {
  // Guard against being applied twice (e.g. on dynamic re-enable).
  if (paper.CompoundPath.prototype._sa_deselect_cascade_patched) return;

  // Walk the prototype chain to find the prototype that actually owns
  // the `selected` accessor (may be on a parent class, not CP itself).
  let selectedDesc = null;
  let proto = paper.CompoundPath.prototype;
  while (proto && proto !== Object.prototype) {
    const d = Object.getOwnPropertyDescriptor(proto, "selected");
    if (d?.set) {
      selectedDesc = d;
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }

  if (!selectedDesc?.set) return;

  const origSet = selectedDesc.set;
  const origGet = selectedDesc.get;
  Object.defineProperty(paper.CompoundPath.prototype, "selected", {
    get: origGet,
    set: function (selected) {
      origSet.call(this, selected);
      if (!selected && !addon.self.disabled && addon.settings.get("fix-compound-deselect")) {
        const children = this._children ?? this.children;
        if (children) {
          for (let i = 0; i < children.length; i++) {
            if (children[i].selected) {
              children[i].selected = false;
            }
          }
        }
      }
    },
    configurable: true,
    enumerable: selectedDesc.enumerable ?? false,
  });
  paper.CompoundPath.prototype._sa_deselect_cascade_patched = true;
};

export const applyHotfixes = (addon, paper) => {
  applyModifierKeyFix(addon, paper);
  applyCompoundDeselect(addon, paper);
};
