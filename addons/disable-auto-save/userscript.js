export default async ({ addon, console, msg }) => {
  function appendChildWithAttributes(parent, type, attrs = {}) {
    const element = document.createElement(type);
    Object.assign(element, attrs);
    parent.appendChild(element);
    return element;
  }
  function setProjectChanged(changed) {
    addon.tab.redux.dispatch({
      type: "scratch-gui/project-changed/SET_PROJECT_CHANGED",
      changed,
    });
  }
  const PAGE_BUTTON_SELECTOR = "[class*='community-button_community-button_']";

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (addon.self.disabled || detail.action.type !== "timeout/SET_AUTOSAVE_TIMEOUT_ID") return;
    clearTimeout(detail.next.scratchGui.timeout.autoSaveTimeoutId);
    console.log("Pending autosave prevented.");
  });

  function showSaveAlert() {
    const modal = addon.tab.createModal(msg("alert-title"), {
      isOpen: true,
      useEditorClasses: true,
    });
    modal.container.classList.add("unsavedChangesDialog");

    appendChildWithAttributes(modal.content, "b", { textContent: msg("alert-subtitle") });
    appendChildWithAttributes(modal.content, "p", { textContent: msg("unsaved-changes") });
    const buttonRow = appendChildWithAttributes(modal.content, "div", {
      className: addon.tab.scratchClass("prompt_button-row", { others: "unsavedChangesDialog-actions" }),
    });
    const buttons = {};
    for (const option of ["cancel", "discard", "save"]) {
      buttons[option] = appendChildWithAttributes(buttonRow, "button", {
        value: option,
        textContent: msg(option),
      });
    }
    buttons.save.classList.add(addon.tab.scratchClass("prompt_ok-button"));
    buttons.save.focus();

    // On any button click:
    buttonRow.addEventListener("click", async (e) => {
      if (!e.target.matches("button")) return;
      // All buttons close the modal
      modal.remove();

      if (selection === "discard") {
        // Mark changes as saved to avoid a save-on-navigation
        setProjectChanged(false);
        // Wait for the state change to register
        await addon.tab.redux.waitForState((state) => state !== "scratch-gui/project-changed/SET_PROJECT_CHANGED");
        document.querySelector(PAGE_BUTTON_SELECTOR).click();
        // Then we can mark it as changed again
        setProjectChanged(true);
      }
      if (e.target.value === "save") {
        document.querySelector(PAGE_BUTTON_SELECTOR).click();
      }
    });

    modal.closeButton.addEventListener("click", modal.remove);
    modal.container.parentElement.addEventListener("click", modal.remove);
    modal.container.addEventListener("keydown", (e) => {
      if (e.key === "Escape") modal.remove();
    });
  }

  while (true) {
    const btn = await addon.tab.waitForElement(PAGE_BUTTON_SELECTOR, {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    addListener(btn);
  }

  function addListener(btn) {
    btn.addEventListener(
      "click",
      (e) => {
        // Don't show if it's on someone else's project page,
        // or if there are no changes.
        if (
          e.isTrusted &&
          !addon.self.disabled &&
          addon.tab.redux.state.scratchGui.projectChanged &&
          document.querySelector("[class*='project-title-input_title-field_']")
        ) {
          e.preventDefault();
          e.stopPropagation();
          showSaveAlert();
        }
      },
      { capture: true }
    );
  }
};
