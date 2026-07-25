// ── breakpoint-patch.js ───────────────────────────────────────────────────
// Scratch Paint uses react-responsive to decide whether the Front/Back buttons
// appear inline or collapse into the More dropdown. The built-in breakpoint
// (1274px) is too narrow once we add our five shaping buttons — the toolbar
// overflows before that point is reached.
//
// The normal fix would be to intercept window.matchMedia, but react-responsive
// captures it once at bundle load time and never reads it again. So instead we
// reach directly into the React fiber tree, silence the built-in breakpoint
// listener, and drive the layout ourselves with a new media query.

// 1580px: wide at 100% zoom on 1920px displays, narrow at 125% zoom (1536px
// logical) where sub-pixel rounding at 1.25x DPR causes a 1px overflow.
const WIDE_BREAKPOINT = 1580;
const COMPACT_BREAKPOINT = 1140;
const NATIVE_BREAKPOINT = 1274;

// Returns true if the compact-editor addon is currently enabled. Its style
// element is always present in the DOM; we check the disabled attribute.
const isCompactEditorActive = () => {
  const el = document.querySelector('[data-addon-id="editor-compact"].scratch-addons-style');
  return el !== null && !el.disabled;
};

// Once the native listener is removed, continue emulating Scratch's original
// breakpoint while the addon is disabled so its toolbar remains responsive.
const getBreakpoint = (isDisabled) => {
  if (isDisabled()) return NATIVE_BREAKPOINT;
  return isCompactEditorActive() ? COMPACT_BREAKPOINT : WIDE_BREAKPOINT;
};

// Unhooks the built-in matchMedia listener from a MediaQuery fiber so it can
// no longer override our dispatch calls. Find the media-query object and the
// effect that subscribed to it by shape instead of relying on hook positions.
const disposeNativeMql = (fiber) => {
  const hooks = [];
  let hook = fiber.memoizedState;
  while (hook) {
    hooks.push(hook);
    hook = hook.next;
  }
  const nativeMql = hooks
    .map((h) => h.memoizedState)
    .find((state) => state?.addListener && state?.removeListener && state?.dispose);
  if (!nativeMql) return;
  for (const h of hooks) {
    const effect = h.memoizedState;
    if (effect?.deps?.includes(nativeMql)) effect.destroy?.();
  }
  nativeMql.dispose();
};

// Gets the React state setter that controls whether a MediaQuery fiber
// considers its condition matched. Calling it with true/false triggers a
// re-render that shows or hides the corresponding toolbar content. It lives
// at hook slot 8 in react-responsive's internal hook chain.
const getDispatch = (fiber) => {
  let hook = fiber.memoizedState;
  for (let h = 0; h < 8; h++) hook = hook?.next;
  return hook?.queue?.dispatch;
};

// Finds the two MediaQuery React fibers sitting directly inside the toolbar
// row — one for minWidth (shows inline buttons) and one for maxWidth (shows
// the More dropdown). We identify them by the presence of a minWidth or
// maxWidth prop, which only the MediaQuery components carry.
const findMediaQueryFibers = (fixedToolsRow) => {
  if (!fixedToolsRow) return [];
  const fiberKey = Object.keys(fixedToolsRow).find((k) => k.startsWith("__reactFiber"));
  if (!fiberKey) return [];
  const fibers = [];
  let sib = fixedToolsRow[fiberKey].child;
  while (sib) {
    const p = sib.memoizedProps;
    const hasMin = p?.minWidth !== null && p?.minWidth !== undefined;
    const hasMax = p?.maxWidth !== null && p?.maxWidth !== undefined;
    if (hasMin || hasMax) fibers.push(sib);
    sib = sib.sibling;
  }
  return fibers;
};

/**
 * Takes control of Scratch's toolbar breakpoint and returns a function that
 * reapplies it after a toolbar remount or addon state change.
 *
 * @param {object} options
 * @param {Function} options.getFixedToolsRow - Returns the current outer toolbar element.
 * @param {Function} options.onMatchChange - Receives whether the wide layout should be shown.
 * @param {Function} options.isDisabled - Returns whether the addon is disabled.
 * @returns {Function} Reapplies the breakpoint to the current toolbar.
 */
export const patchToolbarBreakpoint = ({ getFixedToolsRow, onMatchChange, isDisabled }) => {
  let mql = null;

  // Silences the built-in listener and pushes our current matches value into
  // React's state, causing the toolbar to re-render at our breakpoint.
  const applyPatch = () => {
    const bp = getBreakpoint(isDisabled);
    const query = `(min-width: ${bp}px)`;

    // Swap the MQL if the breakpoint changed.
    if (mql?.media !== query) {
      mql?.removeEventListener("change", onMqlChange);
      mql = window.matchMedia(query);
      mql.addEventListener("change", onMqlChange);
    }

    // Dispose all native 1274px listeners and push our current matches value.
    const fibers = findMediaQueryFibers(getFixedToolsRow());
    for (const f of fibers) disposeNativeMql(f);
    const matches = mql.matches;
    for (const f of fibers) {
      const p = f.memoizedProps;
      if (p.minWidth !== null && p.minWidth !== undefined) getDispatch(f)?.(matches);
      if (p.maxWidth !== null && p.maxWidth !== undefined) getDispatch(f)?.(!matches);
    }

    onMatchChange(matches);
  };

  const onMqlChange = () => {
    applyPatch();
  };

  // Watch compact-editor style element for enable/disable toggle.
  const compactEditorEl = document.querySelector('[data-addon-id="editor-compact"].scratch-addons-style');
  if (compactEditorEl) {
    new MutationObserver(() => {
      if (isDisabled()) return;
      applyPatch();
    }).observe(compactEditorEl, { attributes: true, attributeFilter: ["disabled"] });
  }

  // Run immediately.
  applyPatch();

  // Return applyPatch so callers can re-trigger it (e.g. on re-enable).
  return applyPatch;
};
