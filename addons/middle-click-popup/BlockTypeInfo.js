import * as SABlocks from "../../addon-api/content-script/blocks.js";

export class BlockInput {
  constructor(type, inputIdx, fieldIdx) {
    if (this.constructor == BlockInput) throw new Error("Abstract classes can't be instantiated.");
    this.type = type;
    this.inputIdx = inputIdx;
    this.fieldIdx = fieldIdx;
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

export class BlockInputRound extends BlockInput {
  constructor(type, inputIdx, fieldIdx) {
    super(type, inputIdx, fieldIdx);
    if (this.constructor == BlockInputRound) throw new Error("Abstract classes can't be instantiated.");
  }

  setValue(block, value) {
    if (value instanceof BlockInstance) {
      const subblock = value.createWorkspaceForm();
      if (!subblock.outputConnection) throw new Error('Cannot put block "' + subblock.typeInfo.id + '" into a round type input.');
      subblock.outputConnection.connect(this.getInput(block).connection);
    } else {
      this.getField(block).setValue(this._toFieldValue(value));
    }
  }

  _toFieldValue(value) {
    throw new Error("Sub-class must override abstract method.");
  }
}

export class BlockInputString extends BlockInputRound {
  constructor(inputIdx, fieldIdx) {
    super(BlockTypeInfo.BLOCK_INPUT_STRING, inputIdx, fieldIdx);
  }

  _toFieldValue(value) {
    const type = typeof value;
    if (type === "number") return value;
    if (type === "string") return value;
    throw new Error("Cannot set round type input to value of type " + type);
  }
}

export class BlockInputNumber extends BlockInputRound {
  constructor(inputIdx, fieldIdx) {
    super(BlockTypeInfo.BLOCK_INPUT_NUMBER, inputIdx, fieldIdx);
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

export class BlockInputBoolean extends BlockInput {
  constructor(inputIdx, fieldIdx) {
    super(BlockTypeInfo.BLOCK_INPUT_BOOLEAN, inputIdx, fieldIdx);
  }

  setValue(block, value) {
    if (value instanceof BlockInstance) {
      const subblock = value.createWorkspaceForm();
      if (!subblock.outputConnection || value.typeInfo.shape !== BlockShape.Boolean)
        throw new Error('Cannot put block "' + value.typeInfo.id + '" into a boolean type input.');
      subblock.outputConnection.connect(this.getInput(block).connection);
    } else {
      throw new Error("Boolean type inputs can only contain blocks.");
    }
  }
}

export class BlockInputColour extends BlockInput {
  constructor(inputIdx, fieldIdx) {
    super(BlockTypeInfo.BLOCK_INPUT_COLOUR, inputIdx, fieldIdx);
  }

  setValue(block, value) {
    if (typeof value !== "string") throw new Error("Cannot set color type input to value of type " + typeof type);
    if (!value.match(/^#[0-9a-fA-F]{6}$/)) throw new Error('Invalid color "' + value + '".');
    this.getField(block).setValue(value);
  }
}

export class BlockInputEnum extends BlockInput {
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

  constructor(options, inputIdx, fieldIdx) {
    super(BlockTypeInfo.BLOCK_INPUT_ENUM, inputIdx, fieldIdx);
    this.values = [];
    for (let i = 0; i < options.length; i++) {
      if (typeof options[i][1] === "string" && BlockInputEnum.INVALID_VALUES.indexOf(options[i][1]) === -1) {
        this.values.push({ value: options[i][1], string: options[i][0].replaceAll(String.fromCharCode(160), " ") });
      }
    }
  }

  setValue(block, value) {
    if (this.values.indexOf(value) === -1) throw new Error("Invalid enum value. Expected item from the options list.");
    this.getField(block).setValue(value.value);
  }
}

export class BlockInputBlock extends BlockInput {
  constructor(inputIdx, fieldIdx) {
    super(BlockTypeInfo.BLOCK_INPUT_BLOCK, inputIdx, fieldIdx);
  }

  setValue(block, value) {
    if (value instanceof BlockInstance) {
      const subblock = value.createWorkspaceForm();
      if (!subblock.previousConnection || !value.typeInfo.shape.canStackUp)
        throw new Error('Cannot put block "' + value.typeInfo.id + '" into a block type input.');
      subblock.previousConnection.connect(this.getInput(block).connection);
    } else {
      throw new Error("Block type inputs can only contain blocks.");
    }
  }
}

export class BlockInstance {
  constructor(typeInfo, ...inputs) {
    /** 
     * @type {BlockTypeInfo} 
     * @public
     * */
    this.typeInfo = typeInfo;
    this.inputs = inputs ?? [];
  }

  createWorkspaceForm() {
    if (this.inputs.length !== this.typeInfo.inputs.length)
      throw new Error("Wrong number of inputs to block. Expected " + this.inputs.length);

    const block = this.typeInfo.Blockly.Xml.domToBlock(this.typeInfo.domForm, this.typeInfo.workspace);
    for (let i = 0; i < this.inputs.length; i++) {
      if (this.inputs[i] != null) this.typeInfo.inputs[i].setValue(block, this.inputs[i]);
    }

    return block;
  }
}

export class BlockShape {
  static Round = new BlockShape(false, false, true);
  static Boolean = new BlockShape(false, false, true);
  static Hat = new BlockShape(false, true, false);
  static End = new BlockShape(true, false, false);
  static Stack = new BlockShape(true, true, false);

  static getBlockShape(workspaceBlock) {
    if (workspaceBlock.edgeShape_ === 2) {
      return BlockShape.Round;
    } else if (workspaceBlock.edgeShape_ === 1) {
      return BlockShape.Boolean;
    } else if (workspaceBlock.startHat_) {
      return BlockShape.Hat;
    } else if (workspaceBlock.squareTopLeftCorner_) {
      return BlockShape.End;
    } else {
      return BlockShape.Stack;
    }
  }

  constructor(canStackUp, canStackDown, canBeRound) {
    this.canStackUp = canStackUp
    this.canStackDown = canStackDown;
    this.canBeRound = canBeRound;
  }
}

export class BlockTypeInfo {
  static BLOCK_INPUT_STRING = 0;
  static BLOCK_INPUT_NUMBER = 1;
  static BLOCK_INPUT_BOOLEAN = 2;
  static BLOCK_INPUT_COLOUR = 3;
  static BLOCK_INPUT_ENUM = 4;
  static BLOCK_INPUT_BLOCK = 5;

  static getBlockCategory(block) {
    if (block.type === "procedures_call") {
      if (SABlocks.getCustomBlock(block.getProcCode())) return "addon-custom-block";
      return "more";
    }
    if (block.isScratchExtension) return "pen";
    // These two blocks don't have `category_` set for reasons I'm too tired to figure out.
    if (block.type === "sensing_of") return "sensing";
    if (block.type === "event_whenbackdropswitchesto") return "event;"
    return block.category_;
  }

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

  constructor(workspace, Blockly, workspaceForm, domForm) {
    this.id = workspaceForm.id;
    this.workspaceForm = workspaceForm;
    this.domForm = domForm;
    this.shape = BlockShape.getBlockShape(this.workspaceForm);
    this.category = BlockTypeInfo.getBlockCategory(this.workspaceForm);
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
          addInput(new BlockInputEnum(options, inputIdx, fieldIdx));
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
          addInput(new BlockInputColour(inputIdx, fieldIdx));
        } else if (field.argType_[1] === "number") {
          addInput(new BlockInputNumber(inputIdx, fieldIdx));
        } else {
          addInput(new BlockInputString(inputIdx, fieldIdx));
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
            addInput(new BlockInputBoolean(inputIdx, -1));
          } else {
            addInput(new BlockInputBlock(inputIdx, -1));
          }
        }
      }
    }
  }

  createBlock(...inputs) {
    return new BlockInstance(this, ...inputs);
  }
}
