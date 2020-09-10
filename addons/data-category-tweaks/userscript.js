export default async ({ addon, console }) => {
  // The first step of this extension is to provide two "new" categories from Blockly (i.e. ScratchBlocks).
  //
  // This code is essentially a transcription of the changes to blocks_vertical/default_toolbox.js in the pull
  // request LLK/scratch-blocks#2099, but with somewhat fewer changes because we opt to reuse existing functions on
  // DataCategory instead of changing them to be defined on the new VariableCategory and ListCategory prototypes.

  const { ScratchBlocks: Blockly, workspace } = addon.tab.traps.onceValues;

  Blockly.LIST_CATEGORY_NAME = "LIST";
  Blockly.Msg.CATEGORY_LISTS = "Lists";

  Blockly.VariableCategory = function (workspace) {
    // VariableCategory (and the ID it is registered as, Blockly.VARIABLE_CATEGORY_NAME) is already referenced within
    // the palette generation code, so here we're overriding the behavior of an existing category - the one which would
    // ordinarily contain both Variable and List blocks. Thus, if the "Separate List Category" option of this addon is
    // disabled, we must be sure to include both variable and list blocks here.

    const xmlList = [];
    addVariableCategory(xmlList, workspace);
    if (!addon.settings.get("separateListCategory")) {
      addListCategory(xmlList, workspace);
    }
    return xmlList;
  };

  Blockly.ListCategory = function (workspace) {
    // ListCategory is an altogether new category, so its behavior doesn't need to be changed when the "Separate List
    // Category" option is disabled - in that case it just won't be referenced at all.

    const xmlList = [];
    addListCategory(xmlList, workspace);
    return xmlList;
  };

  workspace.registerToolboxCategoryCallback(Blockly.VARIABLE_CATEGORY_NAME, Blockly.VariableCategory);
  workspace.registerToolboxCategoryCallback(Blockly.LIST_CATEGORY_NAME, Blockly.ListCategory);

  function addLabel(xmlList, text) {
    var label = Blockly.Xml.textToDom("<xml><label></label></xml>").firstChild;
    label.setAttribute("text", text);
    xmlList.push(label);
  };

  function addVariableList(xmlList, variableModelList, addOneVariableCallback) {
    if (addon.settings.get("separateLocalVariables")) {
      const globalVariableList = variableModelList.filter(entry => !entry.isLocal);
      const localVariableList = variableModelList.filter(entry => entry.isLocal);
      if (globalVariableList.length) {
        addLabel(xmlList, "For all sprites:");
        for (const variableModel of globalVariableList) {
          addOneVariableCallback(xmlList, variableModel);
        }
      }
      if (localVariableList.length) {
        addLabel(xmlList, "For this sprite only:");
        for (const variableModel of localVariableList) {
          addOneVariableCallback(xmlList, variableModel);
        }
      }
    } else {
      for (const variableModel of variableModelList) {
        addOneVariableCallback(xmlList, variableModel);
      }
    }
  }

  function addVariableCategory(xmlList, workspace) {
    const variableModelList = workspace.getVariablesOfType("");
    variableModelList.sort(Blockly.VariableModel.compareByName);

    Blockly.DataCategory.addCreateButton(xmlList, workspace, "VARIABLE");

    addVariableList(xmlList, variableModelList, (xmlList, variable) => {
      Blockly.DataCategory.addDataVariable(xmlList, variable);
    });

    if (variableModelList.length > 0) {
      xmlList[xmlList.length - 1].setAttribute("gap", 24);
      const firstVariable = variableModelList[0];

      Blockly.DataCategory.addSetVariableTo(xmlList, firstVariable);
      Blockly.DataCategory.addChangeVariableBy(xmlList, firstVariable);
      Blockly.DataCategory.addShowVariable(xmlList, firstVariable);
      Blockly.DataCategory.addHideVariable(xmlList, firstVariable);
    }

    Blockly.DataCategory.addSep(xmlList);
  }

  function addListCategory(xmlList, workspace) {
    const variableModelList = workspace.getVariablesOfType(Blockly.LIST_VARIABLE_TYPE);
    variableModelList.sort(Blockly.VariableModel.compareByName);

    Blockly.DataCategory.addCreateButton(xmlList, workspace, "LIST");

    addVariableList(xmlList, variableModelList, (xmlList, variable) => {
      Blockly.DataCategory.addDataList(xmlList, variable);
    });

    if (variableModelList.length > 0) {
      xmlList[xmlList.length - 1].setAttribute("gap", 24);
      const firstVariable = variableModelList[0];

      Blockly.DataCategory.addAddToList(xmlList, firstVariable);
      Blockly.DataCategory.addSep(xmlList);
      Blockly.DataCategory.addDeleteOfList(xmlList, firstVariable);
      Blockly.DataCategory.addDeleteAllOfList(xmlList, firstVariable);
      Blockly.DataCategory.addInsertAtList(xmlList, firstVariable);
      Blockly.DataCategory.addReplaceItemOfList(xmlList, firstVariable);
      Blockly.DataCategory.addSep(xmlList);
      Blockly.DataCategory.addItemOfList(xmlList, firstVariable);
      Blockly.DataCategory.addItemNumberOfList(xmlList, firstVariable);
      Blockly.DataCategory.addLengthOfList(xmlList, firstVariable);
      Blockly.DataCategory.addListContainsItem(xmlList, firstVariable);
      Blockly.DataCategory.addSep(xmlList);
      Blockly.DataCategory.addShowList(xmlList, firstVariable);
      Blockly.DataCategory.addHideList(xmlList, firstVariable);
    }

    Blockly.DataCategory.addSep(xmlList);
  }

  // The second step is to change the categories which scratch-gui displays in the category list.
  //
  // Category data (which categories are displayed and in what order) is controlled by lib/make-toolbox-xml.js, but
  // we can't override this function because it isn't actually defined on an object anywhere. Instead, we'll find
  // better luck looking at the Redux reducer encapsulating toolbox XML state. We can't directly override the behavior
  // defined in reducers/toolbox.js, but we can use an objectAssign prototype listener to change what state gets
  // applied during updates.

  addon.tab.traps.addPrototypeListener("objectAssign", (event) => {
    const { args } = event.detail;
    if (args[2] && args[2].toolboxXML) {
      args[2].toolboxXML = overrideToolboxXML(args[2].toolboxXML);
    }
  });

  function matchCategoryByName(name) {
    return new RegExp(`<category\\s*name="%{${name}}".*?</category>`, "ms");
  }

  function overrideToolboxXML(toolboxXML) {
    if (addon.settings.get("separateListCategory")) {
      if (toolboxXML.includes('custom="LIST"')) {
        return toolboxXML;
      } else {
        console.log("ayy", toolboxXML.match(matchCategoryByName("BKY_CATEGORY_VARIABLES")));
        return toolboxXML.replace(
          matchCategoryByName("BKY_CATEGORY_VARIABLES"),
          `
          $&
          <category
            name="%{BKY_CATEGORY_LISTS}"
            id="lists"
            colour="#FF661A"
            secondaryColour="#FF5500"
            custom="LIST">
          </category>
          `
        );
      }
    } else {
      if (toolboxXML.includes('custom="LIST"')) {
        return toolboxXML.replace(matchCategoryByName("BKY_CATEGORY_LISTS"), "");
      } else {
        return toolboxXML;
      }
    }
  }
};
