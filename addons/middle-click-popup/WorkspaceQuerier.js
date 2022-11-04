//
// I'm really sorry if somebody other than me ever has to debug this
//  Wish you luck <3
//

class TokenProvider {
  constructor(shouldCache) {
    this.shouldCache = shouldCache;
  }

  *parseTokens(query, idx) {
    throw new Error("Sub-class must implement interface member parseTokens");
  }
}

class TokenProviderOptional extends TokenProvider {
  constructor(inner) {
    super(inner.shouldCache);
    this.inner = inner;
  }

  *parseTokens(query, idx) {
    yield new Token(idx, idx, TokenTypeBlank.INSTANCE, null, -1);
    if (idx >= query.length) return;
    yield* this.inner.parseTokens(query, idx);
  }
}

class TokenProviderGroup extends TokenProvider {
  constructor() {
    super(false);
    this.providers = [];
    this.cache = [];
    this.cacheQueryID = null;
    this.hasCachable = false;
  }

  pushProviders(...providers) {
    if (!this.hasCachable)
      for (const provider of providers) {
        if (provider.shouldCache) {
          this.hasCachable = true;
          break;
        }
      }
    this.providers.push(...providers);
  }

  *parseTokens(query, idx) {
    if (!this.hasCachable) {
      for (const provider of this.providers) yield* provider.parseTokens(query, idx, false);
      return;
    }

    if (this.cacheQueryID !== query.id) {
      this.cache = [];
      this.cacheQueryID = query.id;
    } else {
      const cacheEntry = this.cache[idx];
      if (cacheEntry) {
        const tokenCaches = cacheEntry.tokenCaches;
        const providerCaches = cacheEntry.providerCaches;
        for (let i = 0; i < tokenCaches.length; i++) {
          const tokenCache = tokenCaches[i];
          const providerCache = providerCaches[i];
          for (const provider of providerCache) yield* provider.parseTokens(query, idx, false);
          yield* tokenCache;
        }
        return;
      }
    }

    let tokenCache = [];
    let providerCache = [];

    const tokenCaches = [tokenCache];
    const providerCaches = [providerCache];
    this.cache[idx] = { tokenCaches, providerCaches };

    for (const provider of this.providers) {
      if (provider.shouldCache) {
        for (const token of provider.parseTokens(query, idx, false)) {
          tokenCache.push(token);
          yield token;
        }
      } else {
        if (tokenCache.length !== 0) {
          tokenCache = [];
          providerCache = [];
          tokenCaches.push(tokenCache);
          providerCaches.push(providerCache);
        }
        providerCache.push(provider);
        yield* provider.parseTokens(query, idx, false);
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

class TokenType extends TokenProvider {
  constructor() {
    super(true);

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

  createBlock(token, query) {
    throw new Error("Cannot create a block from this token type.");
  }

  createText(token, query, autocomplete) {
    throw new Error("Sub-classes must override this method.");
  }

  isBlock(token) {
    return false;
  }
}

class TokenTypeBlank extends TokenType {
  static INSTANCE = new TokenTypeBlank();

  constructor() {
    super();
    this.isConstant = true;
  }

  createText(token, query, autocomplete) {
    return "";
  }
}

class TokenTypeStringEnum extends TokenType {
  constructor(values) {
    super();
    this.values = values;
    this.isDefiningFeature = true;
    this.isConstant = this.values.length === 1;
  }

  *parseTokens(query, idx) {
    for (const value of this.values) {
      const remainingChar = query.length - idx;
      if (remainingChar < value[0].length) {
        if (value[0].startsWith(query.lowercase.substring(idx))) {
          const end = remainingChar < 0 ? 0 : query.length;
          yield new Token(idx, end, this, value[1], undefined, undefined, true);
        }
      } else {
        if (query.lowercase.startsWith(value[0], idx)) yield new Token(idx, idx + value[0].length, this, value[1]);
      }
    }
  }

  createText(token, query, autocomplete) {
    if (token.isTruncated && autocomplete) autocomplete[0] = false;
    return this.values.find((value) => value[1] === token.value)[0];
  }
}

class TokenTypeStringLiteral extends TokenType {
  static TERMINATORS = [undefined, " ", "+", "-", "*", "/", "=", "<", ">", "(", ")"];

  *parseTokens(query, idx) {
    let wasTerminator = false;
    for (let i = idx; i <= query.length; i++) {
      if (TokenTypeStringLiteral.TERMINATORS.indexOf(query.str[i]) !== -1) {
        if (!wasTerminator || i === query.length) {
          yield new Token(idx, i, this, query.str.substring(idx, i), -1000);
        }
        wasTerminator = true;
      } else {
        wasTerminator = false;
      }
    }
  }

  createText(token, query, autocomplete) {
    return token.value;
  }
}

class TokenTypeNumberLiteral extends TokenType {
  static NUM_CHAR = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "."];
  static HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

  *parseTokens(query, idx) {
    if (idx >= query.length) {
      yield new Token(idx, idx, this, "", undefined, undefined, true);
      return;
    }

    if (query.str.startsWith("0x", idx)) {
      if (idx + 2 === query.length) {
        yield new Token(idx, idx + 2, this, "0x0", undefined, undefined, true);
        return;
      }
      for (let i = idx + 2; i <= query.length; i++) {
        const char = query.str[i];
        if (TokenTypeStringLiteral.TERMINATORS.indexOf(char) !== -1) {
          if (i !== idx + 2) yield new Token(idx, i, this, query.str.substring(idx, i));
          break;
        }
        if (TokenTypeNumberLiteral.HEX_CHARS.indexOf(char) === -1) break;
      }
    }

    for (let i = idx; i <= query.length; i++) {
      const char = query.str[i];
      if (TokenTypeStringLiteral.TERMINATORS.indexOf(char) !== -1) {
        if (i !== idx) yield new Token(idx, i, this, query.str.substring(idx, i));
        break;
      }
      if (TokenTypeNumberLiteral.NUM_CHAR.indexOf(char) === -1) break;
    }
  }

  createText(token, query) {
    if (token.isTruncated) return token.value;
    return query.query.substring(token.start, token.end);
  }
}

class TokenTypeBrackets extends TokenType {
  constructor(tokenProvider) {
    super();
    this.tokenProvider = tokenProvider;
    this.hasSubTokens = true;
  }

  *parseTokens(query, idx) {
    const start = idx;
    if (query.str[idx++] !== "(") return;
    idx = query.skipIgnorable(idx);
    for (const token of this.tokenProvider.parseTokens(query, idx)) {
      var tokenEnd = query.skipIgnorable(token.end);
      let isTruncated = token.isTruncated;
      if (!isTruncated) {
        if (tokenEnd === query.length) isTruncated = true;
        else if (query.str[tokenEnd] === ")") ++tokenEnd;
        else continue;
      }
      const newToken = new Token(start, tokenEnd, this, token.value, token.score + 100, 0, isTruncated);
      newToken.innerToken = token;
      yield newToken;
    }
  }

  isBlock(token) {
    return token.innerToken.type.isBlock(token.innerToken);
  }

  createBlock(token, query) {
    return token.innerToken.type.createBlock(token.innerToken, query);
  }

  createText(token, query, autocomplete) {
    let text = "(";
    text += query.str.substring(token.start + 1, token.innerToken.start);
    text += token.innerToken.type.createText(token.innerToken, query, autocomplete);
    if (autocomplete && !autocomplete[0]) {
      return text;
    }
    if (token.innerToken.end !== token.end) text += query.str.substring(token.innerToken.end, token.end - 1);
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

  constructor(block, querier) {
    super();

    this.block = block;
    this.tokenProviders = [];

    this.hasSubTokens = true;

    const _appendTokenProviders = (block) => {
      let hasDefiningFeature = false;
      for (const input of block.inputList) {
        for (const field of input.fieldRow) {
          if (field.className_ === "blocklyText blocklyDropdownText") {
            const fieldOptions = field.getOptions();
            for (let i = 0; i < fieldOptions.length; i++) {
              if (
                typeof fieldOptions[i][1] !== "string" ||
                TokenTypeBlock.INVALID_FIELDS.indexOf(fieldOptions[i][1]) !== -1
              ) {
                fieldOptions.splice(i, 1);
                continue;
              }
              fieldOptions[i][0] = fieldOptions[i][0].toLowerCase();
            }
            this.tokenProviders.push(new TokenTypeStringEnum(fieldOptions));
            hasDefiningFeature = true;
          } else if (field.argType_) {
            if (field.argType_[0] === "colour") {
              // TODO
            } else if (field.argType_[1] === "number") {
              this.tokenProviders.push(querier.tokenGroupNumber);
            } else {
              this.tokenProviders.push(querier.tokenGroupString);
            }
          } else {
            const provider = new TokenTypeStringEnum([[field.getText().toLowerCase(), null]]);
            if (!hasDefiningFeature) {
              this.tokenProviders.push(provider);
              hasDefiningFeature = true;
            } else {
              this.tokenProviders.push(new TokenProviderOptional(provider));
            }
          }
        }

        if (input.connection) {
          const innerBlock = input.connection.targetBlock();
          if (innerBlock) {
            _appendTokenProviders(innerBlock);
          } else {
            if (input.outlinePath) {
              this.tokenProviders.push(querier.tokenGroupBoolean);
            } else {
              this.tokenProviders.push(querier.tokenGroupStack);
            }
          }
        }
      }
    };
    _appendTokenProviders(block.workspaceForm);
  }

  *parseTokens(query, idx) {
    for (const subtokens of this._parseSubtokens(idx, 0, query)) {
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
        if (subtoken.type.isDefiningFeature && subtoken.start < query.length) hasDefiningFeature = true;
      }
      if (!hasDefiningFeature) continue;
      score = Math.floor(score + 1000 * (1 - fullyTrauncated / subtokens.length));
      yield new Token(idx, subtokens[0].end, this, subtokens, score, this.block.precedence, isTruncated);
    }
  }

  *_parseSubtokens(idx, tokenProviderIdx, query) {
    idx = query.skipIgnorable(idx);
    let tokenProvider = this.tokenProviders[tokenProviderIdx];

    for (const token of tokenProvider.parseTokens(query, idx)) {
      if (this.block.precedence !== -1) {
        if (token.precedence > this.block.precedence) continue;
        if (token.precedence === this.block.precedence && tokenProviderIdx !== 0) continue;
      }

      if (tokenProviderIdx === this.tokenProviders.length - 1) {
        yield [token];
      } else {
        for (const subTokenArr of this._parseSubtokens(token.end, tokenProviderIdx + 1, query)) {
          subTokenArr.push(token);
          yield subTokenArr;
        }
      }
    }
  }

  createBlock(token, query) {
    const block = query.querier.Blockly.Xml.domToBlock(this.block.domForm, query.querier.workspace);
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
        if (innerToken.value !== null) {
          if (innerToken.type.isBlock(innerToken)) {
            const innerBlock = innerToken.type.createBlock(innerToken, query);
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

  createText(token, query, autocomplete) {
    if (!token.isTruncated) return query.str.substring(token.start, token.end);
    let text = "";
    if (token.start !== token.value.at(-1).start) {
      text += query.str.substring(token.start, token.value.at(-1).start);
    }
    for (let i = token.value.length - 1; i >= 0; i--) {
      const subtoken = token.value[i];
      const subtokenText = subtoken.type.createText(subtoken, query, autocomplete) ?? "";
      text += subtokenText;
      if (i !== 0) {
        if (autocomplete && !autocomplete[0] && (subtoken.type.hasSubTokens || !token.value[i - 1].type.isConstant))
          return text;
        const nextStart = token.value[i - 1].start;
        if (nextStart !== subtoken.end) {
          text += query.str.substring(subtoken.end, nextStart);
        } else {
          if (subtokenText.length !== 0 && QueryInfo.IGNORABLE_CHARS.indexOf(subtokenText.at(-1)) === -1) text += " ";
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
  constructor(query, token) {
    this.query = query;
    this.token = token;
  }

  get isTruncated() {
    return this.token.isTruncated;
  }

  get text() {
    if (this._text) return this._text;
    return (this._text = this.token.type.createText(this.token, this.query) ?? "");
  }

  get autocomplete() {
    if (this._autocomplete) return this._autocomplete;
    return (this._autocomplete = this.token.type.createText(this.token, this.query, [true]));
  }

  createBlock() {
    return this.token.type.createBlock(this.token, this.query);
  }
}

class QueryInfo {
  static IGNORABLE_CHARS = [" "];

  constructor(querier, query, id) {
    this.querier = querier;
    this.query = query.replaceAll(String.fromCharCode(160), " ");
    this.queryLc = this.query.toLowerCase();
    this.id = id;
  }

  skipIgnorable(idx) {
    while (QueryInfo.IGNORABLE_CHARS.indexOf(this.str[idx]) !== -1) ++idx;
    return idx;
  }

  get length() {
    return this.query.length;
  }

  get str() {
    return this.query;
  }

  get lowercase() {
    return this.queryLc;
  }
}

export default class WorkspaceQuerier {
  static ORDER_OF_OPERATIONS = [
    null, // brackets
    "operator_round",
    "operator_mathop",
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

  static MAX_TOKENS = 1000;

  constructor(blockly) {
    this.Blockly = blockly;
  }

  indexWorkspace(workspace) {
    this.workspace = workspace;
    this._queryCounter = 0;
    this._createTokenGroups();
    this._poppulateTokenGroups();
  }

  queryWorkspace(queryStr) {
    if (queryStr.length === 0) return [];

    const query = new QueryInfo(this, queryStr, this._queryCounter++);
    const results = [];
    let foundTokenCount = 0;

    for (const option of this.tokenGroupBlocks.parseTokens(query, 0)) {
      if (option.end >= queryStr.length) {
        results.push(new QueryOption(query, option));
      }
      ++foundTokenCount;
      if (foundTokenCount > WorkspaceQuerier.MAX_TOKENS) {
        console.log("Warning: Workspace query exceeded maximum token count.");
        break;
      }
    }
    return results.sort((a, b) => b.token.score - a.token.score);
  }

  _createTokenGroups() {
    this.tokenGroupRoundBlocks = new TokenProviderGroup(); // Round blocks like (() + ()) or (my variable)
    this.tokenGroupBooleanBlocks = new TokenProviderGroup(); // Boolean blocks like <not ()>
    this.tokenGroupStackBlocks = new TokenProviderGroup(); // Stackable blocks like `move (10) steps`
    this.tokenGroupHatBlocks = new TokenProviderGroup(); // Hat block like `when green flag clicked`

    // Anything that fits into a boolean hole. (Boolean blocks + Brackets)
    this.tokenGroupBoolean = new TokenProviderOptional(new TokenProviderGroup());
    this.tokenGroupBoolean.inner.pushProviders(
      this.tokenGroupBooleanBlocks,
      new TokenTypeBrackets(this.tokenGroupBoolean)
    );

    // Anything that fits into a number hole. (Round blocks + Boolean blocks + Number Literals + Brackets)
    this.tokenGroupNumber = new TokenProviderOptional(new TokenProviderGroup());
    this.tokenGroupNumber.inner.pushProviders(
      new TokenTypeNumberLiteral(),
      this.tokenGroupRoundBlocks,
      this.tokenGroupBooleanBlocks,
      new TokenTypeBrackets(this.tokenGroupNumber)
    );

    // Anything that fits into a string hole (Round blocks + Boolean blocks + String Literals + Brackets)
    this.tokenGroupString = new TokenProviderOptional(new TokenProviderGroup());
    this.tokenGroupString.inner.pushProviders(
      new TokenTypeStringLiteral(),
      this.tokenGroupRoundBlocks,
      this.tokenGroupBooleanBlocks,
      new TokenTypeBrackets(this.tokenGroupString)
    );

    // Anything that fits into a c shaped hole (Stackable blocks)
    this.tokenGroupStack = new TokenProviderOptional(this.tokenGroupStackBlocks);

    // Anything you can spawn using the menu (All blocks)
    this.tokenGroupBlocks = new TokenProviderGroup();
    this.tokenGroupBlocks.pushProviders(
      this.tokenGroupStackBlocks,
      this.tokenGroupBooleanBlocks,
      this.tokenGroupRoundBlocks,
      this.tokenGroupHatBlocks
    );
  }

  _poppulateTokenGroups() {
    const flyoutWorkspace = this.workspace.getToolbox().flyout_.getWorkspace(); // TODO Handle undefined

    // Firstly, enumerate all the blocks. Each blocks has two representations;
    //  'DOM form' and 'Workspace form'.
    const blocks = [];
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
        blocks.push({
          id: workspaceBlock.id,
          workspaceForm: workspaceBlock,
          domForm: flyoutDomBlockMap[workspaceBlock.id],
          precedence: WorkspaceQuerier.ORDER_OF_OPERATIONS.indexOf(workspaceBlock.id),
        });
      }
    }

    // Apply order of operations
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      if (block.precedence !== -1) {
        const target = blocks.length - (WorkspaceQuerier.ORDER_OF_OPERATIONS.length - (block.precedence - 1));
        if (i !== target) {
          const oldBlock = blocks[target];
          blocks[target] = block;
          blocks[i] = oldBlock;
        }
      }
    }

    // Create the token types
    {
      const BLOCK_SHAPE_STACK = 0;
      const BLOCK_SHAPE_BOOLEAN = 1;
      const BLOCK_SHAPE_ROUND = 2;
      const BLOCK_SHAPE_HAT = 3;

      const _getBlockShape = (block) => {
        switch (block.edgeShape_) {
          case 1:
          case 2:
            return block.edgeShape_;
          default:
            return block.startHat_ ? BLOCK_SHAPE_HAT : BLOCK_SHAPE_STACK;
        }
      };

      for (const block of blocks) {
        const blockTokenType = new TokenTypeBlock(block, this);
        const blockShape = _getBlockShape(block.workspaceForm);

        if (blockShape === BLOCK_SHAPE_ROUND) {
          this.tokenGroupRoundBlocks.pushProviders(blockTokenType);
        } else if (blockShape === BLOCK_SHAPE_BOOLEAN) {
          this.tokenGroupBooleanBlocks.pushProviders(blockTokenType);
        } else if (blockShape === BLOCK_SHAPE_STACK) {
          this.tokenGroupStackBlocks.pushProviders(blockTokenType);
        } else {
          this.tokenGroupHatBlocks.pushProviders(blockTokenType);
        }
      }
    }
  }

  _destroyTokenGroups() {
    this.tokenGroupBooleanBlocks = null;
    this.tokenGroupRoundBlocks = null;
    this.tokenGroupStackBlocks = null;
    this.tokenGroupHatBlocks = null;
    this.tokenGroupBoolean = null;
    this.tokenGroupNumber = null;
    this.tokenGroupString = null;
    this.tokenGroupStack = null;
    this.tokenGroupBlocks = null;
  }

  // Clear the memory used by the workspace index
  clearWorkspaceIndex() {
    this.workspace = null;
    this._destroyTokenGroups();
  }
}
