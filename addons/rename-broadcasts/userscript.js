export default async function ({ addon, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  // editor-searchable-dropdowns relies on this value
  const RENAME_BROADCAST_MESSAGE_ID = "RENAME_BROADCAST_MESSAGE_ID";

  const _dropdownCreate = Blockly.FieldVariable.dropdownCreate;
  Blockly.FieldVariable.dropdownCreate = function () {
    const options = _dropdownCreate.call(this);
    if (
      !addon.self.disabled &&
      this.defaultType_ === Blockly.BROADCAST_MESSAGE_VARIABLE_TYPE &&
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
        Blockly.Variables.renameVariable(workspace, this.variable_);
        return;
      }
    }
    return _onItemSelected.call(this, menu, menuItem);
  };

  const _renameVariable = Blockly.Variables.renameVariable;
  Blockly.Variables.renameVariable = function (workspace, variable, opt_callback) {
    const varType = variable.type;
    if (varType === Blockly.BROADCAST_MESSAGE_VARIABLE_TYPE) {
      const modalTitle = msg("RENAME_BROADCAST_MODAL_TITLE");
      const validate = Blockly.Variables.nameValidator_.bind(null, varType);
      const promptText = msg("RENAME_BROADCAST_TITLE", { name: variable.name });
      const promptDefaultText = variable.name;

      Blockly.prompt(
        promptText,
        promptDefaultText,
        function (newName) {
          const validatedText = validate(newName, workspace);
          if (validatedText) {
            workspace.renameVariableById(variable.getId(), validatedText);
            if (opt_callback) {
              opt_callback(newName);
            }
          } else {
            // User canceled prompt without a value.
            if (opt_callback) {
              opt_callback(null);
            }
          }
        },
        modalTitle,
        varType
      );
      return;
    }
    return _renameVariable.call(this, workspace, variable, opt_callback);
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
