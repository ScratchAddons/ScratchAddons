/**
 * Scratch Addons Script to add keyboard shortcuts to costume editor tools (similar to TurboWarp)
 */
export default async function ({ addon, console }) {
  const COSTUME_EDITOR_TAB_INDEX = 1;

  //Note: LocalizationIds can be found here: addon.tab.redux.state.locales.messages
  const toolLocalizationIdToShortcut = {
    "paint.selectMode.select": "s",
    "paint.reshapeMode.reshape": "a",
    "paint.brushMode.brush": "b",
    "paint.eraserMode.eraser": "e",
    "paint.fillMode.fill": "f",
    "paint.textMode.text": "t",
    "paint.lineMode.line": "l",
    "paint.ovalMode.oval": "c",
    "paint.rectMode.rect": "r",
  };

  /**
   * Reverse the mapping above to lookup by shortcut key.
   */
  const shortcutToToolLocalizationId = Object.fromEntries(
    Object.entries(toolLocalizationIdToShortcut).map(([key, value]) => [value, key])
  );

  let isInitialized = false;
  let isUserTyping = false;
  let prevEditorTabIndex = 0;

  /**
   * Initialize redux and listen for when a new tab is active.
   */
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", handleStateChanged);

  /**
   * If costume editor is open, initialize tool shortcuts, otherwise clean them up if needed.
   */
  function handleStateChanged(event) {
    // If "Convert to Bitmap/Vector" button is pressed in the costume editor, re-draw shortcuts on the buttons.
    if (
      event.detail.action.type === "scratch-paint/formats/CHANGE_FORMAT" ||
      event.detail.action.type === "scratch-gui/locales/SELECT_LOCALE"
    ) {
      setTimeout(addShortcutsToTitles, 0); // allow the DOM to update before calling addLettersToButtons.
      return;
    }

    // Only initialize or cleanup when the user switches to a new tab.
    const activeIndex = addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
    if (prevEditorTabIndex !== activeIndex) {
      prevEditorTabIndex = activeIndex;
      if (activeIndex === COSTUME_EDITOR_TAB_INDEX) {
        initialize();
      } else if (activeIndex !== COSTUME_EDITOR_TAB_INDEX && isInitialized) {
        cleanup();
      }
    }
  }

  /**
   * Setup keydown listeners for shortcuts and and update tooltips to include shortcuts.
   */
  function initialize() {
    if (isInitialized) return; // Prevents double initialization
    isInitialized = true;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", userStartedTyping);
    document.addEventListener("focusout", userStoppedTyping);
    addShortcutsToTitles();
  }

  /**
   * Remove keydown listeners.
   */
  function cleanup() {
    isInitialized = false;
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("focusin", userStartedTyping);
    document.removeEventListener("focusout", userStoppedTyping);
  }

  /**
   * Switch costume editor tool if a valid shortcut was pressed.
   */
  function handleKeyDown(event) {
    if (isUserTyping || event.ctrlKey || event.altKey || event.metaKey) return;

    const localizationId = shortcutToToolLocalizationId[event.key.toLowerCase()];
    if (!localizationId) return;

    const localizedToolName = addon.tab.scratchMessage(localizationId);
    switchTool(localizedToolName);
  }

  /**
   * For selecting costume editor tools by name.
   */
  function switchTool(toolName) {
    if (!toolName || addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== COSTUME_EDITOR_TAB_INDEX) return;

    try {
      const modeSelector = document.querySelector("[class^='paint-editor_mode-selector']");
      if (modeSelector) {
        modeSelector.querySelector(`span[title^='${toolName}']`)?.click();
      }
    } catch (error) {
      console.error(`Failed to switch paint tool to: '${toolName}'. `, error);
    }
  }

  /**
   * Iterate over the costume editor tool buttons and update their tooltips to include shortcuts.
   */
  function addShortcutsToTitles() {
    try {
      const container = document.querySelector("[class^='paint-editor_mode-selector']");
      container.querySelectorAll("span").forEach((span) => {
        updateTitle(span, span.getAttribute("title"));
      });
    } catch (error) {
      console.error("Failed to add costume editor shortcuts to buttons: ", error);
    }
  }

  /**
   * Mutates button tooltip to include shortcut key.
   */
  function updateTitle(button, title) {
    if (!title) return;

    const localizationId = Object.keys(toolLocalizationIdToShortcut).find((k) => addon.tab.scratchMessage(k) === title);
    if (!localizationId || !toolLocalizationIdToShortcut[localizationId]) return;

    const titleWithShortcut = `${title} (${toolLocalizationIdToShortcut[localizationId].toUpperCase()})`;
    button.setAttribute("title", titleWithShortcut);
  }

  /**
   * Track if user is typing (so we can disable shortcuts).
   */
  function userStartedTyping(event) {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
      isUserTyping = true;
    }
  }

  function userStoppedTyping(event) {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
      isUserTyping = false;
    }
  }
}
