import { Transpiler } from "./transpile.js";
import { blockDefinitions } from "./block-definitions.js";

export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;

  const ScratchBlocks = await addon.tab.traps.getBlockly();

  addon.tab.redux.initialize();
  //vm.emitWorkspaceUpdate();
  const UPDATE_TOOLBOX_ACTION = "scratch-gui/toolbox/UPDATE_TOOLBOX";

  const xmlParser = new DOMParser();
  const xmlSerializer = new XMLSerializer();

  function encodeXML(string) {
    return string
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  const reduxStateListener = async (e) => {
    if (e.detail.action.type === UPDATE_TOOLBOX_ACTION && !e.detail.action.saExtraBlocks) {
      const toolboxXML = xmlParser.parseFromString(e.detail.action.toolboxXML, "text/xml");

      const insertAfter = (referenceBlockOpcode, separator, ...newBlocks) => {
        const referenceBlock = toolboxXML.querySelectorAll(`[type="${referenceBlockOpcode}"`)[0];

        const newBlockXMLs = [];
        if (separator) {
          const separatorXML = toolboxXML.createElement("sep");
          separatorXML.setAttribute("gap", 36);
          newBlockXMLs.push(separatorXML);
        }
        for (const newBlock of newBlocks) {
          const newBlockXML = toolboxXML.createElement("block");
          newBlockXML.setAttribute("type", newBlock.type);
          if (newBlock.innerHTML) newBlockXML.innerHTML = newBlock.innerHTML;
          newBlockXMLs.push(newBlockXML);
        }

        referenceBlock.after(...newBlockXMLs);
      };

      for (const [
        opcode,
        {
          flyout: { after, separator, defaultInputs },
        },
      ] of Object.entries(blockDefinitions)) {
        insertAfter(after, separator, {
          type: opcode,
          innerHTML: Object.entries(defaultInputs ?? {})
            .map(
              ([input, [shadow, field, value]]) =>
                `<value name="${input}"><shadow type="${shadow}"><field name="${field}">${value}</field></shadow></value>`
            )
            .join("\n"),
        });
      }

      addon.tab.redux.dispatch({
        type: UPDATE_TOOLBOX_ACTION,
        toolboxXML: xmlSerializer.serializeToString(toolboxXML),
        saExtraBlocks: true,
      });
    }
  };

  const updateToolbox = () => {
    if (vm.editingTarget) {
      addon.tab.redux.dispatch({
        type: UPDATE_TOOLBOX_ACTION,
        toolboxXML: addon.tab.redux.state.scratchGui.toolbox.toolboxXML,
      });
    }
  };

  const onEnabled = () => {
    addon.tab.redux.addEventListener("statechanged", reduxStateListener);
    updateToolbox();
  };

  onEnabled();

  await new Promise((resolve) => {
    if (addon.tab.traps.vm.editingTarget) return resolve();
    addon.tab.traps.vm.runtime.once("PROJECT_LOADED", resolve);
  });
  console.log(msg("operator_gte"));
  for (const [opcode, info] of Object.entries(blockDefinitions)) {
    ScratchBlocks.Blocks[opcode] = {
      init: function () {
        this.jsonInit({
          message0: msg(opcode),
          ...info.initData,
        });
      },
    };
  }

  const transpiler = new Transpiler(vm, blockDefinitions);
  transpiler.init();
}
