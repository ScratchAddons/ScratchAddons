export default async function ({ addon, global, console, msg }) {
  // Number of adjectives/nouns defined in addons-l10n\<LOCALE>\project-title-generator.json
  const ADJ_COUNT = 30;
  const NOUN_COUNT = 30;

  let pendingReplacement = false;

  let reduxAvailable = Boolean(addon.tab.redux.state);
  while (!reduxAvailable) {
    await new Promise((resolve) => {
      setTimeout(() => {
        reduxAvailable = Boolean(addon.tab.redux.state);
        resolve();
      }, 0);
    });
  }

  addon.tab.redux.initialize();
  let isFileUpload = false;
  addon.tab.redux.addEventListener("statechanged", async (e) => {
    if (e.detail.action.type === "scratch-gui/project-state/DONE_LOADING_VM_WITHOUT_ID") {
      // Current loadingState is SHOWING_WITHOUT_ID

      if (pendingReplacement) {
        // Never happens AFAIK
        console.log("Pending replacement");
        return;
      }
      pendingReplacement = true;

      let expired = false; // So that nothing goes catastrophically wrong
      setTimeout(() => (expired = true), 10000);

      const isLoggedIn = await addon.auth.fetchIsLoggedIn();
      if (isLoggedIn) {
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "CREATING_NEW");
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID");
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "AUTO_UPDATING");
        await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID");
        // By this point, vanilla new project was saved to cloud
      }

      if (addon.settings.get("auto-on-create") && !expired && !isFileUpload) setProjectName();
      pendingReplacement = false;
      isFileUpload = false;
    } else if (e.detail.action.type === "scratch-gui/project-state/START_LOADING_VM_FILE_UPLOAD") {
      // A file upload will then dispatch DONE_LOADING_VM_WITHOUT_ID, but we should ignore it
      isFileUpload = true;
    }
  });

  // Create the randomizer button
  let button;
  createButton();

  addon.tab.redux.addEventListener("statechanged", async (e) => {
    if (e.detail.action.type === "projectTitle/SET_PROJECT_TITLE") {
      let showButton = await shouldButtonShow();
      if (showButton) createButton();
      else removeButton();
    }
  });
  addon.tab.addEventListener("urlChange", () => {
    if (!addon.self.disabled && addon.tab.editorMode === "editor") createButton();
    else if (addon.tab.editorMode !== "editor" && button) removeButton();
  });
  addon.self.addEventListener("disabled", () => removeButton());
  addon.self.addEventListener("reenabled", () => createButton());
  addon.settings.addEventListener("change", async () => {
    let showButton = await shouldButtonShow();
    if (showButton) createButton();
    else removeButton();
  });

  async function shouldButtonShow() {
    let currentName = await addon.tab.redux.state.scratchGui.projectTitle;
    if (!addon.settings.get("only-untitled") || currentName === "" || currentName.includes("Untitled")) {
      return true;
    } else {
      return false;
    }
  }

  async function createButton() {
    let showButton = await shouldButtonShow();
    if (!showButton || document.querySelector("#sa-project-title-generator-button") !== null) {
      return;
    }
    let nameContainer = await addon.tab.waitForElement('[class*="menu-bar_menu-bar-item"][class*="menu-bar_growable"]');
    nameContainer.classList.add("sa-project-title-generator");
    let nameField = await addon.tab.waitForElement('[class*="project-title-input_title-field"]');
    if (button) button.remove();
    button = document.createElement("span");
    button.id = "sa-project-title-generator-button";
    button.className = addon.tab.scratchClass(
      "button_outlined-button",
      "menu-bar_menu-bar-button",
      "community-button_community-button"
    );
    let buttonImg = document.createElement("img");
    buttonImg.id = "sa-project-title-generator-button-img";
    buttonImg.className = addon.tab.scratchClass("community-button_community-button-icon", "button_icon");
    buttonImg.src = addon.self.dir + "/dice-five.svg";
    button.appendChild(buttonImg);
    nameField.after(button);
    button.addEventListener("click", () => setProjectName());
  }

  async function removeButton() {
    let nameContainer = await addon.tab.waitForElement('[class*="menu-bar_menu-bar-item"][class*="menu-bar_growable"]');
    nameContainer.classList.remove("sa-project-title-generator");
    button.remove();
  }

  async function setProjectName() {
    // Constructing the name like this is necessary for cross-language compatibility
    // (some languages put the adjectives after the noun, some don't use spaces here, etc.)
    let newName = msg("format", {
      adj: msg("adj-" + randi(ADJ_COUNT)),
      adj2: msg("adj-" + randi(ADJ_COUNT)),
      noun: msg("noun-" + randi(NOUN_COUNT)),
    });
    addon.tab.redux.dispatch({ type: "projectTitle/SET_PROJECT_TITLE", title: newName });
  }

  function randi(max) {
    return Math.floor(Math.random() * max) + 1;
  }
}
