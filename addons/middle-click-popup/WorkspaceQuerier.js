//
// I'm really sorry if somebody other than me ever has to debug this
//  Wish you luck <3
//

import BlockTypeInfo from "./BlockTypeInfo.js";

class TokenProvider {
  constructor(shouldCache) {
    if (this.constructor == TokenProvider) throw new Error("Abstract classes can't be instantiated.");
    this.shouldCache = shouldCache;
  }

  *parseTokens(query, idx) {
    throw new Error("Sub-class must override abstract method.");
  }
}

class TokenProviderOptional extends TokenProvider {
  constructor(inner) {
    super(inner.shouldCache);
    this.inner = inner;
  }

  *parseTokens(query, idx) {
    yield new Token(idx, idx, TokenTypeBlank.INSTANCE, null, -1);
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

  createBlockValue(query) {
    return this.type.createBlockValue(this, query);
  }

  // TODO createText
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

  createBlockValue(token, query) {
    return token.value;
  }

  createText(token, query, autocomplete) {
    throw new Error("Sub-class must override abstract method.");
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
    this.values = [];
    for (const value of values) {
      this.values.push({ lower: value.string.toLowerCase(), value });
    }
    this.isDefiningFeature = true;
    this.isConstant = this.values.length === 1;
  }

  *parseTokens(query, idx) {
    for (const valueInfo of this.values) {
      const remainingChar = query.length - idx;
      if (remainingChar < valueInfo.lower.length) {
        if (valueInfo.lower.startsWith(query.lowercase.substring(idx))) {
          const end = remainingChar < 0 ? 0 : query.length;
          yield new Token(idx, end, this, valueInfo.value, 100000, undefined, true);
        }
      } else {
        if (query.lowercase.startsWith(valueInfo.lower, idx)) {
          if (TokenTypeStringLiteral.TERMINATORS.indexOf(query.lowercase[idx + valueInfo.lower.length]) !== -1)
            yield new Token(idx, idx + valueInfo.lower.length, this, valueInfo.value);
        }
      }
    }
  }

  createText(token, query, autocomplete) {
    if (token.isTruncated && autocomplete) autocomplete[0] = false;
    return token.value.string; // TODO Return capitalization in that's used in the query
  }
}

class TokenTypeStringLiteral extends TokenType {
  static TERMINATORS = [undefined, " ", "+", "-", "*", "/", "=", "<", ">", "(", ")"];

  *parseTokens(query, idx) {
    let wasTerminator = false;
    for (let i = idx; i <= query.length; i++) {
      if (TokenTypeStringLiteral.TERMINATORS.indexOf(query.str[i]) !== -1) {
        if (!wasTerminator || i === query.length) {
          const value = query.str.substring(idx, i);
          yield new Token(idx, i, this, value, -300 * value.length);
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
    if (query.str.startsWith("0x", idx)) {
      if (idx + 2 === query.length) {
        yield new Token(idx, idx + 2, this, "0x0", 100000, undefined, true);
        return;
      }
      for (let i = idx + 2; i <= query.length; i++) {
        const char = query.str[i];
        if (TokenTypeStringLiteral.TERMINATORS.indexOf(char) !== -1) {
          if (i !== idx + 2) yield new Token(idx, i, this, query.str.substring(idx, i), 100000);
          break;
        }
        if (TokenTypeNumberLiteral.HEX_CHARS.indexOf(char) === -1) break;
      }
    }

    for (let i = idx; i <= query.length; i++) {
      const char = query.str[i];
      if (TokenTypeStringLiteral.TERMINATORS.indexOf(char) !== -1) {
        if (i !== idx) yield new Token(idx, i, this, query.str.substring(idx, i), 100000);
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

class TokenTypeColor extends TokenType {
  static INSTANCE = new TokenProviderOptional(new TokenTypeColor());

  *parseTokens(query, idx) {
    if (!query.str.startsWith("#", idx)) return;
    for (let i = 0; i < 6; i++) {
      if (TokenTypeNumberLiteral.HEX_CHARS.indexOf(query.lowercase[idx + i + 1]) === -1) return;
    }
    yield new Token(idx, idx + 7, this, query.str.substring(idx, idx + 7));
  }

  createText(token, query) {
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

  createBlockValue(token, query) {
    return token.innerToken.createBlockValue(token.innerToken, query);
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

    let hasDefiningFeature = false;

    for (const blockPart of this.block.parts) {
      let tokenProvider;
      if (typeof blockPart === "string") {
        tokenProvider = new TokenTypeStringEnum([{ value: null, string: blockPart }]);
        if (hasDefiningFeature) {
          tokenProvider = new TokenProviderOptional(tokenProvider);
        } else hasDefiningFeature = true;
      } else {
        switch (blockPart.type) {
          case BlockTypeInfo.BLOCK_INPUT_ENUM:
            tokenProvider = new TokenTypeStringEnum(blockPart.values);
            hasDefiningFeature = true;
            break;
          case BlockTypeInfo.BLOCK_INPUT_STRING:
            tokenProvider = querier.tokenGroupString;
            break;
          case BlockTypeInfo.BLOCK_INPUT_NUMBER:
            tokenProvider = querier.tokenGroupNumber;
            break;
          case BlockTypeInfo.BLOCK_INPUT_COLOUR:
            tokenProvider = TokenTypeColor.INSTANCE;
            break;
          case BlockTypeInfo.BLOCK_INPUT_BOOLEAN:
            tokenProvider = querier.tokenGroupBoolean;
            break;
          case BlockTypeInfo.BLOCK_INPUT_BLOCK:
            tokenProvider = querier.tokenGroupStackBlocks;
            break;
        }
      }
      this.tokenProviders.push(tokenProvider);
    }
  }

  *parseTokens(query, idx) {
    for (const subtokens of this._parseSubtokens(idx, 0, query)) {
      subtokens.reverse();
      let score = 0;
      let isTruncated = subtokens.length < this.tokenProviders.length;
      let hasDefiningFeature = false;
      for (const subtoken of subtokens) {
        isTruncated |= subtoken.isTruncated;
        if (!subtoken.isTruncated) score += subtoken.score;
        else if (subtoken.end !== subtoken.start) score += subtoken.score / 2;
        if (subtoken.precedence < this.block.precedence) score += 5;
        if (subtoken.type.isDefiningFeature && subtoken.start < query.length) hasDefiningFeature = true;
      }
      if (!hasDefiningFeature) continue;
      score = Math.floor(score + 1000 * (1 - subtokens.length / this.tokenProviders.length));
      const end = query.skipIgnorable(subtokens[subtokens.length - 1].end);
      yield new Token(idx, end, this, subtokens, score, this.block.precedence, isTruncated);
    }
  }

  *_parseSubtokens(idx, tokenProviderIdx, query, parseSubSubTokens = true) {
    idx = query.skipIgnorable(idx);
    let tokenProvider = this.tokenProviders[tokenProviderIdx];

    for (const token of tokenProvider.parseTokens(query, idx)) {
      if (this.block.precedence !== -1) {
        if (token.precedence > this.block.precedence) continue;
        if (token.precedence === this.block.precedence && tokenProviderIdx !== 0) continue;
      }

      if (!parseSubSubTokens || tokenProviderIdx === this.tokenProviders.length - 1) {
        yield [token];
      } else {
        for (const subTokenArr of this._parseSubtokens(token.end, tokenProviderIdx + 1, query, !token.isTruncated)) {
          subTokenArr.push(token);
          yield subTokenArr;
        }
      }
    }
  }

  createBlockValue(token, query) {
    const blockInputs = [];

    for (let i = 0; i < token.value.length; i++) {
      const blockPart = this.block.parts[i];
      if (typeof blockPart !== "string") blockInputs.push(token.value[i].createBlockValue(query));
    }
    while (blockInputs.length < this.block.inputs.length) blockInputs.push(null);

    return this.block.createBlock(...blockInputs);
  }

  createText(token, query, autocomplete) {
    if (!token.isTruncated) return query.str.substring(token.start, token.end);
    let text = "";
    if (token.start !== token.value[0].start) {
      text += query.str.substring(token.start, token.value[0].start);
    }
    for (let i = 0; i < token.value.length; i++) {
      const subtoken = token.value[i];
      const subtokenText = subtoken.type.createText(subtoken, query, autocomplete) ?? "";
      text += subtokenText;
      if (i !== token.value.length - 1) {
        const next = token.value[i + 1];
        if (autocomplete && !autocomplete[0] && (subtoken.type.hasSubTokens || !next.type.isConstant)) return text;
        const nextStart = next.start;
        if (nextStart !== subtoken.end) {
          text += query.str.substring(subtoken.end, nextStart);
        } else {
          if (subtokenText.length !== 0 && QueryInfo.IGNORABLE_CHARS.indexOf(subtokenText.at(-1)) === -1) text += " ";
        }
      }
    }
    return text;
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
    return this.token.createBlockValue(this.query);
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
    window.querier = this;
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
    const blocks = BlockTypeInfo.getBlocks(this.Blockly, this.workspace);
    console.log(blocks);

    // Apply order of operations
    for (const block of blocks) {
      block.precedence = WorkspaceQuerier.ORDER_OF_OPERATIONS.indexOf(block.id);
    }
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

    for (const block of blocks) {
      const blockTokenType = new TokenTypeBlock(block, this);
      if (block.id === "operator_contains") console.log(blockTokenType);

      switch (block.shape) {
        case BlockTypeInfo.BLOCK_SHAPE_ROUND:
          this.tokenGroupRoundBlocks.pushProviders(blockTokenType);
          break;
        case BlockTypeInfo.BLOCK_SHAPE_BOOLEAN:
          this.tokenGroupBooleanBlocks.pushProviders(blockTokenType);
          break;
        case BlockTypeInfo.BLOCK_SHAPE_STACK:
          this.tokenGroupStackBlocks.pushProviders(blockTokenType);
          break;
        case BlockTypeInfo.BLOCK_SHAPE_HAT:
          this.tokenGroupHatBlocks.pushProviders(blockTokenType);
          break;
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
