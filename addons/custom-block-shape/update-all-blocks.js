export function updateAllBlocks(blockly, workspace, { updateFlyout = true } = {}) {
  // Calling Events.disable() will:
  // - prevent changes to the workspace from being added to the undo stack;
  // - prevent project change events from being triggered.
  // From scratch-blocks source code: "Every call to this function MUST also call enable."
  blockly.Events.disable();

  if (workspace) {
    blockly.Xml.clearWorkspaceAndLoadFromXml(blockly.Xml.workspaceToDom(workspace), workspace);
    const flyout = workspace.getFlyout();
    if (updateFlyout && flyout) {
      const flyoutWorkspace = flyout.getWorkspace();
      blockly.Xml.clearWorkspaceAndLoadFromXml(blockly.Xml.workspaceToDom(flyoutWorkspace), flyoutWorkspace);
      workspace.getToolbox().refreshSelection();
    }
    workspace.toolboxRefreshEnabled_ = true;
  }

  blockly.Events.enable();
}
