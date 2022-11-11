class BlockInput {
  constructor(Blockly, type, inputIdx, fieldIdx) {
    if (this.constructor == BlockInput) throw new Error("Abstract classes can't be instantiated.");
    this.type = type;
    this.inputIdx = inputIdx;
    this.fieldIdx = fieldIdx;
    this.Blockly = Blockly;
  }

  setValue(block, value) {
    throw new Error("Sub-class must override abstract method.");
  }

  getInput(block) {
    return block.inputList[this.inputIdx];
  }

  getField(block) {
    if (this.fieldIdx === -1) {
      return this.getInput(block).connection.targetBlock().inputList[0].fieldRow[0];
    } else {
      return this.getInput(block).fieldRow[this.fieldIdx];
    }
  }
}

class BlockInputRound extends BlockInput {
  constructor(Blockly, type, inputIdx, fieldIdx) {
    super(Blockly, type, inputIdx, fieldIdx);
    if (this.constructor == BlockInputRound) throw new Error("Abstract classes can't be instantiated.");
  }

  setValue(block, value) {
    if (value instanceof this.Blockly.BlockSvg) {
      if (!value.outputConnection) throw new Error('Cannot put block "' + value.id + '" into a round type input.');
      value.outputConnection.connect(this.getInput(block).connection);
    } else {
      this.getField(block).setValue(this._toFieldValue(value));
    }
  }

  _toFieldValue(value) {
    throw new Error("Sub-class must override abstract method.");
  }
}

class BlockInputString extends BlockInputRound {
  constructor(Blockly, inputIdx, fieldIdx) {
    super(Blockly, BlockTypeInfo.BLOCK_INPUT_STRING, inputIdx, fieldIdx);
  }

  _toFieldValue(value) {
    const type = typeof value;
    if (type === "number") return value;
    if (type === "string") return value;
    throw new Error("Cannot set round type input to value of type " + type);
  }
}

class BlockInputNumber extends BlockInputRound {
  constructor(Blockly, inputIdx, fieldIdx) {
    super(Blockly, BlockTypeInfo.BLOCK_INPUT_NUMBER, inputIdx, fieldIdx);
  }

  _toFieldValue(value) {
    const type = typeof value;
    if (type === "number") return value;
    if (type === "string") {
      const number = parseFloat(value);
      if (isNaN(number)) throw new Error('Cannot set numeric type input to string "' + value + '".');
      return value;
    }
    throw new Error("Cannot set round type input to value of type " + type);
  }
}

class BlockInputBoolean extends BlockInput {
  constructor(Blockly, inputIdx, fieldIdx) {
    super(Blockly, BlockTypeInfo.BLOCK_INPUT_BOOLEAN, inputIdx, fieldIdx);
  }

  setValue(block, value) {
    if (value instanceof this.Blockly.BlockSvg) {
      if (!value.outputConnection || value.edgeShape_ !== BlockTypeInfo.BLOCK_SHAPE_BOOLEAN)
        throw new Error('Cannot put block "' + value.id + '" into a boolean type input.');
      value.outputConnection.connect(this.getInput(block).connection);
    } else {
      throw new Error("Boolean type inputs can only contain blocks.");
    }
  }
}

class BlockInputColour extends BlockInput {
  constructor(Blockly, inputIdx, fieldIdx) {
    super(Blockly, BlockTypeInfo.BLOCK_INPUT_COLOUR, inputIdx, fieldIdx);
  }

  setValue(block, value) {
    if (typeof value !== "string") throw new Error("Cannot set color type input to value of type " + typeof type);
    if (!value.match(/^#[0-9a-fA-F]{6}$/)) throw new Error('Invalid color "' + value + '".');
    this.getField(block).setValue(value);
  }
}

class BlockInputEnum extends BlockInput {
  static INVALID_VALUES = [
    "DELETE_VARIABLE_ID",
    "RENAME_VARIABLE_ID",
    "NEW_BROADCAST_MESSAGE_ID",
    "NEW_BROADCAST_MESSAGE_ID",
    // editor-searchable-dropdowns compatibility
    "createGlobalVariable",
    "createLocalVariable",
    "createGlobalList",
    "createLocalList",
    "createBroadcast",
  ];

  constructor(Blockly, options, inputIdx, fieldIdx) {
    super(Blockly, BlockTypeInfo.BLOCK_INPUT_ENUM, inputIdx, fieldIdx);
    this.values = [];
    for (let i = 0; i < options.length; i++) {
      if (typeof options[i][1] === "string" && BlockInputEnum.INVALID_VALUES.indexOf(options[i][1]) === -1) {
        this.values.push({ value: options[i][1], string: options[i][0] });
      }
    }
  }

  setValue(block, value) {
    if (this.values.indexOf(value) === -1) throw new Error("Invalid enum value. Expected item from the options list.");
    this.getField(block).setValue(value.value);
  }
}

class BlockInputBlock extends BlockInput {
  constructor(Blockly, inputIdx, fieldIdx) {
    super(Blockly, BlockTypeInfo.BLOCK_INPUT_BLOCK, inputIdx, fieldIdx);
  }

  setValue(block, value) {
    if (value instanceof this.Blockly.BlockSvg) {
      if (!value.previousConnection || BlockTypeInfo.getBlockShape(value) !== BlockTypeInfo.BLOCK_SHAPE_STACK)
        throw new Error('Cannot put block "' + value.id + '" into a block type input.');
      value.previousConnection.connect(this.getInput(block).connection);
    } else {
      throw new Error("Block type inputs can only contain blocks.");
    }
  }
}

export default class BlockTypeInfo {
  static BLOCK_SHAPE_STACK = 0;
  static BLOCK_SHAPE_BOOLEAN = 1;
  static BLOCK_SHAPE_ROUND = 2;
  static BLOCK_SHAPE_HAT = 3;

  static BLOCK_INPUT_STRING = 0;
  static BLOCK_INPUT_NUMBER = 1;
  static BLOCK_INPUT_BOOLEAN = 2;
  static BLOCK_INPUT_COLOUR = 3;
  static BLOCK_INPUT_ENUM = 4;
  static BLOCK_INPUT_BLOCK = 5;

  static getBlocks(Blockly, workspace) {
    const flyoutWorkspace = workspace.getToolbox()?.flyout_.getWorkspace();
    if (!flyoutWorkspace) return [];

    const blocks = [];

    const flyoutDom = Blockly.Xml.workspaceToDom(flyoutWorkspace);
    const flyoutDomBlockMap = {};
    for (const blockDom of flyoutDom.children) {
      if (blockDom.tagName === "BLOCK") {
        let id = blockDom.getAttribute("id");
        flyoutDomBlockMap[id] = blockDom;
      }
    }
    for (const workspaceBlock of flyoutWorkspace.getTopBlocks()) {
      blocks.push(new BlockTypeInfo(workspace, Blockly, workspaceBlock, flyoutDomBlockMap[workspaceBlock.id]));
    }

    return blocks;
  }

  static getBlockShape(workspaceBlock) {
    if (
      workspaceBlock.edgeShape_ === BlockTypeInfo.BLOCK_SHAPE_ROUND ||
      workspaceBlock.edgeShape_ === BlockTypeInfo.BLOCK_SHAPE_BOOLEAN
    ) {
      return workspaceBlock.edgeShape_;
    } else {
      if (workspaceBlock.startHat_) return BlockTypeInfo.BLOCK_SHAPE_HAT;
      else return BlockTypeInfo.BLOCK_SHAPE_STACK;
    }
  }

  constructor(workspace, Blockly, workspaceForm, domForm) {
    this.id = workspaceForm.id;
    this.workspaceForm = workspaceForm;
    this.domForm = domForm;
    this.shape = BlockTypeInfo.getBlockShape(this.workspaceForm);
    this.workspace = workspace;
    this.Blockly = Blockly;

    this.parts = [];
    this.inputs = [];

    const addInput = (input) => {
      this.parts.push(input);
      this.inputs.push(input);
    };

    const addFieldInputs = (field, inputIdx, fieldIdx) => {
      if (field.className_ === "blocklyText blocklyDropdownText") {
        const options = field.getOptions();
        if (options.length === 1) {
          this.parts.push(options[0][0]);
        } else {
          addInput(new BlockInputEnum(Blockly, options, inputIdx, fieldIdx));
        }
      } else if (field instanceof Blockly.FieldImage) {
        switch (field.src_) {
          case "/static/blocks-media/green-flag.svg":
            // TODO
            break;
          case "/static/blocks-media/rotate-right.svg":
            // TODO
            break;
          case "/static/blocks-media/rotate-left.svg":
            // TODO
            break;
          case "/static/blocks-media/repeat.svg":
            break;
        }
      } else {
        if (!field.argType_) {
          this.parts.push(field.getText());
        } else if (field.argType_[0] === "colour") {
          addInput(new BlockInputColour(Blockly, inputIdx, fieldIdx));
        } else if (field.argType_[1] === "number") {
          addInput(new BlockInputNumber(Blockly, inputIdx, fieldIdx));
        } else {
          addInput(new BlockInputString(Blockly, inputIdx, fieldIdx));
        }
      }
    };

    for (let inputIdx = 0; inputIdx < this.workspaceForm.inputList.length; inputIdx++) {
      const input = this.workspaceForm.inputList[inputIdx];
      for (let fieldIdx = 0; fieldIdx < input.fieldRow.length; fieldIdx++) {
        addFieldInputs(input.fieldRow[fieldIdx], inputIdx, fieldIdx);
      }

      if (input.connection) {
        const innerBlock = input.connection.targetBlock();
        if (innerBlock) {
          if (innerBlock.inputList.length !== 1 || innerBlock.inputList[0].fieldRow.length !== 1)
            throw new Error("This should never happen.");
          const innerField = innerBlock.inputList[0].fieldRow[0];
          addFieldInputs(innerField, inputIdx, -1);
        } else {
          if (input.outlinePath) {
            addInput(new BlockInputBoolean(Blockly, inputIdx, -1));
          } else {
            addInput(new BlockInputBlock(Blockly, inputIdx, -1));
          }
        }
      }
    }
  }

  createBlock(...inputs) {
    if (inputs.length !== this.inputs.length)
      throw new Error("Wrong number of inputs to block. Expected " + this.inputs.length);

    const block = this.Blockly.Xml.domToBlock(this.domForm, this.workspace);
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i] != null) this.inputs[i].setValue(block, inputs[i]);
    }

    return block;
  }
}
