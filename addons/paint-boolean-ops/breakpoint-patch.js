// ── breakpoint-patch.js ───────────────────────────────────────────────────
// scratch-paint uses react-responsive to decide whether the Front/Back buttons
// appear inline or collapse into the More dropdown. The built-in breakpoint
// (1274px) is too narrow once we add our five shaping buttons — the toolbar
// overflows before that point is reached.
//
// The normal fix would be to intercept window.matchMedia, but react-responsive
// captures it once at bundle load time and never reads it again. So instead we
// reach directly into the React fiber tree, silence the built-in breakpoint
// listener, and drive the layout ourselves with a new MQL at the right width.
//
// Public API: patchToolbarBreakpoint({ fixedToolsRow, onMatchChange, isDisabled })
//   fixedToolsRow  — the stable outer toolbar DOM element (never unmounts)
//   onMatchChange  — called with (matches: boolean) whenever our breakpoint fires
//   isDisabled     — function returning true when the addon is disabled
// Returns: applyPatch() — call this to re-apply the patch (e.g. on re-enable)

const WIDE_BREAKPOINT = 1536;
const COMPACT_BREAKPOINT = 1140;

// Returns true if the compact-editor addon is currently enabled. Its style
// element is always present in the DOM; we check the disabled attribute.
const isCompactEditorActive = () => {
  const el = document.querySelector('[data-addon-id="editor-compact"].scratch-addons-style');
  return el !== null && !el.disabled;
};

// Returns the window width at which the toolbar should switch to More mode.
const getBreakpoint = () => (isCompactEditorActive() ? COMPACT_BREAKPOINT : WIDE_BREAKPOINT);

// Unhooks the built-in matchMedia listener from a MediaQuery fiber so it can
// no longer override our dispatch calls. The listener lives at hook slot 4
// in react-responsive's internal hook chain.
const disposeNativeMql = (fiber) => {
  let hook = fiber.memoizedState;
  for (let h = 0; h < 4; h++) hook = hook?.next;
  hook?.memoizedState?.dispose?.();
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

// Replaces the toolbar's built-in 1274px breakpoint with our own, wires up a
// real MQL listener to keep it responsive, and re-applies whenever the
// compact-editor addon is toggled. Call the returned applyPatch() function to
// manually re-apply (e.g. when the addon is re-enabled).
export const patchToolbarBreakpoint = ({ fixedToolsRow, onMatchChange, isDisabled }) => {
  let mql = null;

  // Silences the built-in listener and pushes our current matches value into
  // React's state, causing the toolbar to re-render at our breakpoint.
  const applyPatch = () => {
    const bp = getBreakpoint();
    const query = `(min-width: ${bp}px)`;

    // Swap the MQL if the breakpoint changed.
    if (mql?.media !== query) {
      mql?.removeEventListener("change", onMqlChange);
      mql = window.matchMedia(query);
      mql.addEventListener("change", onMqlChange);
    }

    // Dispose all native 1274px listeners and push our current matches value.
    const fibers = findMediaQueryFibers(fixedToolsRow);
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
    if (isDisabled()) return;
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
