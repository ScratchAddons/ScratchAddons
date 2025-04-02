import updateToolboxXML from "../../libraries/common/cs/update-toolbox-xml.js";
import { isScratchAprilFools25 } from "../hide-flyout/april-fools.js";

export default async function ({ addon, console, msg, safeMsg }) {
  if (await isScratchAprilFools25(addon.tab.redux)) return;

  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const SMALL_GAP = 8;
  const BIG_GAP = 24;

  const vm = addon.tab.traps.vm;

  // Used in setting change handler. Updated in getBlocksXML.
  // (Yes this is weird but it's how it was originally and I'm too scared to change it)
  let hasSeparateListCategory = false;

  const separateVariablesByType = (toolboxXML) => {
    const listButtonIndex = toolboxXML.findIndex(
      (i) => i.getAttribute("callbackkey") === "CREATE_LIST" || i.getAttribute("type") === "data_addtolist"
    );
    return {
      variables: toolboxXML.slice(0, listButtonIndex),
      lists: toolboxXML.slice(listButtonIndex, toolboxXML.length),
    };
  };

  const separateLocalVariables = (workspace, toolboxXML) => {
    const { variables, lists } = separateVariablesByType(toolboxXML);

    const makeLabel = (l10n) => {
      const label = document.createElement("label");
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

    const separateVariablesByScope = (xml) => {
      const before = [];
      const global = [];
      const local = [];
      const after = [];

      for (const blockXML of xml) {
        if (blockXML.hasAttribute("id")) {
          const id = blockXML.getAttribute("id");
          const variable = workspace.getVariableById(id);
          if (!variable || !variable.isLocal) {
            global.push(blockXML);
          } else {
            local.push(blockXML);
          }
        } else if (global.length || local.length) {
          after.push(blockXML);
        } else {
          before.push(blockXML);
        }
      }

      const result = before;

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

      return result.concat(after);
    };

    return separateVariablesByScope(variables).concat(separateVariablesByScope(lists));
  };

  const moveReportersDown = (toolboxXML) => {
    const { variables, lists } = separateVariablesByType(toolboxXML);

    const moveReportersToEnd = (xml) => {
      const reporters = [];
      const everythingElse = [];

      for (const blockXML of xml) {
        if (blockXML.hasAttribute("id") || blockXML.tagName === "BUTTON") {
          // Round reporters and the create variable button
          reporters.push(blockXML);
        } else {
          // Everything else like "change variable by 1"
          everythingElse.push(blockXML);
        }
      }

      if (everythingElse.length) {
        everythingElse[everythingElse.length - 1].setAttribute("gap", BIG_GAP);
      }

      return everythingElse.concat(reporters);
    };

    return moveReportersToEnd(variables).concat(moveReportersToEnd(lists));
  };

  let oldVariableCategoryCallback;
  if (ScratchBlocks.registry) {
    // new Blockly
    oldVariableCategoryCallback = ScratchBlocks.ScratchVariables.getVariablesCategory;
  } else {
    oldVariableCategoryCallback = ScratchBlocks.DataCategory;
  }
  let variableCategory;
  let listCategory;
  const variableCategoryCallback = (workspace) => {
    let result = oldVariableCategoryCallback(workspace);

    if (!addon.self.disabled && addon.settings.get("moveReportersDown")) {
      result = moveReportersDown(result);
    }

    if (!addon.self.disabled && addon.settings.get("separateLocalVariables")) {
      result = separateLocalVariables(workspace, result);
    }

    if (addon.self.disabled || !hasSeparateListCategory) {
      return result;
    }

    const { variables, lists } = separateVariablesByType(result);
    variableCategory = variables;
    listCategory = lists;
    return variableCategory;
  };
  const listCategoryCallback = () => {
    // Computed in variable category callback, which should be called before this method.
    return listCategory;
  };

  // Each time a new workspace is made, these callbacks are reset, so re-register whenever a flyout is shown.
  // https://github.com/scratchfoundation/scratch-blocks/blob/61f02e4cac0f963abd93013842fe536ef24a0e98/core/flyout_base.js#L469
  const oldShow = ScratchBlocks.Flyout.prototype.show;
  ScratchBlocks.Flyout.prototype.show = function (xmlList) {
    let workspace;
    if (ScratchBlocks.registry)
      workspace = this.targetWorkspace; // new Blockly
    else workspace = this.workspace_;
    workspace.registerToolboxCategoryCallback("VARIABLE", variableCategoryCallback);
    workspace.registerToolboxCategoryCallback("LIST", listCategoryCallback);
    return oldShow.call(this, xmlList);
  };

  // Use Scratch's extension category mechanism to replace the data category with our own.
  // https://github.com/scratchfoundation/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
  // https://github.com/scratchfoundation/scratch-gui/blob/2ceab00370ad7bd8ecdf5c490e70fd02152b3e2a/src/lib/make-toolbox-xml.js#L763
  // https://github.com/scratchfoundation/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
  const originalGetBlocksXML = vm.runtime.getBlocksXML;
  vm.runtime.getBlocksXML = function (target) {
    const result = originalGetBlocksXML.call(this, target);
    hasSeparateListCategory = addon.settings.get("separateListCategory");
    if (!addon.self.disabled && hasSeparateListCategory) {
      let dataPrimary;
      let dataTertiary;
      let listsPrimary;
      let listsTertiary;
      if (ScratchBlocks.registry) {
        // New Blockly: we need a workspace (it doesn't matter which one) to get the block styles.
        // tabAPI.traps.getWorkspace() sometimes throws an error if called inside this function.
        const theme = ScratchBlocks.common.getMainWorkspace().getTheme();
        dataPrimary = theme.blockStyles.data.colourPrimary;
        dataTertiary = theme.blockStyles.data.colourTertiary;
        listsPrimary = theme.blockStyles.data_lists.colourPrimary;
        listsTertiary = theme.blockStyles.data_lists.colourTertiary;
      } else {
        dataPrimary = ScratchBlocks.Colours.data.primary;
        dataTertiary = ScratchBlocks.Colours.data.tertiary;
        listsPrimary = ScratchBlocks.Colours.data_lists.primary;
        listsTertiary = ScratchBlocks.Colours.data_lists.tertiary;
      }
      result.push({
        id: "data",
        xml: `
        <category
          name="%{BKY_CATEGORY_VARIABLES}"
          ${ScratchBlocks.registry ? "toolboxitemid" : "id"}="variables"
          colour="${dataPrimary}"
          secondaryColour="${dataTertiary}"
          custom="VARIABLE">
        </category>
        <category
          name="${safeMsg("list-category")}"
          ${ScratchBlocks.registry ? "toolboxitemid" : "id"}="lists"
          colour="${listsPrimary}"
          secondaryColour="${listsTertiary}"
          custom="LIST">
        </category>`,
      });
      result.map = (callback) => {
        // Prevent Scratch from trying to change the color of the added category in high contrast mode.
        // https://github.com/scratchfoundation/scratch-gui/blob/44eb578/src/containers/blocks.jsx#L358-L361
        // https://github.com/scratchfoundation/scratch-gui/blob/44eb578/src/lib/themes/blockHelpers.js#L18-L53
        return Array.prototype.map.call(result, (extension) => {
          if (extension.id === "data") return extension;
          else return callback(extension);
        });
      };
    }
    return result;
  };

  const updateFlyoutContent = () => {
    const workspace = addon.tab.traps.getWorkspace();
    if (!workspace) return;
    if (ScratchBlocks.registry) {
      ScratchBlocks.Events.disable();
      workspace.getToolbox().forceRerender(); // new Blockly
      ScratchBlocks.Events.enable();
    } else {
      workspace.refreshToolboxSelection_();
    }
  };

  addon.settings.addEventListener("change", (e) => {
    // When the separate list category option changes, we need to update the toolbox XML.
    // For all other options, just refresh the toolbox.
    if (addon.settings.get("separateListCategory") !== hasSeparateListCategory) {
      updateToolboxXML(addon.tab);
    } else {
      updateFlyoutContent();
    }
  });

  const updateToolbox = () => {
    // Enabling/disabling is similar to changing settings.
    // If separate list category is enabled, a toolbox XML update is needed.
    // If any other setting is enabled, refresh the toolbox.
    if (addon.settings.get("separateListCategory")) {
      updateToolboxXML(addon.tab);
    }
    if (addon.settings.get("separateLocalVariables") || addon.settings.get("moveReportersDown")) {
      updateFlyoutContent();
    }
  };
  updateToolbox();
  addon.self.addEventListener("disabled", () => {
    updateToolbox();
  });
  addon.self.addEventListener("reenabled", () => {
    updateToolbox();
  });
}
