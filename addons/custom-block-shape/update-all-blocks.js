export function updateAllBlocks(vm) {
  const workspace = window.Blockly.getMainWorkspace();
  if (workspace) {
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }
    const flyout = workspace.getFlyout();
    if (flyout) {
      const flyoutWorkspace = flyout.getWorkspace();
      window.Blockly.Xml.clearWorkspaceAndLoadFromXml(
        window.Blockly.Xml.workspaceToDom(flyoutWorkspace),
        flyoutWorkspace
      );
      workspace.getToolbox().refreshSelection();
      workspace.toolboxRefreshEnabled_ = true;
    }
  }
}
