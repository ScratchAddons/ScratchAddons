export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  function createArrow(direction, callback) {
    const path = direction === "left" ? "M 17 13 L 9 21 L 17 30" : "M 9 13 L 17 21 L 9 30";

    Blockly.WidgetDiv.DIV.insertAdjacentHTML(
      "beforeend",
      `
            <svg width="20px" height="40px" 
                 style="left: ${direction === "left" ? "calc(50% - 20px)" : "calc(50% + 20px)"}" 
                 class="blocklyTextShiftArrow">
                <path d="${path}" fill="none" stroke="#FF661A" stroke-width="2"></path>
            </svg>`
    );

    Blockly.WidgetDiv.DIV.lastChild.addEventListener("click", callback);
  }

  Blockly.ScratchBlocks.ProcedureUtils.shiftFieldCallback = function (field, direction) {
    const proc = this.parentBlock_ ? this.parentBlock_ : this;
    if (proc.inputList.length <= 1) return;

    let inputNameToShift = null;
    let newPosition;
    for (const [i, input] of proc.inputList.entries()) {
      const isTargetField = input.connection
        ? input.connection.targetBlock()?.getField(field.name) === field
        : input.fieldRow.includes(field);

      if (isTargetField) {
        inputNameToShift = input.name;
        newPosition = direction === "left" ? i - 1 : i + 1;
        break;
      }
    }

    if (inputNameToShift && newPosition >= 0 && newPosition < proc.inputList.length) {
      const itemToMove = proc.inputList.splice(
        proc.inputList.findIndex((input) => input.name === inputNameToShift),
        1
      )[0];
      proc.inputList.splice(newPosition, 0, itemToMove);

      proc.onChangeFn();
      proc.updateDisplay_();

      focusOnInput(proc.inputList[newPosition]);
    }
  };

  function focusOnInput(input) {
    if (!input) return;
    if (input.type === Blockly.DUMMY_INPUT) {
      input.fieldRow[0].showEditor_();
    } else if (input.type === Blockly.INPUT_VALUE) {
      const target = input.connection.targetBlock();
      target.getField("TEXT").showEditor_();
    }
  }

  ["procedures_declaration", "argument_editor_boolean", "argument_editor_string_number"].forEach((blockType) => {
    if (Blockly.Blocks[blockType])
      Blockly.Blocks[blockType].shiftFieldCallback = Blockly.ScratchBlocks.ProcedureUtils.shiftFieldCallback;
  });

  const originalShowEditor = Blockly.FieldTextInputRemovable.prototype.showEditor_;
  Blockly.FieldTextInputRemovable.prototype.showEditor_ = function () {
    originalShowEditor.call(this);
    createArrow("left", () => this.sourceBlock_.shiftFieldCallback(this, "left"));
    createArrow("right", () => this.sourceBlock_.shiftFieldCallback(this, "right"));
  };
}
