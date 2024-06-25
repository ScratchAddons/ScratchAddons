export async function updateAllBlocks(
  tab,
  { updateMainWorkspace = true, updateFlyout = true, updateCategories = false } = {}
) {
  const blockly = await tab.traps.getBlockly();
  const workspace = tab.traps.getWorkspace();

  // Calling Events.disable() will:
  // - prevent changes to the workspace from being added to the undo stack;
  // - prevent project change events from being triggered.
  // From scratch-blocks source code: "Every call to this function MUST also call enable."
  blockly.Events.disable();

  if (workspace) {
    if (updateMainWorkspace) {
      blockly.Xml.clearWorkspaceAndLoadFromXml(blockly.Xml.workspaceToDom(workspace), workspace);
    }
    const toolbox = workspace.getToolbox();
    const flyout = workspace.getFlyout();
    if (toolbox && flyout && (updateFlyout || updateCategories)) {
      if (updateFlyout) {
        const flyoutWorkspace = flyout.getWorkspace();
        blockly.Xml.clearWorkspaceAndLoadFromXml(blockly.Xml.workspaceToDom(flyoutWorkspace), flyoutWorkspace);
      }
      if (updateCategories) {
        const selectedItemId = toolbox.getSelectedItem().id_;
        toolbox.categoryMenu_.populate(workspace.options.languageTree);
        toolbox.selectCategoryById(selectedItemId, false);
      }
      toolbox.refreshSelection();
    }
    workspace.toolboxRefreshEnabled_ = true;
  }

  blockly.Events.enable();
}
