//
// I'm really sorry if somebody other than me ever has to debug this
//  Wish you luck <3
//

class TokenTypeGroup {
  constructor(parents, allowOmission, ...tokenTypes) {
    this.parents = parents || [];
    this.trauncatedParents = [];
    this.allowOmission = allowOmission;
    this.tokenTypes = tokenTypes;

    this.tokenCache = [];
    this.tokenCacheQueryID = null;
  }

  *parseTokens(querier, idx) {
    if (this.allowOmission) {
      yield new Token(idx, idx, null, null, 0);
      if (idx >= querier.query.length) return;
    }
    yield* this._parseTokens(querier, idx);
  }

  *_parseTokens(querier, idx) {
    for (const trauncatedParent of this.trauncatedParents) {
      for (const token of trauncatedParent._parseTokens(querier, idx)) {
        if (token.isTruncated) yield token;
      }
    }
    for (const parent of this.parents) yield* parent._parseTokens(querier, idx);

    if (this.tokenCacheQueryID !== querier.queryID)
      this.tokenCache = [];

    if (this.tokenCache[idx]) {
      yield* this.tokenCache[idx];
    } else {
      this.tokenCacheQueryID = querier.queryID;
      let tokens = this.tokenCache[idx] = [];

      for (const tokenType of this.tokenTypes) {
        for (const token of tokenType.parse(querier, idx)) {
          tokens.push(token);
          yield token;
        }
      }
    }
  }
}

class Token {
  constructor(start, end, type, value, score = 100, precedence = -1, isTruncated = false) {
    this.start = start;
    this.end = end;
    this.type = type;
    this.value = value;
    this.score = score;
    this.precedence = precedence;
    this.isTruncated = isTruncated;
  }
}

class TokenType {
  constructor() {
    if (this.constructor == TokenType) throw new Error("Abstract classes can't be instantiated.");
    // If we see this token, should we know what block it's connected to?
    // IE TokenTypeStringEnum is a defining feature because we can narrow down
    //  what block it's from based only on it's value. TokenTypeStringLiteral, however
    //  is not as it could be a part of lot's of different blocks.
    this.isDefiningFeature = false;
    // Is this token type always represented by the same string of characters?
    this.isConstant = false;
    // Does this token have other token babies
    this.hasSubTokens = false;
  }

  *parse(querier, idx) {
    throw new Error("Sub-classes must override this method.");
  }

  createBlock(token, querier) {
    throw new Error("Cannot create a block from this token type.");
  }

  createText(token, querier, autocomplete) {
    throw new Error("Sub-classes must override this method.");
  }

  isBlock(token) {
    return false;    
  }
}

class TokenTypeStringEnum extends TokenType {
  constructor(values) {
    super();
    this.values = values;
    this.isDefiningFeature = true;
    this.isConstant = this.values.length === 1;
  }

  *parse(querier, idx) {
    for (const value of this.values) {
      const remainingChar = querier.query.length - idx;
      if (remainingChar < value[0].length) {
        if (value[0].startsWith(querier.query.substring(idx))) {
          const end = remainingChar < 0 ? 0 : querier.query.length;
          yield new Token(idx, end, this, value[1], undefined, undefined, true);
        }
      } else {
        if (querier.query.startsWith(value[0], idx))
          yield new Token(idx, idx + value[0].length, this, value[1]);
      }
    }
  }

  createText(token, querier, autocomplete) {
    if (token.isTruncated && autocomplete) autocomplete[0] = false;
    return this.values.find(value => value[1] === token.value)[0];
  }
}

class TokenTypeStringLiteral extends TokenType {
  static TERMINATORS = [undefined, " ", "+", "-", "*", "/", "(", ")"];

  *parse(querier, idx) {
    let wasTerminator = false;
    for (let i = idx; i <= querier.query.length; i++) {
      if (TokenTypeStringLiteral.TERMINATORS.indexOf(querier.query[i]) !== -1) {
        if (!wasTerminator || i === querier.query.length) {
          yield new Token(idx, i, this, querier.query.substring(idx, i), -1000);
        }
        wasTerminator = true;
      } else {
        wasTerminator = false;
      }
    }
  }

  createText(token, querier, autocomplete) {
    return token.value;
  }
}

class TokenTypeNumberLiteral extends TokenType {
  static NUM_CHAR = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "."];
  static HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

  *parse(querier, idx) {
    if (idx >= querier.query.length) {
      yield new Token(idx, idx, this, "", undefined, undefined, true);
      return;
    }

    if (querier.query.startsWith("0x", idx)) {
      if (idx + 2 === querier.query.length) {
        yield new Token(idx, idx + 2, this, "0x0", undefined, undefined, true);
        return;
      }
      for (let i = idx + 2; i <= querier.query.length; i++) {
        const char = querier.query[i];
        if (TokenTypeStringLiteral.TERMINATORS.indexOf(char) !== -1) {
          if (i !== idx + 2)
            yield new Token(idx, i, this, querier.query.substring(idx, i));
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

  createText(token, querier) {
    if (token.isTruncated) return token.value;
    return querier.query.substring(token.start, token.end);
  }
}

class TokenTypeBrackets extends TokenType {
  constructor(tokenGroup) {
    super();
    this.tokenGroup = tokenGroup;
    this.hasSubTokens = true;
  }

  *parse(querier, idx) {
    const start = idx;
    if (querier.query[idx++] !== "(") return;
    idx = TokenTypeBlock.skipIgnorable(querier, idx);
    for (const token of this.tokenGroup.parseTokens(querier, idx)) {
      var tokenEnd = TokenTypeBlock.skipIgnorable(querier, token.end);
      let isTruncated = token.isTruncated;
      if (!isTruncated) {
        if (tokenEnd === querier.query.length) isTruncated = true;
        else if (querier.query[tokenEnd] === ")") ++tokenEnd;
        else continue;
      }
      const newToken = new Token(start, tokenEnd, this, token.value, token.score + 100, 0, isTruncated);
      newToken.innerToken = token;
      yield newToken;
    }
  }

  isBlock(token) {
    return token.innerToken.type?.isBlock(token.innerToken);
  }

  createBlock(token, querier) {
    return token.innerToken.type?.createBlock(token.innerToken, querier);
  }

  createText(token, querier, autocomplete) {
    let text = "(";
    text += querier.query.substring(token.start + 1, token.innerToken.start);
    text += token.innerToken.type?.createText(token.innerToken, querier, autocomplete) ?? "";
    if (autocomplete && !autocomplete[0]) {
      return text;
    }
    if (token.innerToken.end !== token.end)
      text += querier.query.substring(token.innerToken.end, token.end - 1);
    text += ")";
    return text;
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

    this.hasSubTokens = true;

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
    for (const subtokens of this._parseSubtoken(idx, 0, querier)) {
      let score = 0;
      let isTruncated = false;
      let fullyTrauncated = 0;
      let hasDefiningFeature = false;
      for (const subtoken of subtokens) {
        isTruncated |= subtoken.isTruncated;
        if (!subtoken.isTruncated) score += subtoken.score;
        else if (subtoken.end === subtoken.start) {
          ++fullyTrauncated;
        } else score += subtoken.score / 2;
        if (subtoken.precedence < this.block.precedence) score += 5;
        if (subtoken.type?.isDefiningFeature && subtoken.start < querier.query.length)
          hasDefiningFeature = true;
      }
      if (!hasDefiningFeature) return;
      score = Math.floor(score + 1000 * (1 - fullyTrauncated / subtokens.length));
      yield new Token(idx, subtokens[0].end, this, subtokens, score, this.block.precedence, isTruncated);
    }
  }

  *_parseSubtoken(idx, tokenGroupIdx, querier) {
    idx = TokenTypeBlock.skipIgnorable(querier, idx);
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
          if (innerToken.type.isBlock(innerToken)) {
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

  createText(token, querier, autocomplete) {
    if (!token.isTruncated)
      return querier.query.substring(token.start, token.end);
    let text = "";
    if (token.start !== token.value.at(-1).start) {
      text += querier.query.substring(token.start, token.value.at(-1).start);
    }
    for (let i = token.value.length - 1; i >= 0; i--) {
      const subtoken = token.value[i];
      const subtokenText = subtoken.type?.createText(subtoken, querier, autocomplete) ?? "";
      text += subtokenText;
      if (i !== 0) {
        if (autocomplete && !autocomplete[0] && (subtoken.type?.hasSubTokens || !token.value[i - 1].type?.isConstant))
          return text;
        const nextStart = token.value[i - 1].start;
        if (nextStart !== subtoken.end) {
          text += querier.query.substring(subtoken.end, nextStart);
        } else {
          if (subtokenText.length !== 0 && TokenTypeBlock.IGNORABLE_CHARS.indexOf(subtokenText.at(-1)) === -1)
            text += " ";
        }
      }
    }
    return text;
  }

  isBlock(token) {
    return true;
  }
}

class QueryOption {
  constructor(querier, token) {
    this.querier = querier;
    this.token = token;
  }

  get isTruncated() {
    return this.token.isTruncated;
  }

  get text() {
    if (this._text) return this._text;
    return this._text = this.token.type?.createText(this.token, this.querier) ?? "";
  }

  get autocomplete() {
    if (this._autocomplete) return this._autocomplete;
    return this._autocomplete = this.token.type?.createText(this.token, this.querier, [true]);
  }

  createBlock() {
    return this.token.type?.createBlock(this.token, this.querier);
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
    "operator_equals",
    "operator_lt",
    "operator_gt",
    "operator_or",
    "operator_and",
    "operator_not",
  ];

  constructor(blockly) {
    this.Blockly = blockly;
  }

  indexWorkspace(workspace) {
    this.workspace = workspace;
    this.queryID = 0;

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

    //// Triangle boolean reporter blocks ////
    this.tokenTypeGroupBooleanBlocks = new TokenTypeGroup(null, true);
    // Triangle boolean reporter blocks + Brackets
    this.tokenTypeGroupBoolean = new TokenTypeGroup([this.tokenTypeGroupBooleanBlocks], true);
    this.tokenTypeGroupBoolean.tokenTypes.push(new TokenTypeBrackets(this.tokenTypeGroupBoolean));

    //// Round value reporter blocks ////
    this.tokenTypeGroupValues = new TokenTypeGroup(null, true);
    // Round Reporters + Triangle Reports + String Literals + Brackets
    this.tokenTypeGroupString = new TokenTypeGroup([this.tokenTypeGroupValues, this.tokenTypeGroupBooleanBlocks], true, new TokenTypeStringLiteral());
    this.tokenTypeGroupString.tokenTypes.push(new TokenTypeBrackets(this.tokenTypeGroupString));
    // Round Reporters + Triangle Reports + Number Literals + Brackets
    this.tokenTypeGroupNumber = new TokenTypeGroup([this.tokenTypeGroupValues, this.tokenTypeGroupBooleanBlocks], true, new TokenTypeNumberLiteral());
    this.tokenTypeGroupNumber.tokenTypes.push(new TokenTypeBrackets(this.tokenTypeGroupNumber));

    // We still want to try autocomplete 'round' things like variable where booleans should go
    this.tokenTypeGroupBoolean.trauncatedParents.push(this.tokenTypeGroupValues);

    /// Stackable Block ////
    this.tokenTypeGroupStackableBlocks = new TokenTypeGroup(null, true);

    //// All blocks + Brackets ////
    this.tokenTypeGroupBlocks = new TokenTypeGroup(
      [this.tokenTypeGroupValues, this.tokenTypeGroupBooleanBlocks, this.tokenTypeGroupStackableBlocks],
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

  // Clear the memory used by the workspace index
  clearWorkspaceIndex() {
    this.blocks = null;
    this.tokenTypeGroupValues = null;
    this.tokenTypeGroupString = null;
    this.tokenTypeGroupNumber = null;
    this.tokenTypeGroupBooleanBlocks = null;
    this.tokenTypeGroupBoolean = null;
    this.tokenTypeGroupStackableBlocks = null;
    this.tokenTypeGroupBlocks = null;
  }

  queryWorkspace(query) {
    if (query.length === 0) return [];
    this.query = query.replaceAll(String.fromCharCode(160), " ");
    ++this.queryID;
    const options = [];

    for (const option of this.tokenTypeGroupBlocks.parseTokens(this, 0)) {
      if (option.end >= query.length) {
        options.push(new QueryOption(this, option));
      }
      if (options.length > 1000) break;
    }

    return options.sort((a, b) => b.token.score - a.token.score);
  }
}
