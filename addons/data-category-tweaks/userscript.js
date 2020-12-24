export default async function ({ addon, global, console, safeMsg }) {
  // This needs to be stored in a separate variable updated in getBlocksXML
  // because addon.settings and actual workspace state do not necessarily match.
  let hasSeparateListCategory = false;

  // We use Scratch's extension category mechanism to replace the data category with our own.
  // https://github.com/LLK/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
  // https://github.com/LLK/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
  const vm = addon.tab.traps.onceValues.vm;
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
          name="${/* not sure if this is right?? */safeMsg("list-category")}"
          id="list"
          colour="#FF661A"
          secondaryColour="#F1570B"
          custom="LIST">
        </category>`,
      });
    }
    return result;
  };

  const injectWorkspace = () => {
    const workspace = Blockly.getMainWorkspace();
    const VariableCategory = workspace.toolboxCategoryCallbacks_.VARIABLE;

    let variableCategory = [];
    let listCategory = [];

    workspace.registerToolboxCategoryCallback("VARIABLE", function (workspace) {
      const result = VariableCategory(workspace);
      if (!hasSeparateListCategory) {
        return result;
      }
      const listButtonIndex = result.findIndex((i) => i.getAttribute("callbackkey") === "CREATE_LIST");
      variableCategory = result.slice(0, listButtonIndex);
      listCategory = result.slice(listButtonIndex, result.length);
      return variableCategory;
    });

    workspace.registerToolboxCategoryCallback("LIST", function (workspace) {
      return listCategory;
    });
  };

  if (addon.tab.editorMode === "editor") {
    const interval = setInterval(() => {
      if (Blockly.getMainWorkspace()) {
        injectWorkspace();
        clearInterval(interval);
      }
    }, 100);
  }
  addon.tab.addEventListener("urlChange", () => addon.tab.editorMode === "editor" && injectWorkspace());
}
