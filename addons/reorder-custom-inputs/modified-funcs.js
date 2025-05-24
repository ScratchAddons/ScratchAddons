const inputTypes = {
  DUMMY: 5,
  VALUE: 1,
};

const ArgumentType = {
  STRING: "s",
  NUMBER: "n",
  BOOLEAN: "b",
};

// https://github.com/scratchfoundation/scratch-blocks/blob/f210e042988b91bcdc2abeca7a2d85e178edadb2/blocks_vertical/procedures.js#L205
// https://github.com/scratchfoundation/scratch-blocks/blob/0f6a3f3/src/blocks/procedures.ts#L257
export function modifiedCreateAllInputs(connectionMap) {
  // Split the proc into components, by %n, %b, %s and %l (ignoring escaped).
  const procComponents = this.procCode_.split(/(?=[^\\]%[nbsl])/).map(function (c) {
    return c.trim(); // Strip whitespace.
  });
  // Create arguments and labels as appropriate.
  let argumentCount = 0;
  for (const component of procComponents) {
    let labelText;
    // Don't treat %l as an argument
    if (component.substring(0, 1) === "%" && component.substring(1, 2) !== "l") {
      const argumentType = component.substring(1, 2);
      if (
        !(
          argumentType === ArgumentType.NUMBER ||
          argumentType === ArgumentType.BOOLEAN ||
          argumentType === ArgumentType.STRING
        )
      ) {
        throw new Error("Found an custom procedure with an invalid type: " + argumentType);
      }
      labelText = component.substring(2).trim();

      const id = this.argumentIds_[argumentCount];

      const input = this.appendValueInput(id);
      if (argumentType === ArgumentType.BOOLEAN) {
        input.setCheck("Boolean");
      }
      this.populateArgument_(argumentType, argumentCount, connectionMap, id, input);
      argumentCount++;
    } else {
      labelText = component === "%l" ? " " : component.replace("%l", "").trim();
    }
    this.addProcedureLabel_(labelText.replace(/\\%/, "%"));
  }

  // remove all traces of %l at the earliest possible time
  this.procCode_ = this.procCode_.replaceAll("%l ", "");
}

//https://github.com/scratchfoundation/scratch-blocks/blob/f210e042988b91bcdc2abeca7a2d85e178edadb2/blocks_vertical/procedures.js#L565
//https://github.com/scratchfoundation/scratch-blocks/blob/0f6a3f3/src/blocks/procedures.ts#L676
export function modifiedUpdateDeclarationProcCode(prefixLabels = false) {
  this.procCode_ = "";
  this.displayNames_ = [];
  this.argumentIds_ = [];
  for (let i = 0; i < this.inputList.length; i++) {
    if (i !== 0) {
      this.procCode_ += " ";
    }
    const input = this.inputList[i];
    if (input.type === inputTypes.DUMMY) {
      // replaced Blocky.inputs.inputTypes with inputTypes
      this.procCode_ += (prefixLabels ? "%l " : "") + input.fieldRow[0].getValue(); // modified to prepend %l delimiter, which prevents label merging
    } else if (input.type === inputTypes.VALUE) {
      // replaced Blocky.inputs.inputTypes with inputTypes
      // Inspect the argument editor.
      const target = input.connection.targetBlock();
      this.displayNames_.push(target.getFieldValue("TEXT"));
      this.argumentIds_.push(input.name);
      if (target.type === "argument_editor_boolean") {
        this.procCode_ += "%b";
      } else {
        this.procCode_ += "%s";
      }
    } else {
      throw new Error("Unexpected input type on a procedure mutator root: " + input.type);
    }
  }
}
