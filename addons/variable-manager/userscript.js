export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;
  window.vm = vm; // for debugging if i forget to commehnt this out plz yel at me thanks

  /*   let globals = vm.runtime.getTargetForStage().variables
    let local = vm.runtime.getEditingTarget().variables */
  addon.tab.redux.initialize();
  while (true) {
    let tabs = await addon.tab.waitForElement("[class^='react-tabs_react-tabs__tab-list']", {
      markAsSeen: true,
    });
    if (tabs) {
      let soundTab = tabs.children[2];
      let contentArea = document.querySelector("." + addon.tab.scratchClass("gui_tabs"));

      let manager = document.createElement("div");
      manager.classList.add(addon.tab.scratchClass("asset-panel_wrapper"), "sa-var-manager");
      manager.id = "var-manager";

      let localVars = document.createElement("div");
      let localHeading = document.createElement("span");
      let localList = document.createElement("table");
      localHeading.className = "sa-var-manager-heading";
      localHeading.innerText = "variables for this sprite"; // TODO: msg()
      localVars.appendChild(localHeading);
      localVars.appendChild(localList);

      let globalVars = document.createElement("div");
      let globalHeading = document.createElement("span");
      let globalList = document.createElement("table");
      globalHeading.className = "sa-var-manager-heading";
      globalHeading.innerText = "variables for all sprites"; // TODO: msg()
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
        reloadList();
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

      vm.runtime.on("PROJECT_LOADED", async () => reloadList());
      vm.runtime.on("TOOLBOX_EXTENSIONS_NEED_UPDATE", async () => reloadList());
      const oldStep = vm.runtime.constructor.prototype._step;

      vm.runtime.constructor.prototype._step = function (...args) {
        reloadList();
        return oldStep.call(this, ...args);
      };

      let preventUpdate = false;

      function reloadList() {
        if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex == 3) {
          if (!preventUpdate) {
            let locals = JSON.parse(JSON.stringify(Object.values(vm.runtime.getEditingTarget().variables)));
            let globals = JSON.parse(JSON.stringify(Object.values(vm.runtime.getTargetForStage().variables)));

            let variables = [];

            while (localList.hasChildNodes()) {
              // alternative to innerHTML = ""
              localList.removeChild(localList.firstChild);
            }

            while (globalList.hasChildNodes()) {
              // alternative to innerHTML = ""
              globalList.removeChild(globalList.firstChild);
            }

            if (!vm.runtime.getEditingTarget().isStage) {
              // the stage can't have local variables
              locals.forEach((i) => {
                i.varType = "local";
                i.targetID = vm.runtime.getEditingTarget().id;
                variables.push(i);
              });
            }

            globals.forEach((i) => {
              i.varType = "global";
              i.targetID = vm.runtime.getTargetForStage().id;
              variables.push(i);
            });

            localHeading.style.display = "block";
            globalHeading.style.display = "block";

            if (variables.filter((v) => v.varType == "local").length == 0) localHeading.style.display = "none";
            if (variables.filter((v) => v.varType == "global").length == 0) globalHeading.style.display = "none";

            variables.forEach((i) => {
              let row = document.createElement("tr");
              let label = document.createElement("td");
              label.innerText = i.name;

              let value = document.createElement("td");
              value.className = "sa-var-manager-value";

              if (i.type == "") var input = document.createElement("input"); // scratch does not give a type if its not a list
              if (i.type == "list") var input = document.createElement("textarea");

              if (i.type == "list") {
                input.value = i.value.join("\n");
              } else {
                input.value = i.value;
              }

              input.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (i.type == "list") {
                    vm.setVariableValue(i.targetID, i.id, input.value.split("\n"));
                  } else {
                    vm.setVariableValue(i.targetID, i.id, input.value);
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
              if (i.varType == "local") localList.appendChild(row);
              if (i.varType == "global") globalList.appendChild(row);
            });
          }
        }
      }
    }
  }
}
