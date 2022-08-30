export default async function ({ addon, msg, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  const opcodeToSettings = {
    text: "text",
    argument_editor_string_number: "text",
    colour_picker: "color",
  };

  const originalJsonInit = ScratchBlocks.BlockSvg.prototype.jsonInit;

  ScratchBlocks.BlockSvg.prototype.jsonInit = function (json) {
    if (!addon.self.disabled && opcodeToSettings[this.type] && addon.settings.get(opcodeToSettings[this.type])) {
      originalJsonInit.call(this, {
        ...json,
        outputShape: ScratchBlocks.OUTPUT_SHAPE_SQUARE,
      });
    } else {
      originalJsonInit.call(this, json);
    }
  };

  // taken from custom-block-shape
  function updateAllBlocks() {
    const workspace = ScratchBlocks.getMainWorkspace();
    if (workspace) {
      if (vm.editingTarget) {
        vm.emitWorkspaceUpdate();
      }
      const flyout = workspace.getFlyout();
      if (flyout) {
        const flyoutWorkspace = flyout.getWorkspace();
        ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(
          ScratchBlocks.Xml.workspaceToDom(flyoutWorkspace),
          flyoutWorkspace
        );
        workspace.getToolbox().refreshSelection();
        workspace.toolboxRefreshEnabled_ = true;
      }
    }
  }

  addon.self.addEventListener("disabled", updateAllBlocks);
  addon.self.addEventListener("reenabled", updateAllBlocks);
  addon.settings.addEventListener("change", updateAllBlocks);
}
