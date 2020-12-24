export default async function ({ addon, global, console, msg, safeMsg }) {
  // This needs to be stored in a separate variable updated in getBlocksXML
  // because addon.settings and actual workspace state do not necessarily match.
  let hasSeparateListCategory = false;

  let vm;
  let workspace;

  const separateListCategory = (toolboxXML) => {
    const listButtonIndex = toolboxXML.findIndex((i) => i.getAttribute("callbackkey") === "CREATE_LIST");
    return {
      variables: toolboxXML.slice(0, listButtonIndex),
      lists: toolboxXML.slice(listButtonIndex, toolboxXML.length),
    };
  };

  const separateLocalVariables = (toolboxXML) => {
    const { variables, lists } = separateListCategory(toolboxXML);

    // TODO: get these from Blockly?
    const SMALL_GAP = 8;
    const BIG_GAP = 24;

    const makeLabel = (l10n) => {
      const label = new DOMParser().parseFromString("<label></label>", "text/xml").firstChild;
      label.setAttribute("text", msg(l10n));
      return label;
    };

    const fixGaps = (variables) => {
      if (variables.length > 0) {
        for (var i = 0; i < variables.length - 1; i++) {
          variables[i].setAttribute("gap", SMALL_GAP);
        }
        variables[i].setAttribute("gap", BIG_GAP);
      }
    };

    const separateLocals = (xml) => {
      const variables = xml.filter((i) => i.getAttribute("id"));
      // No blocks means no variables, so don't try to do anything.
      if (variables.length === 0) {
        return xml;
      }

      const makeNewButton = xml[0];
      const blocks = xml.filter((i) => !i.getAttribute("id") && !i.getAttribute("text"));

      const local = [];
      const global = [];
      for (const variableXML of variables) {
        const id = variableXML.getAttribute("id");
        const variable = workspace.getVariableById(id);
        if (variable.isLocal) {
          local.push(variableXML);
        } else {
          global.push(variableXML);
        }
      }

      const result = [makeNewButton];

      if (global.length) {
        result.push(makeLabel("for-all-sprites"));
        fixGaps(global);
        result.push(...global);
      }

      if (local.length) {
        result.push(makeLabel("for-this-sprite-only"));
        fixGaps(local);
        result.push(...local);
      }

      result.push(...blocks);
      return result;
    };

    return [...separateLocals(variables), ...separateLocals(lists)];
  };

  const injectWorkspace = () => {
    if (workspace) {
      // Already injected.
      return;
    }

    workspace = Blockly.getMainWorkspace();

    const DataCategory = workspace.toolboxCategoryCallbacks_.VARIABLE;
    let variableCategory;
    let listCategory;

    const variableCategoryCallback = (workspace) => {
      let result = DataCategory(workspace);
      console.log("Called with", result);

      if (addon.settings.get("separateLocalVariables")) {
        result = separateLocalVariables(result);
      }

      if (!hasSeparateListCategory) {
        return result;
      }

      const { variables, lists } = separateListCategory(result);
      variableCategory = variables;
      listCategory = lists;
      return variableCategory;
    };

    const listCategoryCallback = (workspace) => {
      return listCategory;
    };

    const flyout = workspace.getFlyout();
    const oldShow = flyout.show;
    flyout.show = function (xml) {
      workspace.registerToolboxCategoryCallback("VARIABLE", variableCategoryCallback);
      workspace.registerToolboxCategoryCallback("LIST", listCategoryCallback);
      oldShow.call(this, xml);
    };

    // We use Scratch's extension category mechanism to replace the data category with our own.
    // https://github.com/LLK/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
    // https://github.com/LLK/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
    vm = addon.tab.traps.onceValues.vm;
    const originalGetBlocksXML = vm.runtime.getBlocksXML;
    vm.runtime.getBlocksXML = function (target) {
      const result = originalGetBlocksXML.call(this, target);
      hasSeparateListCategory = addon.settings.get("separateListCategory");
      if (hasSeparateListCategory) {
        result.push({
          id: "data",
          xml: `
          <category
            name="%{BKY_CATEGORY_VARIABLES}"
            id="variables"
            colour="#FF8C1A"
            secondaryColour="#DB6E00"
            custom="VARIABLE">
          </category>
          <category
            name="${/* TODO not sure if this is right?? */ safeMsg("list-category")}"
            id="list"
            colour="#FF661A"
            secondaryColour="#F1570B"
            custom="LIST">
          </category>`,
        });
      }
      return result;
    };
  };

  if (addon.tab.editorMode === "editor") {
    const interval = setInterval(() => {
      if (typeof Blockly === "object" && Blockly.getMainWorkspace()) {
        injectWorkspace();
        clearInterval(interval);
      }
    }, 100);
  }
  addon.tab.addEventListener("urlChange", () => addon.tab.editorMode === "editor" && injectWorkspace());
}
