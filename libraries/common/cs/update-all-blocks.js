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
      let clearWorkspaceAndLoadFromXml;
      const xml = blockly.Xml.workspaceToDom(workspace);
      if (blockly.registry) {
        // new Blockly: use Scratch's modified implementation instead of the one from Blockly
        clearWorkspaceAndLoadFromXml = blockly.clearWorkspaceAndLoadFromXml;
        if (!xml.querySelector("variables")) {
          xml.appendChild(blockly.utils.xml.createElement("variables"));
        }
      } else {
        clearWorkspaceAndLoadFromXml = blockly.Xml.clearWorkspaceAndLoadFromXml;
      }
      clearWorkspaceAndLoadFromXml(xml, workspace);
    }
    const toolbox = workspace.getToolbox();
    const flyout = workspace.getFlyout();
    if (toolbox && flyout && (updateFlyout || updateCategories)) {
      if (updateFlyout) {
        if (blockly.registry) {
          // new Blockly: can't use clearWorkspaceAndLoadFromXml() here because it breaks the flyout
          // Events have to be reenabled here because flyout.show() creates new blocks with new IDs
          // and the VM needs to be notified about that.
          blockly.Events.enable();
          flyout.setRecyclingEnabled(false);
          flyout.show(toolbox.getInitialFlyoutContents());
          flyout.setRecyclingEnabled(true);
          blockly.Events.disable();
        } else {
          const flyoutWorkspace = flyout.getWorkspace();
          blockly.Xml.clearWorkspaceAndLoadFromXml(blockly.Xml.workspaceToDom(flyoutWorkspace), flyoutWorkspace);
        }
      }
      if (updateCategories) {
        const selectedItemId = toolbox.getSelectedItem().id_;
        if (blockly.registry) {
          // new Blockly
          toolbox.render(workspace.options.languageTree);
          toolbox.selectItem_(null, toolbox.contents.get(selectedItemId));
        } else {
          toolbox.categoryMenu_.populate(workspace.options.languageTree);
          toolbox.selectCategoryById(selectedItemId, false);
        }
      }
      toolbox.refreshSelection();
    }
    workspace.toolboxRefreshEnabled_ = true;
  }

  blockly.Events.enable();
}
