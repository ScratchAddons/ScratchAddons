export default async function ({ addon, msg, global, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  Blockly.RENAME_BROADCAST_MESSAGE_ID = "RENAME_BROADCAST_MESSAGE_ID";

  const _dropdownCreate = Blockly.FieldVariable.dropdownCreate;
  Blockly.FieldVariable.dropdownCreate = function () {
    const options = _dropdownCreate.call(this);
    console.log(options);
    if (this.defaultType_ == Blockly.BROADCAST_MESSAGE_VARIABLE_TYPE) {
      options.push([msg("RENAME_BROADCAST"), Blockly.RENAME_BROADCAST_MESSAGE_ID]);
    }
    return options;
  };

  const _onItemSelected = Blockly.FieldVariable.prototype.onItemSelected;
  Blockly.FieldVariable.prototype.onItemSelected = function (menu, menuItem) {
    var workspace = this.sourceBlock_.workspace;
    if (this.sourceBlock_ && workspace) {
      if (menuItem.getValue() === Blockly.RENAME_BROADCAST_MESSAGE_ID) {
        Blockly.Variables.renameVariable(workspace, this.variable_);
        return;
      }
    }
    _onItemSelected.call(this, menu, menuItem);
  };

  const _renameVariable = Blockly.Variables.renameVariable;
  Blockly.Variables.renameVariable = function (workspace, variable, opt_callback) {
    console.log(variable);
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
          var validatedText = validate(newName, workspace);
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
    _renameVariable.call(this, workspace, variable, opt_callback);
  };
}
