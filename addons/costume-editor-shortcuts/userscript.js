/**
 * Scratch Addons Script to add Tool Shortcuts to costume editor
 */
export default async function ({ addon, global, console, msg }) {
  const COSTUME_EDITOR_TAB_INDEX = 1;
  const toolNameToShortcut = {
    Select: "s",
    Reshape: "a",
    Brush: "b",
    Eraser: "e",
    Fill: "f",
    Text: "t",
    Line: "d",
    Circle: "c",
    Rectangle: "r",
  };

  /**
   * Reverse the mapping above to lookup by shortcut key
   */
  const shortcutToToolName = Object.fromEntries(Object.entries(toolNameToShortcut).map(([key, value]) => [value, key]));

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
  async function handleStateChanged(event) {
    // If "Convert to Bitmap/Vector" button is pressed in the costume editor, re-draw shortcuts on the buttons.
    if (event.detail.action.type === "scratch-paint/formats/CHANGE_FORMAT") {
      setTimeout(async () => await addLettersToButtons(), 0); // allow the DOM to update before calling addLettersToButtons.
      return;
    }

    // Only initialize or cleanup when the user switches to a new tab.
    const activeIndex = addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
    if (prevEditorTabIndex != activeIndex) {
      prevEditorTabIndex = activeIndex;
      if (activeIndex === COSTUME_EDITOR_TAB_INDEX) {
        await initialize();
      } else if (activeIndex !== COSTUME_EDITOR_TAB_INDEX && isInitialized) {
        await cleanup();
      }
    }
  }

  /**
   * Setup keydown listeners for shortcuts and and update UI to display available shortcuts.
   */
  async function initialize() {
    if (isInitialized) return; // Prevent double initialization
    isInitialized = true;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", userStartedTyping);
    document.addEventListener("focusout", userStoppedTyping);
    await addLettersToButtons();
  }

  /**
   * Remove keydown listeners
   */
  async function cleanup() {
    isInitialized = false;
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("focusin", userStartedTyping);
    document.removeEventListener("focusout", userStoppedTyping);
  }

  /**
   * Switch costume editor tools if a valid shortcut was pressed
   */
  async function handleKeyDown(event) {
    if (isUserTyping) return;

    var toolName = shortcutToToolName[event.key.toLowerCase()];
    await switchTool(toolName);
  }

  /**
   * For selecting costume editor tools by name
   */
  async function switchTool(toolName) {
    if (!toolName || addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== COSTUME_EDITOR_TAB_INDEX) return;

    try {
      var modeSelector = await addon.tab.waitForElement("[class^='paint-editor_mode-selector']");
      if (modeSelector) {
        modeSelector.querySelector(`span[title='${toolName}']`)?.click();
      }
    } catch (error) {
      console.error(`Failed to switch paint tool to: '${toolName}'. `, error);
    }
  }

  /**
   * Iterate over the costume editor tool buttons and add shortcuts
   */
  async function addLettersToButtons() {
    try {
      const container = await addon.tab.waitForElement("[class^='paint-editor_mode-selector']");
      container.querySelectorAll("span").forEach((span) => {
        const title = span.getAttribute("title");
        addLetterToButton(span, title);
      });
    } catch (error) {
      console.error("Failed to add costume editor shortcuts to buttons: ", error);
    }
  }

  /**
   * Update tools buttons in the UI to display their shortcut
   */
  function addLetterToButton(button, toolName) {
    if (!toolName || !toolNameToShortcut[toolName]) return;

    if (button.querySelector(".u-paint-editor-tool-shortcut")) return; // Prevent adding duplicates

    const shortcutSpan = document.createElement("span");
    shortcutSpan.textContent = toolNameToShortcut[toolName].toUpperCase();
    shortcutSpan.classList.add("u-paint-editor-tool-shortcut");

    button.style.position = "relative"; // Parent must be relative for child to use absolute positioning.
    button.appendChild(shortcutSpan);
  }

  /**
   * Track if user is typing (so we can disable shortcuts)
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
