import { patchToolbarBreakpoint } from "./breakpoint-patch.js";

const FIXED_TOOLS_ROW_SELECTOR = "[class*='fixed-tools_row_']:not([class*='input-group_'])";
const FRONT_BACK_ROW_SELECTOR = "[class*='fixed-tools_row_'][class*='input-group_']";
const MORE_MENU_SELECTOR = "[class*='fixed-tools_mod-context-menu_']";

/**
 * Keeps addon controls attached to Scratch Paint's fixed toolbar.
 *
 * The caller supplies matching inline and More-menu controls. Hooks keep
 * addon-specific styling and state out of this module.
 *
 * @param {object} options
 * @param {object} options.addon - Addon API object.
 * @param {HTMLElement} options.inlineSection - Controls shown in the wide toolbar.
 * @param {string} options.inlineSectionClass - Addon class retained when native classes are copied.
 * @param {string} options.inlineItemSelector - Buttons within the inline section.
 * @param {string} options.inlineIconSelector - Icons within the inline section.
 * @param {string} options.inlineLabelSelector - Labels within the inline section.
 * @param {HTMLElement[]} options.overflowItems - Matching controls shown in the More menu.
 * @param {Function} [options.onNativeClasses] - Receives Scratch's separator, disabled, and input-group classes.
 * @param {Function} [options.onToolbarMutation] - Runs after Scratch changes the toolbar.
 * @param {Function} [options.onOverflowItemsMounted] - Runs after More-menu items are inserted.
 * @param {Function} [options.onReady] - Runs once after observers are attached.
 * @returns {{start: Function}} Controller that starts toolbar management.
 */
export const createPaintToolbarController = ({
  addon,
  inlineSection,
  inlineSectionClass,
  inlineItemSelector,
  inlineIconSelector,
  inlineLabelSelector,
  overflowItems,
  onNativeClasses = () => {},
  onToolbarMutation = () => {},
  onOverflowItemsMounted = () => {},
  onReady = () => {},
}) => {
  let started = false;
  let currentFixedToolsRow = null;
  let applyBreakpointPatch = null;
  let toolbarObserver = null;
  let moreMenuObserver = null;
  let dashedBorderClass = "";

  // Scratch can replace the entire toolbar when the paint editor remounts.
  const getFixedToolsRow = () => {
    if (!currentFixedToolsRow?.isConnected) {
      currentFixedToolsRow = document.querySelector(FIXED_TOOLS_ROW_SELECTOR);
    }
    return currentFixedToolsRow;
  };

  // Reuse Scratch's generated classes so the injected controls match its UI.
  const adoptNativeClasses = (fixedToolsRow) => {
    const nativeDashedGroup = fixedToolsRow.querySelector("[class*='mod-dashed-border_']");
    dashedBorderClass = nativeDashedGroup
      ? [...nativeDashedGroup.classList].find((className) => className.includes("mod-dashed-border")) ?? ""
      : "";

    // Native input-group classes, e.g. flex layout and inter-group spacing. Callers
    // apply these (not dashedBorderClass) to any button-group divs they build, since
    // that class assumes a group-div's box model and strips borders/padding meant for
    // separators when applied directly to a button (e.g. under the compact-editor addon).
    const inputGroupClasses = nativeDashedGroup
      ? [...nativeDashedGroup.classList].filter((className) => !className.includes("mod-dashed-border"))
      : [];

    if (inputGroupClasses.length) {
      inlineSection.className = [...inputGroupClasses, inlineSectionClass].join(" ");
    }

    const nativeButton = fixedToolsRow.querySelector("[class*='labeled-icon-button_mod-edit-field_']");
    const nativeIcon = fixedToolsRow.querySelector("[class*='labeled-icon-button_edit-field-icon_']");
    const nativeLabel = fixedToolsRow.querySelector("[class*='labeled-icon-button_edit-field-title_']");
    const nativeDisabledButton = document.querySelector("[class*='button_mod-disabled_']");
    const disabledClass = nativeDisabledButton
      ? [...nativeDisabledButton.classList].find((className) => className.includes("mod-disabled")) ?? ""
      : "";

    for (const item of inlineSection.querySelectorAll(inlineItemSelector)) {
      if (nativeButton) item.classList.add(...nativeButton.classList);
      if (disabledClass) item.classList.add(disabledClass);
    }
    for (const icon of inlineSection.querySelectorAll(inlineIconSelector)) {
      if (nativeIcon) icon.classList.add(...nativeIcon.classList);
    }
    for (const label of inlineSection.querySelectorAll(inlineLabelSelector)) {
      if (nativeLabel) label.classList.add(...nativeLabel.classList);
    }

    onNativeClasses({ dashedBorderClass, disabledClass, inputGroupClasses });
  };

  // Scratch's rendered layout is the final authority for whether inline
  // controls or the More dropdown should be present.
  const syncInlineSection = () => {
    if (addon.self.disabled) {
      inlineSection.remove();
      return;
    }

    const fixedToolsRow = getFixedToolsRow();
    const frontBackRow = fixedToolsRow?.querySelector(FRONT_BACK_ROW_SELECTOR);
    if (!frontBackRow) {
      inlineSection.remove();
      return;
    }

    if (dashedBorderClass) frontBackRow.classList.add(dashedBorderClass);
    if (inlineSection.previousElementSibling !== frontBackRow) {
      frontBackRow.after(inlineSection);
    }
    inlineSection.style.display = "";
  };

  const syncToolbar = () => {
    syncInlineSection();
    onToolbarMutation();
  };

  const observeToolbar = (fixedToolsRow) => {
    toolbarObserver.disconnect();
    toolbarObserver.observe(fixedToolsRow, { childList: true, subtree: true });
  };

  // Scratch creates a new More menu each time it opens, so the same addon
  // items are moved into each new menu and styled from a native item.
  const injectOverflowItems = (menu) => {
    if (overflowItems.every((item) => menu.contains(item))) return;

    const nativeItem = [...menu.children].find(
      (element) => element.tagName === "SPAN" && element.querySelector("img") && !overflowItems.includes(element)
    );
    let disabledClasses = [];
    if (nativeItem) {
      disabledClasses = [...nativeItem.classList].filter((className) => className.includes("mod-disabled"));
      const buttonClasses = [...nativeItem.classList].filter((className) => !className.includes("mod-disabled"));
      const iconClasses = nativeItem.querySelector("img")?.classList;

      for (const item of overflowItems) {
        item.className = buttonClasses.join(" ");
        const icon = item.querySelector("img");
        if (icon && iconClasses) icon.className = [...iconClasses].join(" ");
      }
    }

    menu.append(...overflowItems);
    onOverflowItemsMounted({ disabledClasses });
  };

  const injectOpenOverflowMenus = () => {
    for (const menu of document.querySelectorAll(MORE_MENU_SELECTOR)) injectOverflowItems(menu);
  };

  const run = async () => {
    while (true) {
      const fixedToolsRow = await addon.tab.waitForElement(FIXED_TOOLS_ROW_SELECTOR, {
        markAsSeen: true,
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
      });
      currentFixedToolsRow = fixedToolsRow;
      adoptNativeClasses(fixedToolsRow);

      // Observers and lifecycle listeners are shared across toolbar remounts.
      if (!toolbarObserver) {
        toolbarObserver = new MutationObserver(syncToolbar);
        observeToolbar(fixedToolsRow);

        applyBreakpointPatch = patchToolbarBreakpoint({
          getFixedToolsRow,
          onMatchChange: syncInlineSection,
          isDisabled: () => addon.self.disabled,
        });

        moreMenuObserver = new MutationObserver((mutations) => {
          if (addon.self.disabled) return;
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType !== Node.ELEMENT_NODE) continue;
              const menu = node.matches(MORE_MENU_SELECTOR) ? node : node.querySelector(MORE_MENU_SELECTOR);
              if (menu) {
                injectOverflowItems(menu);
                return;
              }
            }
          }
        });
        moreMenuObserver.observe(document.body, { childList: true });
        injectOpenOverflowMenus();
        onReady();

        addon.self.addEventListener("disabled", () => {
          inlineSection.remove();
          toolbarObserver.disconnect();
          moreMenuObserver.disconnect();
          // The native listener was replaced, so emulate Scratch's breakpoint.
          applyBreakpointPatch();
        });
        addon.self.addEventListener("reenabled", () => {
          const liveFixedToolsRow = getFixedToolsRow();
          if (liveFixedToolsRow) observeToolbar(liveFixedToolsRow);
          moreMenuObserver.observe(document.body, { childList: true });
          injectOpenOverflowMenus();
          applyBreakpointPatch();
          syncToolbar();
        });
      } else if (!addon.self.disabled) {
        observeToolbar(fixedToolsRow);
        applyBreakpointPatch();
      }

      syncToolbar();
    }
  };

  return {
    start() {
      if (started) return;
      started = true;
      run();
    },
  };
};
