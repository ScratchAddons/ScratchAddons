export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;
  const Blockly = await addon.tab.traps.getBlockly();

  let localVariables = [];
  let localLists = [];
  let globalVariables = [];
  let globalLists = [];
  let cloudVariables = [];
  
  let preventUpdate = false;

  const manager = document.createElement("div");
  manager.classList.add(addon.tab.scratchClass("asset-panel_wrapper"), "sa-var-manager");
  
  const toolbox = document.createElement("div");
  toolbox.className = "sa-var-manager-toolbox";

  const searchBox = document.createElement("input");
  searchBox.placeholder = msg("search");
  searchBox.className = addon.tab.scratchClass("input_input-form", { others: "sa-var-manager-searchbox" });

  searchBox.addEventListener("input", (e) => {
    forAllVarsLists((vars) => {
      for (const variable of vars) {
        variable.handleSearch(searchBox.value);
      }
    });
    updateHeadingVisibility();
  });
  
  toolbox.appendChild(searchBox);
  
  const newVarBox = document.createElement("div");
  
  const newVarButton = document.createElement("button");
  const newVarIcon = document.createElement("img");
  newVarIcon.src = addon.self.dir + '/icons/new-var.svg';
  newVarButton.appendChild(newVarIcon);
  newVarButton.appendChild(document.createTextNode(Blockly.Msg.NEW_VARIABLE));
  
  const newListButton = document.createElement("button");
  const newListIcon = document.createElement("img");
  newListIcon.src = addon.self.dir + '/icons/new-list.svg';
  newListButton.appendChild(newListIcon);
  newListButton.appendChild(document.createTextNode(Blockly.Msg.NEW_LIST));
  
  newVarButton.addEventListener("click", (e) => {
    newVarButton.blur();
    Blockly.Variables.createVariable(Blockly.getMainWorkspace(), (id) => {
      setTimeout(fullReload);
    }, '');
  });
  newListButton.addEventListener("click", (e) => {
    newListButton.blur();
    Blockly.Variables.createVariable(Blockly.getMainWorkspace(), (id) => {
      setTimeout(fullReload);
    }, 'list');
  });
  
  newVarBox.appendChild(newVarButton);
  newVarBox.appendChild(newListButton);
  toolbox.appendChild(newVarBox);
  
  manager.appendChild(toolbox);
  
  const scrollBox = document.createElement("div");
  scrollBox.className = "sa-var-manager-scroll-box";

  function buildTableDOM(msgId) {
    let vars = document.createElement("div");
    let heading = document.createElement("span");
    let table = document.createElement("table");
    heading.className = "sa-var-manager-heading";
    heading.innerText = msg(msgId);
    vars.appendChild(heading);
    vars.appendChild(table);
    scrollBox.appendChild(vars);
    return {heading, table};
  }
  
  const { heading: localVarHeading, table: localVarTable } = buildTableDOM("vars-for-this");
  const { heading: localListHeading, table: localListTable } = buildTableDOM("lists-for-this");
  const { heading: globalVarHeading, table: globalVarTable } = buildTableDOM("vars-for-all");
  const { heading: globalListHeading, table: globalListTable } = buildTableDOM("lists-for-all");
  const { heading: cloudHeading, table: cloudTable } = buildTableDOM("cloud-variables");
  manager.appendChild(scrollBox);

  const varTab = document.createElement("li");
  addon.tab.displayNoneWhileDisabled(varTab);
  varTab.classList.add(addon.tab.scratchClass("react-tabs_react-tabs__tab"), addon.tab.scratchClass("gui_tab"));
  // Cannot use number due to conflict after leaving and re-entering editor
  varTab.id = "react-tabs-sa-variable-manager";

  const varTabIcon = document.createElement("img");
  varTabIcon.draggable = false;
  varTabIcon.src = addon.self.dir + "/icons/icon.svg";

  const varTabText = document.createElement("span");
  varTabText.innerText = msg("variables");

  varTab.appendChild(varTabIcon);
  varTab.appendChild(varTabText);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = "13.6px Helvetica, Arial, sans-serif";
  
  function forAllVarsLists(action) {
    action(localVariables);
    action(localLists);
    action(globalVariables);
    action(globalLists);
    action(cloudVariables);
  }

  function updateHeadingVisibility() {
    const update = (vars, heading) => {
      const filtered = vars.filter((v) => v.row.style.display !== "none");
      heading.style.display = filtered.length === 0 ? "none" : "";
    };
    update(localVariables, localVarHeading);
    update(localLists, localListHeading);
    update(globalVariables, globalVarHeading);
    update(globalLists, globalListHeading);
    update(cloudVariables, cloudHeading);
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
    }

    updateValue(force) {
      if (!this.visible && !force) return;

      let newValue;
      let toobig;
      if (this.scratchVariable.type === "list") {
        newValue = this.scratchVariable.value.join("\n");
        toobig = newValue.length > 5000000 || this.scratchVariable.value.length > 10000;
      } else {
        newValue = this.scratchVariable.value;
        toobig = newValue.length > 1000000;
      }

      if (!this.ignoreTooBig && toobig) {
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
        const length = this.input.isEmpty ? 0 : this.input.value.split("\n").length;
        this.input.placeholder = length ? "" : msg("empty");
        if (this.ignoreTooBig) {
          this.lineNumbers.textContent = ""; // don't display line numbers if too big
          this.input.style.marginLeft = "8px";
        } else {
          this.lineNumbers.textContent = Array.from({length: length}, (_, i) => i+1).join('\n');
          const margin = Math.max(String(length).length, 2);
          this.input.style.marginLeft = `calc(${margin}ch + 16px)`;
        }
        
        this.input.style.height = "auto";
        const height = this.input.scrollHeight;
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
      console.log(this.scratchVariable);
      const id = `sa-variable-manager-${this.scratchVariable.id}`;

      const row = document.createElement("tr");
      row.dataset.type = this.scratchVariable.type == "" ? "var" : "list"
      this.row = row;
      const labelCell = document.createElement("td");
      labelCell.className = "sa-var-manager-name";

      const label = document.createElement("input");
      label.value = this.scratchVariable.name;
      label.htmlFor = id;
      
      const resizeLabel = () => {
        label.style.maxWidth = "0";
        label.style.maxWidth = Math.max(32, label.scrollWidth + 20) + "px";
      }
      
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
        resizeLabel();
      };
      
      label.addEventListener("input", resizeLabel);
      
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
      
      labelCell.addEventListener("mousedown", (e) => {
        if (e.target != labelCell) return;
        e.preventDefault();
        label.selectionStart = label.value.length;
        label.focus();
      });
      
      new MutationObserver((mutations, observer) => {
        mutations.forEach(function(mutation) {
          observer.disconnect();
          resizeLabel();
        });
      }).observe(labelCell, { attributes: false, childList: true, subtree: false });
      
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
        this.resizeInputIfList();
      });

      let input;
      if (this.scratchVariable.type === "list") {
        input = document.createElement("textarea");
        input.isEmpty = this.scratchVariable.value.length === 0;
      } else {
        input = document.createElement("input");
      }
      input.className = "sa-var-manager-value-input";
      input.id = id;
      if (this.scratchVariable.isCloud) {
        input.pattern = "\\d{0,256}"; // respect cloud variable format
        input.title = msg("cloud-restrictions");
      }
      this.input = input;

      this.updateValue(true);
      this.input.addEventListener("input", () => {
        if (this.scratchVariable.type === "list" && this.input.value != "")
          this.input.isEmpty = false;
        this.resizeInputIfList();
      });

      const onInputOut = (e) => {
        e.preventDefault();
        if (this.scratchVariable.type === "list") {
          vm.setVariableValue(this.target.id, this.scratchVariable.id, input.isEmpty ? [] : input.value.split("\n"));
        } else {
          vm.setVariableValue(this.target.id, this.scratchVariable.id, input.value);
        }
        input.blur();
      };

      input.addEventListener("keydown", (e) => {
        if (e.target.nodeName === "INPUT") {
          if (e.key === "Enter") {
            e.target.blur();
          }
        } else {
          if (e.target.isEmpty) {
            if (e.key === "Enter") {
              e.preventDefault();
              e.target.isEmpty = false;
              this.resizeInputIfList();
            }
          } else if (e.target.value === "" && e.key === "Backspace") {
            e.target.isEmpty = true;
              this.resizeInputIfList();
          }
        }
        
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
      
      if (this.scratchVariable.type === "list") {
        let box = document.createElement("div");
        let lineNumbers = document.createElement("label");
        lineNumbers.setAttribute("for", id)
        box.appendChild(lineNumbers);
        this.lineNumbers = lineNumbers;
        box.appendChild(input);
        valueCell.appendChild(box);
      } else {
        valueCell.appendChild(input);
      }

      valueCell.appendChild(tooBigElement);
      row.appendChild(labelCell);
      row.appendChild(valueCell);

      this.handleSearch(searchBox.value);
    }
  }

  function fullReload() {
    if (addon.tab.redux.state?.scratchGui?.editorTab?.activeTabIndex !== 3 || preventUpdate) return;
    
    cleanup();
    const editingTarget = vm.runtime.getEditingTarget();
    if (!editingTarget.isStage) {
      Object.values(editingTarget.variables).forEach((v) => {
        const wrapped = new WrappedVariable(v, editingTarget);
          if (v.type === "") {
              localVariables.push(wrapped);
          } else if (v.type === "list") {
            localLists.push(wrapped);
          }
      });
    }
    const stage = vm.runtime.getTargetForStage();
    Object.values(stage.variables).forEach((v) => {
      const wrapped = new WrappedVariable(v, stage);
      if (v.isCloud) {
        cloudVariables.push(wrapped);
      } else if (v.type === "") {
        globalVariables.push(wrapped);
      } else if (v.type === "list") {
        globalLists.push(wrapped);
      }
    });

    forAllVarsLists((vars) => {
      vars.sort((a, b) => {return a.scratchVariable.name.localeCompare(b.scratchVariable.name)});
      vars.forEach((v) => {
        v.buildDOM();
      });
    });

    updateHeadingVisibility();
    
    const updateTable = (vars, table) => {
      while (table.firstChild) {
        table.removeChild(table.firstChild);
      }
      for (const variable of vars) {
        table.appendChild(variable.row);
        variable.resizeInputIfList();
      }
    };
    updateTable(localVariables, localVarTable);
    updateTable(localLists, localListTable);
    updateTable(globalVariables, globalVarTable);
    updateTable(globalLists, globalListTable);
    updateTable(cloudVariables, cloudTable);
  }

  function quickReload() {
    if (addon.tab.redux.state?.scratchGui?.editorTab?.activeTabIndex !== 3 || preventUpdate) return;

    forAllVarsLists((vars) => {
      for (const variable of vars) {
        variable.updateValue();
      }
    });
  }

  function cleanup() {
    localVariables = [];
    localLists = [];
    globalVariables = [];
    globalLists = [];
    cloudVariables = [];
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
