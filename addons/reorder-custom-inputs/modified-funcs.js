// https://github.com/scratchfoundation/scratch-blocks/blob/f210e042988b91bcdc2abeca7a2d85e178edadb2/blocks_vertical/procedures.js#L205
export function modifiedCreateAllInputs(connectionMap) {
  // Split the proc into components, by %n, %b, %s and %l (ignoring escaped).
  var procComponents = this.procCode_.split(/(?=[^\\]%[nbsl])/);
  procComponents = procComponents.map(function (c) {
    return c.trim(); // Strip whitespace.
  });

  // Create arguments and labels as appropriate.
  var argumentCount = 0;
  for (var i = 0, component; (component = procComponents[i]); i++) {
    var labelText;
    // Don't treat %l as an argument
    if (component.substring(0, 1) == "%" && component.substring(1, 2) !== "l") {
      var argumentType = component.substring(1, 2);
      if (!(argumentType == "n" || argumentType == "b" || argumentType == "s")) {
        throw new Error("Found an custom procedure with an invalid type: " + argumentType);
      }
      labelText = component.substring(2).trim();

      var id = this.argumentIds_[argumentCount];

      var input = this.appendValueInput(id);
      if (argumentType == "b") {
        input.setCheck("Boolean");
      }
      this.populateArgument_(argumentType, argumentCount, connectionMap, id, input);
      argumentCount++;
    } else {
      labelText = component == "%l" ? " " : component.replace("%l", "").trim();
    }
    this.addProcedureLabel_(labelText.replace(/\\%/, "%"));
  }

  // remove all traces of %l at the earliest possible time
  this.procCode_ = this.procCode_.replaceAll("%l ", "");
}

//https://github.com/scratchfoundation/scratch-blocks/blob/f210e042988b91bcdc2abeca7a2d85e178edadb2/blocks_vertical/procedures.js#L565
export function modifiedUpdateDeclarationProcCode(prefixLabels = false) {
  this.procCode_ = "";
  this.displayNames_ = [];
  this.argumentIds_ = [];
  for (var i = 0; i < this.inputList.length; i++) {
    if (i != 0) {
      this.procCode_ += " ";
    }
    var input = this.inputList[i];
    if (input.type == 5) {
      // replaced Blocky.DUMMY_VALUE with 5
      this.procCode_ += (prefixLabels ? "%l " : "") + input.fieldRow[0].getValue(); // modified to prepend %l delimiter, which prevents label merging
    } else if (input.type == 1) {
      // replaced Blocky.INPUT_VALUE with 1
      // Inspect the argument editor.
      var target = input.connection.targetBlock();
      this.displayNames_.push(target.getFieldValue("TEXT"));
      this.argumentIds_.push(input.name);
      if (target.type == "argument_editor_boolean") {
        this.procCode_ += "%b";
      } else {
        this.procCode_ += "%s";
      }
    } else {
      throw new Error("Unexpected input type on a procedure mutator root: " + input.type);
    }
  }
}
