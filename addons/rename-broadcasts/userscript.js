export default async function ({ addon, msg }) {
  const vm = addon.tab.traps.vm;
  const Blockly = await addon.tab.traps.getBlockly();

  // editor-searchable-dropdowns relies on this value
  const RENAME_BROADCAST_MESSAGE_ID = "RENAME_BROADCAST_MESSAGE_ID";

  const BROADCAST_VARIABLE_TYPE = Blockly.BROADCAST_MESSAGE_VARIABLE_TYPE;

  const _dropdownCreate = Blockly.FieldVariable.dropdownCreate;
  Blockly.FieldVariable.dropdownCreate = function () {
    const options = _dropdownCreate.call(this);
    if (
      !addon.self.disabled &&
      this.defaultType_ === BROADCAST_VARIABLE_TYPE &&
      // Disable when workspace has no actual broadcast to rename
      this.sourceBlock_.workspace.getVariableTypes().includes("broadcast_msg")
    ) {
      options.push([msg("RENAME_BROADCAST"), RENAME_BROADCAST_MESSAGE_ID]);
    }
    return options;
  };

  const _onItemSelected = Blockly.FieldVariable.prototype.onItemSelected;
  Blockly.FieldVariable.prototype.onItemSelected = function (menu, menuItem) {
    const workspace = this.sourceBlock_.workspace;
    if (this.sourceBlock_ && workspace) {
      if (menuItem.getValue() === RENAME_BROADCAST_MESSAGE_ID) {
        promptRenameBroadcast(workspace, this.variable_);
        return;
      }
    }
    return _onItemSelected.call(this, menu, menuItem);
  };

  const renameBroadcast = (workspace, id, newName) => {
    // Rename it in the editor
    workspace.renameVariableById(id, newName);

    // Scratch does not natively support broadcast renaming so we have to do
    // some extra things.

    // Finish renaming it in the VM
    const vmVariable = vm.runtime.getTargetForStage().variables[id];
    vmVariable.name = newName;
    vmVariable.value = newName;

    // Update all references to the broadcast. Broadcasts won't work if these
    // don't match.
    const blockContainers = new Set(vm.runtime.targets.map(i => i.blocks));
    for (const blockContainer of blockContainers) {
      for (const block of Object.values(blockContainer._blocks)) {
        const broadcastOption = block.fields && block.fields.BROADCAST_OPTION;
        if (broadcastOption && broadcastOption.id === id) {
          broadcastOption.value = newName;
        }
      }

      // Scratch internally caches fields. We need to clear that to make sure
      // our changes go into effect.
      blockContainer.resetCache();
    }
  };

  const promptRenameBroadcast = (workspace, variable) => {
    const modalTitle = msg("RENAME_BROADCAST_MODAL_TITLE");
    const nameValidator = Blockly.Variables.nameValidator_.bind(null, BROADCAST_VARIABLE_TYPE);
    const oldName = variable.name;
    const promptText = msg("RENAME_BROADCAST_TITLE", { name: oldName });
    const promptDefaultText = oldName;

    Blockly.prompt(
      promptText,
      promptDefaultText,
      function (newName) {
        const validatedText = nameValidator(newName, workspace);
        if (validatedText) {
          renameBroadcast(workspace, variable.getId(), validatedText);
        }
      },
      modalTitle,
      BROADCAST_VARIABLE_TYPE
    );
  };

  if (addon.self.enabledLate) {
    const workspace = Blockly.getMainWorkspace();
    const blocks = workspace.getAllBlocks();
    for (const block of blocks) {
      for (const input of block.inputList) {
        for (const field of input.fieldRow) {
          if (field instanceof Blockly.FieldVariable) {
            field.menuGenerator_ = Blockly.FieldVariable.dropdownCreate;
          }
        }
      }
    }
  }
}
