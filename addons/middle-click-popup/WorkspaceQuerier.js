//
// I'm really sorry if somebody other than me ever has to debug this
//  Wish you luck <3
//

class TokenTypeGroup {
  constructor(parents, allowOmission, ...tokenTypes) {
    this.parents = parents || [];
    this.allowOmission = allowOmission;
    this.tokenTypes = tokenTypes;

    this.tokenCache = [];
    this.tokenCacheQuery = null;
  }

  *parseTokens(querier, idx) {
    if (this.allowOmission) yield new Token(idx, idx, null, null, 0);
    yield* this._parseTokens(querier, idx);
  }

  *_parseTokens(querier, idx) {
    if (this.tokenCacheQuery === querier.query && this.tokenCache[idx]) {
      yield* this.tokenCache[idx];
    } else {
      this.tokenCacheQuery = querier.query;
      let tokens = (this.tokenCache[idx] = []);

      for (const tokenType of this.tokenTypes) {
        for (const token of tokenType.parse(querier, idx)) {
          tokens.push(token);
          yield token;
        }
      }
    }

    for (const parent of this.parents) yield* parent._parseTokens(querier, idx);
  }
}

class Token {
  constructor(start, end, type, value, score = 100, precedence = -1) {
    this.start = start;
    this.end = end;
    this.type = type;
    this.value = value;
    this.score = score;
    this.precedence = precedence;
  }
}

class TokenType {
  constructor() {
    if (this.constructor == TokenType) throw new Error("Abstract classes can't be instantiated.");
  }

  *parse(querier, idx) {
    throw new Error("Sub-classes must override this method.");
  }

  createBlock() {
    throw new Error("Cannot create a block from this token type.");
  }
}

class TokenTypeStringEnum extends TokenType {
  constructor(values) {
    super();
    this.values = values;
  }

  *parse(querier, idx) {
    for (const value of this.values) {
      if (querier.query.startsWith(value[0], idx)) {
        yield new Token(idx, idx + value[0].length, this, value[1]);
      }
    }
  }
}

class TokenTypeStringLiteral extends TokenType {
  static TERMINATORS = [undefined, " ", "+", "-", "*", "/", "(", ")"];

  *parse(querier, idx) {
    let wasTerminator = false;
    for (let i = idx; i <= querier.query.length; i++) {
      if (TokenTypeStringLiteral.TERMINATORS.indexOf(querier.query[i]) !== -1) {
        if (!wasTerminator || i === querier.query.length)
          yield new Token(idx, i, this, querier.query.substring(idx, i));
        wasTerminator = true;
      } else {
        wasTerminator = false;
      }
    }
  }
}

class TokenTypeNumberLiteral extends TokenType {
  static NUM_CHAR = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "."];
  static HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

  *parse(querier, idx) {
    if (querier.query.startsWith("0x", idx)) {
      for (let i = idx + 2; i <= querier.query.length; i++) {
        const char = querier.query[i];
        if (TokenTypeStringLiteral.TERMINATORS.indexOf(char) !== -1) {
          if (i !== idx) yield new Token(idx, i, this, querier.query.substring(idx, i));
          break;
        }
        if (TokenTypeNumberLiteral.HEX_CHARS.indexOf(char.toLowerCase()) === -1) break;
      }
    }

    for (let i = idx; i <= querier.query.length; i++) {
      const char = querier.query[i];
      if (TokenTypeStringLiteral.TERMINATORS.indexOf(char) !== -1) {
        if (i !== idx) yield new Token(idx, i, this, querier.query.substring(idx, i));
        break;
      }
      if (TokenTypeNumberLiteral.NUM_CHAR.indexOf(char) === -1) break;
    }
  }
}

class TokenTypeBrackets extends TokenType {
  constructor(tokenGroup) {
    super();
    this.tokenGroup = tokenGroup;
  }

  *parse(querier, idx) {
    const start = idx;
    if (querier.query[idx++] !== "(") return;
    idx = TokenTypeBlock.skipIgnorable(querier, idx);
    for (const token of this.tokenGroup.parseTokens(querier, idx)) {
      const tokenEnd = TokenTypeBlock.skipIgnorable(querier, token.end);
      if (querier.query[tokenEnd] !== ")") continue;
      yield new Token(start, tokenEnd + 1, token.type, token.value, token.score + 100, 0);
    }
  }
}

class TokenTypeBlock extends TokenType {
  static INVALID_FIELDS = [
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

  static IGNORABLE_CHARS = [" "];
  static skipIgnorable(querier, idx) {
    while (TokenTypeBlock.IGNORABLE_CHARS.indexOf(querier.query[idx]) !== -1) ++idx;
    return idx;
  }

  constructor(block, querier) {
    super();

    this.block = block;
    this.tokenTypeGroups = [];

    const _appendTokenTypeGroups = (block) => {
      for (const input of block.inputList) {
        for (const field of input.fieldRow) {
          if (field.className_ === "blocklyText blocklyDropdownText") {
            const fieldOptions = field.getOptions();
            for (let i = 0; i < fieldOptions.length; i++) {
                if (typeof fieldOptions[i][1] !== "string" || 
                  TokenTypeBlock.INVALID_FIELDS.indexOf(fieldOptions[i][1]) !== -1) fieldOptions.splice(i, 1);
            }
            this.tokenTypeGroups.push(new TokenTypeGroup(null, false, new TokenTypeStringEnum(fieldOptions)));
          } else if (field.argType_) {
            if (field.argType_[0] === "colour") {
              // TODO
            } else if (field.argType_[1] === "number") {
              this.tokenTypeGroups.push(querier.tokenTypeGroupNumber);
            } else {
              this.tokenTypeGroups.push(querier.tokenTypeGroupString);
            }
          } else {
            this.tokenTypeGroups.push(
              new TokenTypeGroup(null, false, new TokenTypeStringEnum([[field.getText(), null]]))
            );
          }
        }

        if (input.connection) {
          const innerBlock = input.connection.targetBlock();
          if (innerBlock) {
            _appendTokenTypeGroups(innerBlock);
          } else {
            if (input.outlinePath) {
              this.tokenTypeGroups.push(querier.tokenTypeGroupBoolean);
            } else {
              this.tokenTypeGroups.push(querier.tokenTypeGroupStackableBlocks);
            }
          }
        }
      }
    };
    _appendTokenTypeGroups(block.workspaceForm);
  }

  *parse(querier, idx) {
    for (const value of this._parseSubtoken(idx, 0, querier)) {
      let score = 100;
      for (const subtoken of value) {
        score += subtoken.score;
        if (subtoken.precedence < this.block.precedence) score += 5;
      }
      yield new Token(idx, value[0].end, this, value, score, this.block.precedence);
    }
  }

  *_parseSubtoken(idx, tokenGroupIdx, querier) {
    while (TokenTypeBlock.IGNORABLE_CHARS.indexOf(querier.query[idx]) !== -1) ++idx;
    let tokenGroup = this.tokenTypeGroups[tokenGroupIdx];

    for (const token of tokenGroup.parseTokens(querier, idx)) {
      if (this.block.precedence !== -1) {
        if (token.precedence > this.block.precedence) continue;
        if (token.precedence === this.block.precedence && token.type === this && tokenGroupIdx !== 0) continue;
      }

      if (tokenGroupIdx === this.tokenTypeGroups.length - 1) {
        yield [token];
      } else {
        for (const subTokenArr of this._parseSubtoken(token.end, tokenGroupIdx + 1, querier)) {
          subTokenArr.push(token);
          yield subTokenArr;
        }
      }
    }
  }

  createBlock(token, querier) {
    const block = querier.Blockly.Xml.domToBlock(this.block.domForm, querier.workspace);
    let tokenIdx = token.value.length;

    for (const input of block.inputList) {
      for (const field of input.fieldRow) {
        if (field.className_ === "blocklyText blocklyDropdownText") {
          field.setValue(token.value[--tokenIdx].value);
        } else if (!field.argType_) {
          --tokenIdx;
        }
      }

      if (input.connection) {
        const innerToken = token.value[--tokenIdx];
        if (innerToken.type) {
          if (innerToken.type instanceof TokenTypeBlock) {
            const innerBlock = innerToken.type.createBlock(innerToken, querier);
            if (innerBlock.outputConnection) {
              innerBlock.outputConnection.connect(input.connection);
            } else {
              innerBlock.previousConnection.connect(input.connection);
            }
          } else {
            const innerBlock = input.connection.targetBlock();
            if (innerBlock) innerBlock.inputList[0].fieldRow[0].setValue(innerToken.value.toString());
          }
        }
      }
    }

    if (tokenIdx !== 0) throw new Error();
    return block;
  }
}

export default class WorkspaceQuerier {
  static ORDER_OF_OPERATIONS = [
    null, // brackets
    "operator_mod",
    "operator_divide",
    "operator_multiply",
    "operator_subtract",
    "operator_add",
  ];

  constructor(blockly) {
    this.Blockly = blockly;
  }

  indexWorkspace(workspace) {
    this.workspace = workspace;

    const flyoutWorkspace = workspace.getToolbox().flyout_.getWorkspace();

    // Firstly, enumerate all the blocks. Each blocks has two representations;
    //  'DOM form' and 'Workspace form'.
    this.blocks = [];

    {
      const flyoutDom = Blockly.Xml.workspaceToDom(flyoutWorkspace);

      const flyoutDomBlockMap = {};
      for (const blockDom of flyoutDom.children) {
        if (blockDom.tagName === "BLOCK") {
          let id = blockDom.getAttribute("id");
          flyoutDomBlockMap[id] = blockDom;
        }
      }
      for (const workspaceBlock of flyoutWorkspace.getTopBlocks()) {
        this.blocks.push({
          id: workspaceBlock.id,
          workspaceForm: workspaceBlock,
          domForm: flyoutDomBlockMap[workspaceBlock.id],
          precedence: WorkspaceQuerier.ORDER_OF_OPERATIONS.indexOf(workspaceBlock.id),
        });
      }
    }

    // Apply order of operations
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const block = this.blocks[i];
      if (block.precedence !== -1) {
        const target = this.blocks.length - (WorkspaceQuerier.ORDER_OF_OPERATIONS.length - (block.precedence - 1));
        if (i !== target) {
          const oldBlock = this.blocks[target];
          this.blocks[target] = block;
          this.blocks[i] = oldBlock;
        }
      }
    }

    //// Round value reporter blocks ////
    this.tokenTypeGroupValues = new TokenTypeGroup(null, true);
    // Round value reporter blocks + String Literals + Brackets
    this.tokenTypeGroupString = new TokenTypeGroup([this.tokenTypeGroupValues], true, new TokenTypeStringLiteral());
    this.tokenTypeGroupString.tokenTypes.push(new TokenTypeBrackets(this.tokenTypeGroupString));
    // Round value reporter blocks + Number Literals + Brackets
    this.tokenTypeGroupNumber = new TokenTypeGroup([this.tokenTypeGroupValues], true, new TokenTypeNumberLiteral());
    this.tokenTypeGroupNumber.tokenTypes.push(new TokenTypeBrackets(this.tokenTypeGroupNumber));

    //// Triangle boolean reporter blocks ////
    this.tokenTypeGroupBooleanBlocks = new TokenTypeGroup(null, true);
    // Triangle boolean reporter blocks + Brackets
    this.tokenTypeGroupBoolean = new TokenTypeGroup([this.tokenTypeGroupBooleanBlocks], true);
    this.tokenTypeGroupBoolean.tokenTypes.push(new TokenTypeBrackets(this.tokenTypeGroupBoolean));

    /// Stackable Block ////
    this.tokenTypeGroupStackableBlocks = new TokenTypeGroup(null, true);

    //// All blocks + Brackets ////
    this.tokenTypeGroupBlocks = new TokenTypeGroup( // It's [current year] you can have 3 parents
      [this.tokenTypeGroupBooleanBlocks, this.tokenTypeGroupValues, this.tokenTypeGroupStackableBlocks],
      false
    );
    this.tokenTypeGroupBlocks.tokenTypes.push(new TokenTypeBrackets(this.tokenTypeGroupBlocks));

    {
      const BLOCK_SHAPE_BLOCK = 0;
      const BLOCK_SHAPE_BOOLEAN = 1;
      const BLOCK_SHAPE_VALUE = 2;
      const BLOCK_SHAPE_HAT = 3;

      const _getBlockShape = (block) => {
        switch (block.edgeShape_) {
          case 1:
          case 2:
            return block.edgeShape_;
          default:
            return block.startHat_ ? BLOCK_SHAPE_HAT : BLOCK_SHAPE_BLOCK;
        }
      };

      for (const block of this.blocks) {
        const blockToken = new TokenTypeBlock(block, this);
        const blockShape = _getBlockShape(block.workspaceForm);

        if (blockShape === BLOCK_SHAPE_VALUE) {
          this.tokenTypeGroupValues.tokenTypes.push(blockToken);
        } else if (blockShape === BLOCK_SHAPE_BOOLEAN) {
          this.tokenTypeGroupBooleanBlocks.tokenTypes.push(blockToken);
        } else if (blockShape === BLOCK_SHAPE_BLOCK) {
          this.tokenTypeGroupStackableBlocks.tokenTypes.push(blockToken);
        } else {
          this.tokenTypeGroupBlocks.tokenTypes.push(blockToken);
        }
      }
    }

    console.log(this.tokenTypeGroupNumber);
  }

  queryWorkspace(query) {
    this.query = query;
    const options = [];

    for (const option of this.tokenTypeGroupBlocks.parseTokens(this, 0)) {
      if (option.end === query.length) options.push(option);
      if (options.length > 1000) break;
    }

    return options.sort((a, b) => b.score - a.score);
  }

  createBlock(option) {
    return option.type.createBlock(option, this);
  }
}
