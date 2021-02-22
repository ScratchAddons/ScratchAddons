export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;
  window.vm = vm; // for debugging if i forget to commehnt this out plz yel at me thanks

  addon.tab.redux.initialize();
  while (true) {
    let tabs = await addon.tab.waitForElement("[class^='react-tabs_react-tabs__tab-list']", {
      markAsSeen: true,
    });

    let soundTab = tabs.children[2];
    let contentArea = document.querySelector("." + addon.tab.scratchClass("gui_tabs"));

    let manager = document.createElement("div");
    manager.classList.add(addon.tab.scratchClass("asset-panel_wrapper"), "sa-var-manager");
    manager.id = "var-manager";

    let localVars = document.createElement("div");
    let localHeading = document.createElement("span");
    let localList = document.createElement("table");
    localHeading.className = "sa-var-manager-heading";
    localHeading.innerText = msg("for-this-sprite");
    localVars.appendChild(localHeading);
    localVars.appendChild(localList);

    let globalVars = document.createElement("div");
    let globalHeading = document.createElement("span");
    let globalList = document.createElement("table");
    globalHeading.className = "sa-var-manager-heading";
    globalHeading.innerText = msg("for-all-sprites");
    globalVars.appendChild(globalHeading);
    globalVars.appendChild(globalList);

    manager.appendChild(localVars);
    manager.appendChild(globalVars);

    let varTab = document.createElement("li");

    varTab.classList.add(addon.tab.scratchClass("react-tabs_react-tabs__tab"), addon.tab.scratchClass("gui_tab"));
    varTab.id = "react-tabs-7";
    if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex == 3) {
      varTab.classList.add(
        addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        addon.tab.scratchClass("gui_is-selected")
      );
    }
    let varTabIcon = document.createElement("img");
    varTabIcon.draggable = false;
    varTabIcon.src = addon.self.dir + "/icon.svg";

    let varTabText = document.createElement("span");
    varTabText.innerText = "Variables";

    varTab.appendChild(varTabIcon);
    varTab.appendChild(varTabText);

    varTab.addEventListener("click", (e) => {
      addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 3 });
      varTab.classList.add(
        addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        addon.tab.scratchClass("gui_is-selected")
      );

      // add the content
      if (!document.querySelector("#var-manager")) contentArea.insertAdjacentElement("beforeend", manager);
      fullReload();
    });

    soundTab.insertAdjacentElement("afterend", varTab);

    addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
      if (detail.action.type == "scratch-gui/navigation/ACTIVATE_TAB") {
        if (detail.action.activeTabIndex !== 3) {
          // is it a different tab than tab 3? if so
          // remove the active class
          varTab.classList.remove(
            addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
            addon.tab.scratchClass("gui_is-selected")
          );

          // remove the content
          if (document.querySelector("#var-manager")) document.querySelector("#var-manager").remove();
        }
      }
    });

    vm.runtime.on("PROJECT_LOADED", () => fullReload());
    vm.runtime.on("TOOLBOX_EXTENSIONS_NEED_UPDATE", () => fullReload());

    const oldStep = vm.runtime.constructor.prototype._step;
    vm.runtime.constructor.prototype._step = function (...args) {
      const ret = oldStep.call(this, ...args);
      quickReload();
      return ret;
    };

    let preventUpdate = false;

    class Variable {
      constructor (scratchVariable, target) {
        this.scratchVariable = scratchVariable;
        this.target = target;
        this.buildDOM();
      }

      updateValue () {
        // TODO do not update if no change
        // TODO check visibility
        if (this.scratchVariable.type == "list") {
          this.input.value = this.scratchVariable.value.join("\n");
        } else {
          this.input.value = this.scratchVariable.value;
        }
      }

      buildDOM () {
        const row = document.createElement("tr");
        this.row = row;
        const label = document.createElement("td");
        label.innerText = this.scratchVariable.name;

        const value = document.createElement("td");
        value.className = "sa-var-manager-value";

        function inputResize() {
          input.style.height = "auto";
          input.style.height = input.scrollHeight + "px";
        }

        let input;
        if (this.scratchVariable.type === 'list') {
          input = document.createElement("textarea");
        } else {
          input = document.createElement("input");
        }
        this.input = input;

        this.updateValue();
        if (this.scratchVariable.type === 'list') {
          this.input.setAttribute("style", "height:" + this.input.scrollHeight + "px;overflow-y:hidden;");
          this.input.addEventListener("input", inputResize, false);
        }

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (this.scratchVariable.type == "list") {
              vm.setVariableValue(this.target.id, this.scratchVariable.id, input.value.split("\n"));
            } else {
              vm.setVariableValue(this.target.id, this.scratchVariable.id, input.value);
            }
            input.blur();
          }
        });

        input.addEventListener("focus", (e) => {
          preventUpdate = true;
          manager.classList.add("freeze");
        });

        input.addEventListener("blur", (e) => {
          preventUpdate = false;
          manager.classList.remove("freeze");
        });

        value.appendChild(input);
        row.appendChild(label);
        row.appendChild(value);
      }
    }

    let localVariables = [];
    let globalVariables = [];

    function fullReload() {
      if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== 3 || preventUpdate) return;
      console.log("full list reload");

      const editingTarget = vm.runtime.getEditingTarget();
      const stage = vm.runtime.getTargetForStage();
      localVariables = Object.values(editingTarget.variables).map(i => new Variable(i, editingTarget));
      globalVariables = Object.values(stage.variables).map(i => new Variable(i, stage));

      localHeading.style.display = localVariables.length === 0 ? 'none' : '';
      globalHeading.style.display = globalVariables.length === 0 ? 'none' : '';

      while (localList.firstChild) {
        localList.removeChild(localList.firstChild);
      }
      while (globalList.firstChild) {
        globalList.removeChild(globalList.firstChild);
      }

      for (const variable of localVariables) {
        localList.appendChild(variable.row);
      }
      for (const variable of globalVariables) {
        globalList.appendChild(variable.row);
      }
    }

    function quickReload() {
      if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== 3 || preventUpdate) return;

      for (const variable of localVariables) {
        variable.updateValue();
      }
      for (const variable of globalVariables) {
        variable.updateValue();
      }
    }
  }
}
