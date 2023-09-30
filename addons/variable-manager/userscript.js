export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  let localVariables = [];
  let globalVariables = [];
  let preventUpdate = false;

  const manager = document.createElement("div");
  manager.classList.add(addon.tab.scratchClass("asset-panel_wrapper"), "sa-var-manager");

  const searchBox = document.createElement("input");
  searchBox.placeholder = msg("search");
  searchBox.className = addon.tab.scratchClass("input_input-form", { others: "sa-var-manager-searchbox" });

  searchBox.addEventListener("input", (e) => {
    for (const variable of localVariables) {
      variable.handleSearch(searchBox.value);
    }
    for (const variable of globalVariables) {
      variable.handleSearch(searchBox.value);
    }
    updateHeadingVisibility();
  });

  manager.appendChild(searchBox);

  const localVars = document.createElement("div");
  const localHeading = document.createElement("span");
  const localList = document.createElement("table");
  localHeading.className = "sa-var-manager-heading";
  localHeading.innerText = msg("for-this-sprite");
  localVars.appendChild(localHeading);
  localVars.appendChild(localList);

  const globalVars = document.createElement("div");
  const globalHeading = document.createElement("span");
  const globalList = document.createElement("table");
  globalHeading.className = "sa-var-manager-heading";
  globalHeading.innerText = msg("for-all-sprites");
  globalVars.appendChild(globalHeading);
  globalVars.appendChild(globalList);

  manager.appendChild(localVars);
  manager.appendChild(globalVars);

  const varTab = document.createElement("li");
  addon.tab.displayNoneWhileDisabled(varTab, { display: "flex" });
  varTab.classList.add(addon.tab.scratchClass("react-tabs_react-tabs__tab"), addon.tab.scratchClass("gui_tab"));
  // Cannot use number due to conflict after leaving and re-entering editor
  varTab.id = "react-tabs-sa-variable-manager";

  const varTabIcon = document.createElement("img");
  varTabIcon.draggable = false;
  varTabIcon.src = addon.self.dir + "/icon.svg";

  const varTabText = document.createElement("span");
  varTabText.innerText = msg("variables");

  varTab.appendChild(varTabIcon);
  varTab.appendChild(varTabText);

  function updateHeadingVisibility() {
    // used to hide the headings if there are no variables
    let filteredLocals = localVariables.filter((v) => v.row.style.display !== "none");
    let filteredGlobals = globalVariables.filter((v) => v.row.style.display !== "none");
    localHeading.style.display = filteredLocals.length === 0 ? "none" : "";
    globalHeading.style.display = filteredGlobals.length === 0 ? "none" : "";
  }

  const rowToVariableMap = new WeakMap();
  const observer = new IntersectionObserver(
    (changes) => {
      for (const change of changes) {
        const variable = rowToVariableMap.get(change.target);
        variable.setVisible(change.isIntersecting);
      }
    },
    {
      rootMargin: "100px",
    }
  );

  class WrappedVariable {
    constructor(scratchVariable, target) {
      this.scratchVariable = scratchVariable;
      this.target = target;
      this.visible = false;
      this.ignoreTooBig = false;
      this.buildDOM();
    }

    updateValue(force) {
      if (!this.visible && !force) return;

      let newValue;
      let maxSafeLength;
      if (this.scratchVariable.type === "list") {
        newValue = this.scratchVariable.value.join("\n");
        maxSafeLength = 5000000;
      } else {
        newValue = this.scratchVariable.value;
        maxSafeLength = 1000000;
      }

      if (!this.ignoreTooBig && newValue.length > maxSafeLength) {
        this.input.value = "";
        this.row.dataset.tooBig = true;
        return;
      }

      this.row.dataset.tooBig = false;
      if (newValue !== this.input.value) {
        this.input.disabled = false;
        this.input.value = newValue;
      }
    }

    handleSearch(search) {
      // this doesn't check if this.visible is true or whatever. maybe that would improve performance while typing into the search box but it's probably fine™
      if (this.scratchVariable.name.toLowerCase().includes(search.toLowerCase()) || !search) {
        // fuzzy searches are lame we are too cool for fuzzy searches (& i doubt they're even the right thing to use here, this should work fine enough)
        this.row.style.display = ""; // make the row normal
        this.updateValue(true); // force it to update because its hidden and it wouldn't be able to otherwise
      } else {
        this.row.style.display = "none"; // set the entire row as hidden
      }
    }

    resizeInputIfList() {
      if (this.scratchVariable.type === "list") {
        this.input.style.height = "auto";
        const height = Math.min(1000, this.input.scrollHeight);
        if (height > 0) {
          this.input.style.height = height + "px";
        }
      }
    }

    setVisible(visible) {
      if (this.visible === visible) return;
      this.visible = visible;
      if (visible) {
        this.updateValue();
      }
    }

    buildDOM() {
      const id = `sa-variable-manager-${this.scratchVariable.id}`;

      const row = document.createElement("tr");
      this.row = row;
      const labelCell = document.createElement("td");
      labelCell.className = "sa-var-manager-name";

      const label = document.createElement("input");
      label.value = this.scratchVariable.name;
      label.htmlFor = id;
      const onLabelOut = (e) => {
        e.preventDefault();
        const workspace = Blockly.getMainWorkspace();

        let newName = label.value;
        if (newName === this.scratchVariable.name) {
          // If the name is unchanged before we make sure the cloud prefix exists, there's nothing to do.
          return;
        }

        const CLOUD_SYMBOL = "☁";
        const CLOUD_PREFIX = CLOUD_SYMBOL + " ";
        if (this.scratchVariable.isCloud) {
          if (newName.startsWith(CLOUD_SYMBOL)) {
            if (!newName.startsWith(CLOUD_PREFIX)) {
              // There isn't a space between the cloud symbol and the name, so add one.
              newName = newName.substring(0, 1) + " " + newName.substring(1);
            }
          } else {
            newName = CLOUD_PREFIX + newName;
          }
        }

        let nameAlreadyUsed = false;
        if (this.target.isStage) {
          // Global variables must not conflict with any global variables or local variables in any sprite.
          const existingNames = vm.runtime.getAllVarNamesOfType(this.scratchVariable.type);
          nameAlreadyUsed = existingNames.includes(newName);
        } else {
          // Local variables must not conflict with any global variables or local variables in this sprite.
          nameAlreadyUsed = !!workspace.getVariable(newName, this.scratchVariable.type);
        }

        const isEmpty = !newName.trim();
        if (isEmpty || nameAlreadyUsed) {
          label.value = this.scratchVariable.name;
        } else {
          workspace.renameVariableById(this.scratchVariable.id, newName);
          // Only update the input's value when we need to to avoid resetting undo history.
          if (label.value !== newName) {
            label.value = newName;
          }
        }
      };
      label.addEventListener("keydown", (e) => {
        if (e.key === "Enter") e.target.blur();
      });
      label.addEventListener("focusout", onLabelOut);

      label.addEventListener("focus", (e) => {
        preventUpdate = true;
        manager.classList.add("freeze");
      });

      label.addEventListener("blur", (e) => {
        preventUpdate = false;
        manager.classList.remove("freeze");
      });
      labelCell.appendChild(label);

      rowToVariableMap.set(row, this);
      observer.observe(row);

      const valueCell = document.createElement("td");
      valueCell.className = "sa-var-manager-value";

      const tooBigElement = document.createElement("button");
      this.tooBigElement = tooBigElement;
      tooBigElement.textContent = msg("too-big");
      tooBigElement.className = "sa-var-manager-too-big";
      tooBigElement.addEventListener("click", () => {
        this.ignoreTooBig = true;
        this.updateValue(true);
      });

      let input;
      if (this.scratchVariable.type === "list") {
        input = document.createElement("textarea");
      } else {
        input = document.createElement("input");
      }
      input.className = "sa-var-manager-value-input";
      input.id = id;
      this.input = input;

      this.updateValue(true);
      if (this.scratchVariable.type === "list") {
        this.input.addEventListener("input", () => this.resizeInputIfList(), false);
      }

      const onInputOut = (e) => {
        e.preventDefault();
        if (this.scratchVariable.type === "list") {
          vm.setVariableValue(this.target.id, this.scratchVariable.id, input.value.split("\n"));
        } else {
          vm.setVariableValue(this.target.id, this.scratchVariable.id, input.value);
        }
        input.blur();
      };

      input.addEventListener("keydown", (e) => {
        if (e.target.nodeName === "INPUT" && e.key === "Enter") e.target.blur();
      });
      input.addEventListener("focusout", onInputOut);

      input.addEventListener("focus", (e) => {
        preventUpdate = true;
        manager.classList.add("freeze");
      });

      input.addEventListener("blur", (e) => {
        preventUpdate = false;
        manager.classList.remove("freeze");
      });

      valueCell.appendChild(input);
      valueCell.appendChild(tooBigElement);
      row.appendChild(labelCell);
      row.appendChild(valueCell);

      this.handleSearch(searchBox.value);
    }
  }

  function fullReload() {
    if (addon.tab.redux.state?.scratchGui?.editorTab?.activeTabIndex !== 3 || preventUpdate) return;

    const editingTarget = vm.runtime.getEditingTarget();
    const stage = vm.runtime.getTargetForStage();
    localVariables = editingTarget.isStage
      ? []
      : Object.values(editingTarget.variables)
          .filter((i) => i.type === "" || i.type === "list")
          .map((i) => new WrappedVariable(i, editingTarget));
    globalVariables = Object.values(stage.variables)
      .filter((i) => i.type === "" || i.type === "list")
      .map((i) => new WrappedVariable(i, stage));

    updateHeadingVisibility();

    while (localList.firstChild) {
      localList.removeChild(localList.firstChild);
    }
    while (globalList.firstChild) {
      globalList.removeChild(globalList.firstChild);
    }

    for (const variable of localVariables) {
      localList.appendChild(variable.row);
      variable.resizeInputIfList();
    }
    for (const variable of globalVariables) {
      globalList.appendChild(variable.row);
      variable.resizeInputIfList();
    }
  }

  function quickReload() {
    if (addon.tab.redux.state?.scratchGui?.editorTab?.activeTabIndex !== 3 || preventUpdate) return;

    for (const variable of localVariables) {
      variable.updateValue();
    }
    for (const variable of globalVariables) {
      variable.updateValue();
    }
  }

  function cleanup() {
    localVariables = [];
    globalVariables = [];
  }

  varTab.addEventListener("click", (e) => {
    addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 3 });
  });

  function setVisible(visible) {
    if (visible) {
      varTab.classList.add(
        addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        addon.tab.scratchClass("gui_is-selected")
      );
      const contentArea = document.querySelector("[class^=gui_tabs]");
      contentArea.insertAdjacentElement("beforeend", manager);
      fullReload();
    } else {
      varTab.classList.remove(
        addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        addon.tab.scratchClass("gui_is-selected")
      );
      manager.remove();
      cleanup();
    }
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type === "scratch-gui/navigation/ACTIVATE_TAB") {
      const varManagerWasSelected = document.body.contains(manager);
      const switchedToVarManager = detail.action.activeTabIndex === 3;

      if (varManagerWasSelected && !switchedToVarManager) {
        // Fixes #5773
        queueMicrotask(() => window.dispatchEvent(new Event("resize")));
      }

      setVisible(switchedToVarManager);
    } else if (detail.action.type === "scratch-gui/mode/SET_PLAYER") {
      if (!detail.action.isPlayerOnly && addon.tab.redux.state.scratchGui.editorTab.activeTabIndex === 3) {
        // DOM doesn't actually exist yet
        queueMicrotask(() => setVisible(true));
      }
    }
  });

  vm.runtime.on("PROJECT_LOADED", () => {
    try {
      fullReload();
    } catch (e) {
      console.error(e);
    }
  });
  vm.runtime.on("TOOLBOX_EXTENSIONS_NEED_UPDATE", () => {
    try {
      fullReload();
    } catch (e) {
      console.error(e);
    }
  });

  const oldStep = vm.runtime._step;
  vm.runtime._step = function (...args) {
    const ret = oldStep.call(this, ...args);
    try {
      quickReload();
    } catch (e) {
      console.error(e);
    }
    return ret;
  };

  addon.self.addEventListener("disabled", () => {
    if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex === 3) {
      addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 2 });
    }
  });

  while (true) {
    await addon.tab.waitForElement("[class^='react-tabs_react-tabs__tab-list']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    addon.tab.appendToSharedSpace({ space: "afterSoundTab", element: varTab, order: 3 });
  }
}
