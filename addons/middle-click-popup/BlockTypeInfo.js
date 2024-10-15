/**
 * @file Contains the code for enumerating the different types of blocks in a workspace,
 * and provides a more friendly way to create instances blocks with some inputs.
 */

import * as SABlocks from "../../addon-api/content-script/blocks.js";

/**
 * A numeric value to represent the type of an {@link BlockInput}
 * @readonly
 * @enum {number}
 */
export const BlockInputType = {
  STRING: 0,
  NUMBER: 1,
  BOOLEAN: 2,
  COLOUR: 3,
  ENUM: 4,
  BLOCK: 5,
};

/**
 * @abstract
 */
export class BlockInput {
  /**
   * @param {BlockInputType} type
   * @param {number} inputIdx
   * @param {number} fieldIdx
   */
  constructor(type, inputIdx, fieldIdx) {
    if (this.constructor === BlockInput) throw new Error("Abstract classes can't be instantiated.");
    /** @type {BlockInputType} */
    this.type = type;
    /** @type {number} The index of this input in the workspace version of the block's input array.  */
    this.inputIdx = inputIdx;
    /**
     * The index of this input in the workspace version of the block's field array.
     * The special case of -1 means that in the workspace version, this input is inside a sub-block,
     * that has been abstracted away.
     *  @type {number}
     */
    this.fieldIdx = fieldIdx;
    /** @type {*} The default value to set this input to, or null to not set it to anything. */
    this.defaultValue = null;
  }

  /**
   * Sets the field this input refers to on a block to a value.
   * @param {BlockInstance} block
   * @param {*} value
   * @abstract
   */
  setValue(block, value) {
    throw new Error("Sub-class must override abstract method.");
  }

  /**
   * Gets the input this block input refers to on block.
   * @param {BlockInstance} block
   * @returns {*}
   * @protected
   */
  getInput(block) {
    return block.inputList[this.inputIdx];
  }

  /**
   * Gets the field this block input refers to on block.
   * @param {BlockInstance} block
   * @returns {*}
   * @protected
   */
  getField(block) {
    if (this.fieldIdx === -1) {
      return this.getInput(block).connection.targetBlock().inputList[0].fieldRow[0];
    } else {
      return this.getInput(block).fieldRow[this.fieldIdx];
    }
  }
}

/**
 * The base class for any round input.
 * @abstract
 */
export class BlockInputRound extends BlockInput {
  constructor(type, inputIdx, fieldIdx, defaultValue) {
    super(type, inputIdx, fieldIdx);
    if (this.constructor === BlockInputRound) throw new Error("Abstract classes can't be instantiated.");
    this.defaultValue = defaultValue;
  }

  setValue(block, value) {
    if (value instanceof BlockInstance) {
      const subblock = value.createWorkspaceForm();
      if (!subblock.outputConnection)
        throw new Error('Cannot put block "' + subblock.typeInfo.id + '" into a round type input.');
      subblock.outputConnection.connect(this.getInput(block).connection);
    } else {
      this.getField(block).setValue(this._toFieldValue(value));
    }
  }

  /**
   * Converts a value passed in to setValue to a value we can set the block's field to.
   * @param {*} value
   * @protected
   */
  _toFieldValue(value) {
    throw new Error("Sub-class must override abstract method.");
  }
}

export class BlockInputString extends BlockInputRound {
  constructor(inputIdx, fieldIdx, defaultValue) {
    super(BlockInputType.STRING, inputIdx, fieldIdx, defaultValue);
  }

  _toFieldValue(value) {
    const type = typeof value;
    if (type === "number") return value;
    if (type === "string") return value;
    throw new Error("Cannot set round type input to value of type " + type);
  }
}

export class BlockInputNumber extends BlockInputRound {
  constructor(inputIdx, fieldIdx, defaultValue) {
    super(BlockInputType.NUMBER, inputIdx, fieldIdx, defaultValue);
  }

  _toFieldValue(value) {
    const type = typeof value;
    if (type === "number") return value;
    if (type === "string") {
      if (value.length === 0) return value;
      const number = parseFloat(value);
      if (isNaN(number)) throw new Error('Cannot set numeric type input to string "' + value + '".');
      return value;
    }
    throw new Error("Cannot set round type input to value of type " + type);
  }
}

export class BlockInputBoolean extends BlockInput {
  constructor(inputIdx, fieldIdx) {
    super(BlockInputType.BOOLEAN, inputIdx, fieldIdx);
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
    super(BlockInputType.COLOUR, inputIdx, fieldIdx);
  }

  setValue(block, value) {
    if (typeof value !== "string") throw new Error("Cannot set color type input to value of type " + typeof type);
    if (!value.match(/^#[0-9a-fA-F]{6}$/)) throw new Error('Invalid color "' + value + '".');
    this.getField(block).setValue(value);
  }
}

/**
 * @typedef BlockInputEnumOption
 * @property {string} value The internal name of this input option
 * @property {string} string The localized name of this input option.
 */

/**
 * A block input that can be one of a list of values.
 * Usually represented by a dropdown menu in Scratch.
 */
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
    // rename-broadcasts compatibility
    "RENAME_BROADCAST_MESSAGE_ID",
  ];

  /**
   * @param {Array} options
   * @param {number} inputIdx
   * @param {number} fieldIdx
   */
  constructor(options, inputIdx, fieldIdx, isRound) {
    super(BlockInputType.ENUM, inputIdx, fieldIdx);
    /** @type {BlockInputEnumOption[]} */
    this.values = [];
    for (let i = 0; i < options.length; i++) {
      if (typeof options[i][1] === "string" && BlockInputEnum.INVALID_VALUES.indexOf(options[i][1]) === -1) {
        this.values.push({ value: options[i][1], string: options[i][0].replaceAll(String.fromCharCode(160), " ") });
      }
    }
    this.isRound = isRound;
    this.defaultValue = this.values[0];
  }

  /**
   * @param {BlockInputEnumOption} value
   */
  setValue(block, value) {
    if (this.isRound && value instanceof BlockInstance) {
      value.createWorkspaceForm().outputConnection.connect(this.getInput(block).connection);
    } else {
      if (this.values.indexOf(value) === -1) throw new Error("Invalid enum value. Expected item from the values list.");
      this.getField(block).setValue(value.value);
    }
  }
}

/**
 * A block input that is a stack of blocks.
 * The 'if' block has a single block input, the 'if else' block has two block inputs.
 */
export class BlockInputBlock extends BlockInput {
  constructor(inputIdx, fieldIdx) {
    super(BlockInputType.BLOCK, inputIdx, fieldIdx);
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

/**
 * Because everyone was thinking "You know what Scratch really needs, ANOTHER way to represent blocks!"
 *
 * Another way to represent a Scratch block.
 */
export class BlockInstance {
  constructor(typeInfo, ...inputs) {
    /** @type {BlockTypeInfo} */
    this.typeInfo = typeInfo;
    /** @type {Array} */
    this.inputs = inputs;

    for (let i = 0; i < this.typeInfo.inputs.length; i++) {
      if (this.inputs[i] == null) this.inputs[i] = this.typeInfo.inputs[i].defaultValue;
    }
  }

  /**
   * Creates a real Scratch block from this imaginary representation.
   * @returns {*} A 'workspace form' block.
   */
  createWorkspaceForm() {
    if (this.typeInfo.id === "control_stop") {
      this.typeInfo.domForm
        .querySelector("mutation")
        .setAttribute("hasnext", "" + (this.inputs[0].value === "other scripts in sprite"));
    }

    const block = this.typeInfo.Blockly.Xml.domToBlock(this.typeInfo.domForm, this.typeInfo.workspace);
    for (let i = 0; i < this.typeInfo.inputs.length; i++) {
      const inputValue = this.inputs[i];
      if (inputValue != null) this.typeInfo.inputs[i].setValue(block, inputValue);
    }

    return block;
  }
}

/**
 * An enum for the different shapes of blocks.
 * Contains information on what each type of block can do.
 */
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
    } else if (!workspaceBlock.nextConnection) {
      return BlockShape.End;
    } else {
      return BlockShape.Stack;
    }
  }

  constructor(canStackUp, canStackDown, canBeRound) {
    /** @type {boolean} Can blocks be stacked above this block? */
    this.canStackUp = canStackUp;
    /** @type {boolean} Can blocks be stacked below this block? */
    this.canStackDown = canStackDown;
    /** @type {boolean} Does this block fit into a round hole? */
    this.canBeRound = canBeRound;
  }
}

/**
 * @typedef BlockCategory
 * @property {string} name
 * @property {string} colorPrimary
 * @property {string} colorSecondary
 * @property {string} colorTertiary
 */

/**
 * A type of Scratch block, like 'move () steps'. Every instance of the 'move () steps'
 * block shares this type info.
 */
export class BlockTypeInfo {
  /**
   * @param {*} block Block in workspace form
   * @param {*} vm
   * @returns {BlockCategory} The block's category
   */
  static getBlockCategory(block, vm) {
    let name;

    if (block.type === "procedures_call") {
      if (SABlocks.getCustomBlock(block.getProcCode())) name = "addon-custom-block";
      else name = "more";
    } else if (block.isScratchExtension) name = "pen";
    else if (block.type === "sensing_of") name = "sensing";
    else if (block.type === "event_whenbackdropswitchesto") name = "events";
    else name = block.category_;

    return {
      name,
      colorPrimary: block.colour_,
      colorSecondary: block.colourSecondary_,
      colorTertiary: block.colourTertiary_,
    };
  }

  /**
   * Enumerates all the different types of blocks, given a workspace.
   * @param {Blockly} Blockly
   * @param {*} vm
   * @param {*} workspace
   * @param {(string) => string} locale The translations used for converting icons into text
   * @returns {BlockTypeInfo[]}
   */
  static getBlocks(Blockly, vm, workspace, locale) {
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
      blocks.push(
        ...BlockTypeInfo._createBlocks(
          workspace,
          vm,
          Blockly,
          locale,
          workspaceBlock,
          flyoutDomBlockMap[workspaceBlock.id]
        )
      );
    }

    return blocks;
  }

  static _createBlocks(workspace, vm, Blockly, locale, workspaceForm, domForm) {
    let parts = [];
    let inputs = [];

    const addInput = (input) => {
      parts.push(input);
      inputs.push(input);
    };

    const addFieldInputs = (field, inputIdx, fieldIdx) => {
      if (field.className_ === "blocklyText blocklyDropdownText") {
        const options = field.getOptions();
        addInput(new BlockInputEnum(options, inputIdx, fieldIdx, fieldIdx === -1));
      } else if (field instanceof Blockly.FieldImage) {
        switch (field.src_.split("/").pop()) {
          case "green-flag.svg":
            parts.push(locale("/_general/blocks/green-flag"));
            break;
          case "rotate-right.svg":
            parts.push(locale("/_general/blocks/clockwise"));
            break;
          case "rotate-left.svg":
            parts.push(locale("/_general/blocks/anticlockwise"));
            break;
        }
      } else {
        if (!field.argType_) {
          if (field.getText().trim().length !== 0) parts.push(field.getText());
        } else if (field.argType_[0] === "colour") {
          addInput(new BlockInputColour(inputIdx, fieldIdx));
        } else if (field.argType_[1] === "number") {
          addInput(new BlockInputNumber(inputIdx, fieldIdx, field.text_));
        } else {
          addInput(new BlockInputString(inputIdx, fieldIdx, field.text_));
        }
      }
    };

    for (let inputIdx = 0; inputIdx < workspaceForm.inputList?.length; inputIdx++) {
      const input = workspaceForm.inputList[inputIdx];
      for (let fieldIdx = 0; fieldIdx < input.fieldRow.length; fieldIdx++) {
        addFieldInputs(input.fieldRow[fieldIdx], inputIdx, fieldIdx);
      }

      if (input.connection) {
        const innerBlock = input.connection.targetBlock();
        if (innerBlock) {
          if (innerBlock.inputList.length !== 1 || innerBlock.inputList[0].fieldRow.length !== 1)
            throw new Error("This should never happen.");
          let innerField = innerBlock.inputList[0].fieldRow[0];
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

    if (workspaceForm.id === "of") {
      let blocks = [];

      let baseVarInputIdx, baseTargetInputIdx;
      // In most languages, the 'of' block inputs are: [variable] of [sprite], and in others
      // it's the opposite (sprite then variable). We can tell that the variable comes first
      // if the first input is round.
      if (inputs[0].isRound) {
        baseVarInputIdx = 1;
        baseTargetInputIdx = 0;
      } else {
        baseVarInputIdx = 0;
        baseTargetInputIdx = 1;
      }

      let baseVarInput = inputs[baseVarInputIdx];
      let baseTargetInput = inputs[baseTargetInputIdx];

      const baseVarPartIdx = parts.indexOf(baseVarInput);
      const baseTargetPartIdx = parts.indexOf(baseTargetInput);

      // Adapted from https://github.com/scratchfoundation/scratch-gui/blob/cc6e6324064493cf1788f3c7c0ff31e4057964ee/src/lib/blocks.js#L230
      const stageOptions = [
        [Blockly.Msg.SENSING_OF_BACKDROPNUMBER, "backdrop #"],
        [Blockly.Msg.SENSING_OF_BACKDROPNAME, "backdrop name"],
        [Blockly.Msg.SENSING_OF_VOLUME, "volume"],
      ];

      const spriteOptions = [
        [Blockly.Msg.SENSING_OF_XPOSITION, "x position"],
        [Blockly.Msg.SENSING_OF_YPOSITION, "y position"],
        [Blockly.Msg.SENSING_OF_DIRECTION, "direction"],
        [Blockly.Msg.SENSING_OF_COSTUMENUMBER, "costume #"],
        [Blockly.Msg.SENSING_OF_COSTUMENAME, "costume name"],
        [Blockly.Msg.SENSING_OF_SIZE, "size"],
        [Blockly.Msg.SENSING_OF_VOLUME, "volume"],
      ];

      for (const targetInput of baseTargetInput.values) {
        let options;
        const isStage = targetInput.value === "_stage_";

        if (isStage) {
          const stageVariableOptions = vm.runtime.getTargetForStage().getAllVariableNamesInScopeByType("");
          options = stageVariableOptions.map((variable) => [variable, variable]).concat(stageOptions);
        } else {
          const sprite = vm.runtime.getSpriteTargetByName(targetInput.value);
          const spriteVariableOptions = sprite.getAllVariableNamesInScopeByType("", true);
          options = spriteVariableOptions.map((variable) => [variable, variable]).concat(spriteOptions);
        }

        const ofInputs = [];
        ofInputs[baseVarInputIdx] = new BlockInputEnum(options, baseVarInput.inputIdx, baseVarInput.fieldIdx, false);
        ofInputs[baseTargetInputIdx] = new BlockInputEnum(
          [[targetInput.string, targetInput.value]],
          baseTargetInput.inputIdx,
          baseTargetInput.fieldIdx,
          isStage
        );

        const ofParts = [...parts];
        ofParts[baseVarPartIdx] = ofInputs[baseVarInputIdx];
        ofParts[baseTargetPartIdx] = ofInputs[baseTargetInputIdx];

        blocks.push(new BlockTypeInfo(workspace, Blockly, vm, workspaceForm, domForm, ofParts, ofInputs));
      }

      return blocks;
    } else if (workspaceForm.id === "control_stop") {
      // This block is special because when "other scripts in sprite" is selected the block
      //  needs to be BlockShape.End.
      const oldInput = inputs[0];
      const otherScriptsOptionIdx = oldInput.values.findIndex((option) => option.string === "other scripts in sprite");
      const otherScriptsOption = oldInput.values.splice(otherScriptsOptionIdx, 1)[0];
      const newInput = new BlockInputEnum(
        [[otherScriptsOption.string, otherScriptsOption.value]],
        oldInput.inputIdx,
        oldInput.fieldIdx,
        oldInput.isRound
      );

      const newBlockParts = [...parts];
      newBlockParts[parts.indexOf(oldInput)] = newInput;

      return [
        new BlockTypeInfo(workspace, Blockly, vm, workspaceForm, domForm, parts, inputs, BlockShape.End),
        new BlockTypeInfo(workspace, Blockly, vm, workspaceForm, domForm, newBlockParts, [newInput], BlockShape.Stack),
      ];
    } else {
      return [new BlockTypeInfo(workspace, Blockly, vm, workspaceForm, domForm, parts, inputs)];
    }
  }

  constructor(workspace, Blockly, vm, workspaceForm, domForm, parts, inputs, shape) {
    /** @type {string} */
    this.id = workspaceForm.id;
    this.workspaceForm = workspaceForm;
    this.domForm = domForm;
    /** @type {BlockShape} */
    this.shape = shape ?? BlockShape.getBlockShape(this.workspaceForm);
    /** @type {BlockCategory} */
    this.category = BlockTypeInfo.getBlockCategory(this.workspaceForm, vm);
    this.workspace = workspace;
    this.Blockly = Blockly;

    /**
     * A list of all the 'parts' of this block. Each part is either an instance
     * of BlockInput or a string for some text which is a part of a block.
     *
     * For example, for the 'say' block, the first element of the array would be
     * the string 'say', and the second element would be a BlockInput of type
     * BlockInputString.
     * @type {(BlockInput | string)[]}
     */
    this.parts = parts;
    /**
     * A list of all this block's inputs. The same as this.parts, but with the
     * strings omitted.
     * @type {BlockInput[]}
     */
    this.inputs = inputs;
  }

  /**
   * Creates a block of this type with the given inputs
   * @param  {...any} inputs
   * @returns {BlockInstance}
   */
  createBlock(...inputs) {
    return new BlockInstance(this, ...inputs);
  }
}
