import { modifiedCreateAllInputs, modifiedUpdateDeclarationProcCode } from "./modified-funcs.js";

export default async function ({ addon, console }) {
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

  //https://github.com/scratchfoundation/scratch-blocks/blob/f210e042988b91bcdc2abeca7a2d85e178edadb2/blocks_vertical/procedures.js#L674
  function modifiedRemoveFieldCallback(field) {
    // Do not delete if there is only one input
    if (this.inputList.length === 1) {
      return;
    }
    var inputNameToRemove = null;
    for (var n = 0; n < this.inputList.length; n++) {
      var input = this.inputList[n];
      if (input.connection) {
        var target = input.connection.targetBlock();
        if (target.getField(field.name) == field) {
          inputNameToRemove = input.name;
        }
      } else {
        for (var j = 0; j < input.fieldRow.length; j++) {
          if (input.fieldRow[j] == field) {
            inputNameToRemove = input.name;
          }
        }
      }
    }
    if (inputNameToRemove) {
      Blockly.WidgetDiv.hide(true);
      this.removeInput(inputNameToRemove);
      this.onChangeFn(true); // this is the only part we changed. We added this boolean input, which lets us switch on the merging.
      this.updateDisplay_();
    }
  }

  function addInputAfter(addInputFn, fnName) {
    return function () {
      const sourceBlock = selectedField?.sourceBlock_;
      const proc = sourceBlock ? (sourceBlock.parentBlock_ ? sourceBlock.parentBlock_ : sourceBlock) : this;

      // if a label is added, scratch's code will directly append the label text to the procCode
      // We account for this with a hacky method of adding the delimiter at the end of the last label input
      if (fnName === "addLabelExternal") {
        const lastInput = proc.inputList[proc.inputList.length - 1];
        if (lastInput.type === Blockly.DUMMY_INPUT) {
          lastInput.fieldRow[0].setValue(lastInput.fieldRow[0].getValue() + " %l");
        }
      }

      proc.onChangeFn(true);
      if (sourceBlock === null || sourceBlock === undefined || !addon.settings.get("InsertInputsAfter"))
        return addInputFn.call(this, ...arguments);

      let newPosition = getFieldInputNameAndIndex(selectedField, proc.inputList).index + 1;

      addInputFn.call(proc, ...arguments);

      const lastInputName = proc.inputList[proc.inputList.length - 1].name;
      shiftInput(proc, lastInputName, newPosition);
    };
  }

  function getFieldInputNameAndIndex(field, inputList) {
    for (const [i, input] of inputList.entries()) {
      const isTargetField = input.connection
        ? input.connection.targetBlock()?.getField(field.name) === field
        : input.fieldRow.includes(field);

      if (isTargetField) {
        return {
          name: input.name,
          index: i,
        };
      }
    }
  }

  function shiftInput(procedureBlock, inputNameToShift, newPosition) {
    const initialInputListLength = procedureBlock.inputList.length;

    // return if inputNameToShift and newPosition are not valid
    if (!(inputNameToShift && newPosition >= 0 && newPosition <= initialInputListLength)) {
      return false;
    }

    const originalPosition = procedureBlock.inputList.findIndex((input) => input.name === inputNameToShift);
    const itemToMove = procedureBlock.inputList.splice(originalPosition, 1)[0];
    procedureBlock.inputList.splice(newPosition, 0, itemToMove);

    Blockly.Events.disable();
    try {
      procedureBlock.onChangeFn(true);
      procedureBlock.updateDisplay_();
    } finally {
      Blockly.Events.enable();
    }

    focusOnInput(procedureBlock.inputList[newPosition]);
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

  function shiftFieldCallback(sourceBlock, field, direction) {
    const proc = sourceBlock.parentBlock_ ? sourceBlock.parentBlock_ : sourceBlock;

    // if inputList length is 1 there's nowhere to shift the input so we can simply return
    if (proc.inputList.length <= 1) return;

    const { name, index } = getFieldInputNameAndIndex(field, proc.inputList);
    const newPosition = direction === "left" ? index - 1 : index + 1;
    shiftInput(proc, name, newPosition);
  }

  function polluteProcedureDeclaration(procedureDeclaration, save_original = true) {
    procedureDeclaration.createAllInputs_ = modifiedCreateAllInputs;
    procedureDeclaration.onChangeFn = modifiedUpdateDeclarationProcCode;
    procedureDeclaration.removeFieldCallback = modifiedRemoveFieldCallback;

    for (const inputFn of ["addLabelExternal", "addBooleanExternal", "addStringNumberExternal"]) {
      if (save_original) {
        originalAddFns[inputFn] = procedureDeclaration[inputFn];
      }
      procedureDeclaration[inputFn] = addInputAfter(procedureDeclaration[inputFn], inputFn);
    }
  }

  function depolluteProcedureDeclaration(procedureDeclaration) {
    procedureDeclaration.createAllInputs_ = originalCreateAllInputs;
    procedureDeclaration.onChangeFn = originalUpdateDeclarationProcCode;
    procedureDeclaration.removeFieldCallback = originalRemoveFieldCallback;

    for (const [inputFnName, originalFn] of Object.entries(originalAddFns)) {
      procedureDeclaration[inputFnName] = originalFn;
    }
  }

  function getExistingProceduresDeclarationBlock() {
    // Blockly.getMainWorkspace is required for this to work.
    // for future reference "upgrading" to addon.tab.traps.getWorkspace() will cause bugs.
    return Blockly.getMainWorkspace()
      .getAllBlocks()
      .find((block) => block.type === "procedures_declaration");
  }

  function enableAddon() {
    // pollute the procedures_declaration prototype with a modified version that prevents merging, and allows inserting after
    polluteProcedureDeclaration(Blockly.Blocks["procedures_declaration"]);

    // if custom procedures modal is already open we also directly pollute the existing procedures_declaration block
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {
      polluteProcedureDeclaration(getExistingProceduresDeclarationBlock(), false);
    }

    Blockly.FieldTextInputRemovable.prototype.showEditor_ = function () {
      originalShowEditor.call(this);
      createArrow("left", () => shiftFieldCallback(this.sourceBlock_, this, "left"));
      createArrow("right", () => shiftFieldCallback(this.sourceBlock_, this, "right"));
      selectedField = this;
    };
  }

  function disableAddon() {
    // depollute the procedures_declaration prototype
    depolluteProcedureDeclaration(Blockly.Blocks["procedures_declaration"]);

    // if custom procedures modal is already open we also directly depollute the existing procedures_declaration block
    if (addon.tab.redux.state.scratchGui.customProcedures.active) {
      depolluteProcedureDeclaration(getExistingProceduresDeclarationBlock());
    }

    Blockly.FieldTextInputRemovable.prototype.showEditor_ = originalShowEditor;
    Blockly.WidgetDiv.DIV.querySelectorAll(".blocklyTextShiftArrow").forEach((e) => e.remove());
  }

  const Blockly = await addon.tab.traps.getBlockly();
  const originalCreateAllInputs = Blockly.Blocks["procedures_declaration"].createAllInputs_;
  const originalUpdateDeclarationProcCode = Blockly.Blocks["procedures_declaration"].onChangeFn;
  const originalRemoveFieldCallback = Blockly.Blocks["procedures_declaration"].removeFieldCallback;
  const originalShowEditor = Blockly.FieldTextInputRemovable.prototype.showEditor_;
  let originalAddFns = {};
  let selectedField = null;

  addon.self.addEventListener("disabled", disableAddon);
  addon.self.addEventListener("reenabled", enableAddon);
  enableAddon();
}
