export default async ({ addon, console }) => {
  // The first step of this extension is to provide two new categories from Blockly (i.e. ScratchBlocks).
  //
  // This code is essentially a transcription of the changes to blocks_vertical/default_toolbox.js in the pull
  // request LLK/scratch-blocks#2099, but with somewhat fewer changes because we opt to reuse existing functions on
  // DataCategory instead of changing them to be defined on the new VariableCategory and ListCategory prototypes.

  const { ScratchBlocks: Blockly, workspace } = addon.tab.traps.onceValues;

  Blockly.LIST_CATEGORY_NAME = "LIST";
  Blockly.Msg.CATEGORY_LISTS = "Lists";

  Blockly.VariableCategory = function (workspace) {
    const variableModelList = workspace.getVariablesOfType("");
    variableModelList.sort(Blockly.VariableModel.compareByName);
    const xmlList = [];

    Blockly.DataCategory.addCreateButton(xmlList, workspace, "VARIABLE");

    for (const variableModel of variableModelList) {
      Blockly.DataCategory.addDataVariable(xmlList, variableModel);
    }

    if (variableModelList.length > 0) {
      xmlList[xmlList.length - 1].setAttribute("gap", 24);
      const firstVariable = variableModelList[0];

      Blockly.DataCategory.addSetVariableTo(xmlList, firstVariable);
      Blockly.DataCategory.addChangeVariableBy(xmlList, firstVariable);
      Blockly.DataCategory.addShowVariable(xmlList, firstVariable);
      Blockly.DataCategory.addHideVariable(xmlList, firstVariable);
    }
    Blockly.DataCategory.addSep(xmlList);

    return xmlList;
  };

  Blockly.ListCategory = function (workspace) {
    const variableModelList = workspace.getVariablesOfType(Blockly.LIST_VARIABLE_TYPE);
    variableModelList.sort(Blockly.VariableModel.compareByName);
    const xmlList = [];

    Blockly.DataCategory.addCreateButton(xmlList, workspace, "LIST");

    for (const variableModel of variableModelList) {
      Blockly.DataCategory.addDataList(xmlList, variableModel);
    }

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

    return xmlList;
  };

  workspace.registerToolboxCategoryCallback(Blockly.VARIABLE_CATEGORY_NAME, Blockly.VariableCategory);
  workspace.registerToolboxCategoryCallback(Blockly.LIST_CATEGORY_NAME, Blockly.ListCategory);

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

  function overrideToolboxXML(toolboxXML) {
    if (toolboxXML.includes('custom="LIST"')) {
      return toolboxXML;
    }

    return toolboxXML.replace(
      /<category\s*name="%{BKY_CATEGORY_VARIABLES}"[\s\S]*?<\/category>/m,
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
};
