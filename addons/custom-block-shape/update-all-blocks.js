export function updateAllBlocks(vm, workspace, blockly) {
  const eventsOriginallyEnabled = blockly.Events.isEnabled();
  blockly.Events.disable(); // Clears workspace right-click→undo (see SA/SA#6691)

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

  // There's no particular reason for checking whether events were originally enabled.
  // Unconditionally enabling events at this point could, in theory, cause bugs in the future.
  if (eventsOriginallyEnabled) blockly.Events.enable(); // Re-enable events
}
