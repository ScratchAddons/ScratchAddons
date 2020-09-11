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
  }

  function addVariableList(xmlList, variableModelList, addOneVariableCallback) {
    if (addon.settings.get("separateLocalVariables")) {
      const globalVariableList = variableModelList.filter((entry) => !entry.isLocal);
      const localVariableList = variableModelList.filter((entry) => entry.isLocal);
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

  // The third step is to override the context and dropdown menus on variable and list blocks (if the "Separate Sprite-
  // only Variables" setting is enabled).
  //
  // Variables are sorted throughout the scratch-blocks UI using a utility funciton on Blockly.VariableModel,
  // compareByName. This is the perfect function for us to override to sort global variables before local ones without
  // writing redundant code across various parts of the editor, as below:

  const oldCompareByName = Blockly.VariableModel.compareByName;
  Blockly.VariableModel.compareByName = function (var1, var2) {
    if (var1.isLocal && !var2.isLocal) {
      return 1;
    } else if (var2.isLocal && !var1.isLocal) {
      return -1;
    } else {
      return oldCompareByName(var1, var2);
    }
  };

  // ...*except* for the fact that there is one particularly outstanding case where compareByName is *not* called, but
  // a literally identical anonymous function is passed - namely in the code for sorting the options in variable and
  // list context menus. Rather than write an 80-line special-case solution for that (as we might in other parts of the
  // UI too, without the simple solution above), we're going to opt to override that very sort() call. But it's buried
  // deep into a callback function alongside much other code - how are we going to target that one line?
  //
  // This is a perfect case for using prototype listeners, since we can override Array.prototype.sort so that it sorts
  // by a desired function (Blockly.VariableModel.compareByName) instead of the existing one (the normally identical
  // anonymous function). But we can only do that if we can detect the appropriate call, and how can we do that?
  // If we start by overriding *all* calls to .sort(), we'll run into a dead end quickly: the only values available to
  // the override are the "this" object (i.e. the array itself) and the sorting function itself, which is generally
  // opaque (meaning it can't be distinguished from any other functions - especially in the case of the anonymous sort
  // we are trying to replace here). Short of filtering the array and confirming it contains exclusively VariableModel
  // objects, we don't have any way of telling whether the call is one we want to modify. (And this solution would have
  // far-reaching effects, since it's possible other parts of Scratch have good reason to sort VariableModels in some
  // *other* sorting order - and since the sorting function is opaque, we have no way of only replacing alphabetical
  // sorts!) Worse, intercepting every call to .sort() is sure to be bad for performance, especially if we are running
  // operations like filtering over the contained items to check if it is the type of data we're looking to change the
  // sorting of.
  //
  // Thankfully, we can tackle both of those issues with one solution, which (in general) is this: instead of
  // intercepting *all* calls to the function we're overriding, we react to a moment when it is likely to be called
  // soon, taking use of that opportunity to also intercept calls to *other* functions so we can be sure we're
  // modifying the behavior of exactly the right call. In practice and in the code below, that means...
  //
  // * reading the code path which leads to the call we want to override (it's part of the mixins in blocks_vertical/
  //   data.js)
  // * finding the closest point at which we can apply any necessary overrides (that's Blockly.Constants.Data.CUSTOM_
  //   CONTEXT_MENU_ GET_[VARIABLE/LIST]_MIXIN.customContextMenu)
  // * using those overrides to gather data for matching our call (variablesList is what we're sorting so we need to
  //   keep track of that variable, it's returned by workspace.getVariablesOfType so that's what we're overriding)
  // * reacting appropriately if we do match the call we want to modify (replace the sorting function argument with
  //   the one we overrode above, Blockly.VariableModel.compareByName)
  // * and finally, cleaning up the overrides we added!
  //
  // Note it's possible for any variety of reasons that the call (in this case to .sort()) we're looking for never
  // gets matched at all; even if we don't match it, we still want to clean up after, to avoid leaving spare listeners
  // and overrides lying around and sucking up performance. The safest way to do that is with a try...finally clause,
  // which states that even if errors are thrown, the overrides will still be cleaned. (It's important to take special
  // care of overrides whenever you are adding them in reaction to some event or call - leaving them untended is a sure
  // path to bugs and poor performance.)

  overrideContextMenuMixin("CUSTOM_CONTEXT_MENU_GET_VARIABLE_MIXIN");
  overrideContextMenuMixin("CUSTOM_CONTEXT_MENU_GET_LIST_MIXIN");

  function overrideContextMenuMixin(mixinKey) {
    const mixin = Blockly.Constants.Data[mixinKey];
    const oldCustomContextMenu = mixin.customContextMenu;
    mixin.customContextMenu = function (...args) {
      let variablesList;

      // Apply overrides...

      const oldGetVariablesOfType = this.workspace.getVariablesOfType;
      this.workspace.getVariablesOfType = function (...args) {
        return (variablesList = oldGetVariablesOfType.apply(this, args));
      };

      const handleArraySort = ({ detail: { target, args } }) => {
        if (target === variablesList) {
          args[0] = Blockly.VariableModel.compareByName;
        }
      };
      addon.tab.traps.addPrototypeListener("arraySort", handleArraySort);

      // Call the original function...

      try {
        oldCustomContextMenu.apply(this, args);
      } finally {
        // And get rid of the overrides, since we don't need them anymore!
        this.workspace.getVariablesOfType = oldGetVariablesOfType;
        addon.tab.traps.removePrototypeListener("arraySort", handleArraySort);
      }
    };
  }
};
