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

  function shiftFieldCallback(sourceBlock, field, direction) {
    const proc = sourceBlock.parentBlock_ ? sourceBlock.parentBlock_ : sourceBlock;
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

    const initialInputListLength = proc.inputList.length;
    if (inputNameToShift && newPosition >= 0 && newPosition < initialInputListLength) {
      const itemToMove = proc.inputList.splice(
        proc.inputList.findIndex((input) => input.name === inputNameToShift),
        1
      )[0];
      proc.inputList.splice(newPosition, 0, itemToMove);

      Blockly.Events.disable();
      try {
        proc.onChangeFn();
        proc.updateDisplay_();
      } finally {
        Blockly.Events.enable();
      }

      // When moving a label left, updateDisplay_() might merge it with a label that was already there
      let indexAfterMerge;
      if (itemToMove.type === Blockly.DUMMY_INPUT) {
        // for labels, we can't be sure that an input with the same name will exist after merging
        if (direction === "left" && proc.inputList.length !== initialInputListLength) {
          indexAfterMerge = newPosition - 1;
        } else {
          indexAfterMerge = newPosition;
        }
      } else {
        // for arguments, same name will still exist
        indexAfterMerge = proc.inputList.findIndex((input) => input.name === inputNameToShift);
      }
      focusOnInput(proc.inputList[indexAfterMerge]);
    }
  }

  function focusOnInput(input) {
    if (!input) return;
    if (input.type === Blockly.DUMMY_INPUT) {
      input.fieldRow[0].showEditor_();
    } else if (input.type === Blockly.INPUT_VALUE) {
      const target = input.connection.targetBlock();
      target.getField("TEXT").showEditor_();
    }
  }

  const originalShowEditor = Blockly.FieldTextInputRemovable.prototype.showEditor_;

  function enableAddon() {
    Blockly.FieldTextInputRemovable.prototype.showEditor_ = function () {
      originalShowEditor.call(this);
      createArrow("left", () => shiftFieldCallback(this.sourceBlock_, this, "left"));
      createArrow("right", () => shiftFieldCallback(this.sourceBlock_, this, "right"));
    };
  }

  function disableAddon() {
    Blockly.FieldTextInputRemovable.prototype.showEditor_ = originalShowEditor;
    Blockly.WidgetDiv.DIV.querySelectorAll(".blocklyTextShiftArrow").forEach((e) => e.remove());
  }

  addon.self.addEventListener("disabled", disableAddon);
  addon.self.addEventListener("reenabled", enableAddon);
  enableAddon();
}
