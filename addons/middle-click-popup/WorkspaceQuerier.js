//
// I'm really sorry if somebody other than me ever has to debug this
//  Wish you luck <3
//

import { BlockShape, BlockTypeInfo } from "./BlockTypeInfo.js";

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
    yield TokenTypeBlank.INSTANCE.createToken(idx);
    yield* this.inner.parseTokens(query, idx);
  }
}

class TokenProviderGroup extends TokenProvider {
  constructor() {
    super(false);
    this.providers = [];
    this.cache = null;
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
  constructor(dontCache = false) {
    super(!dontCache);

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

class TokenTypeCache extends TokenType {
  constructor(inner) {
    super(false);
    this.inner = inner;
    if (this.inner.shouldCache) {
      this.cache = [];
      this.cacheQueryID = null;
    }
  }

  *parseTokens(query, idx) {
    if (!this.inner.shouldCache) {
      yield* this.inner.parseTokens();
      return;
    }
    if (this.cacheQueryID !== query.id) {
      this.cache = [];
      this.cacheQueryID = query.id;
    }
    let cacheEntry = this.cache[idx];
    if (cacheEntry) {
      yield* cacheEntry;
      return;
    }
    this.cacheEntry = [];
    for (const token of this.inner.parseTokens(query, idx)) {
      this.cacheEntry.push(token);
      yield token;
    }
  }
}

class TokenTypeBlank extends TokenType {
  static INSTANCE = new TokenTypeBlank();

  constructor() {
    super();
    this.isConstant = true;
  }

  *parseTokens(query, idx) {
    yield this.createToken(idx);
  }

  createToken(idx) {
    return new Token(idx, idx, this, null, -5000);
  }

  createText(token, query, autocomplete) {
    return "";
  }
}

class StringEnum {
  static FullTokenType = class extends TokenType {
    constructor(stringEnum) {
      super();
      this.stringEnum = stringEnum;
      this.isDefiningFeature = true;
      this.isConstant = stringEnum.isConstant;
    }

    *parseTokens(query, idx) {
      for (const token of this.stringEnum.getFullValues(query, idx)) {
        if (token) yield token;
      }
    }

    createText(token, query, autocomplete) {
      if (token.isTruncated && autocomplete) autocomplete[0] = false;
      return token.value.string; // TODO Return capitalization in that's used in the query
    }
  };

  // Griffpatch waneted to be able to query things like 'br p b'
  //  and have it suggest 'broadcast Paint Block'. This token type
  //  is for these tokens where everything but the first letter can
  //  be omitted. Hense, this is called the GriffTokenType™
  static GriffTokenType = class extends TokenType {
    constructor(enumValues) {
      super();
      this.values = enumValues;
      this.isConstant = this.values.length === 1;
      this.isDefiningFeature = this.isConstant;
    }

    *parseTokens(query, idx) {
      const fullValues = this.values.getFullValues(query, idx);
      outer: for (let valueIdx = 0; valueIdx < this.values.length; valueIdx++) {
        if (fullValues[valueIdx]) {
          if (!fullValues[valueIdx].isTruncated) continue;
        }
        const valueInfo = this.values.values[valueIdx];
        let i = idx;

        for (let j = 0; j < valueInfo.parts.length; j++) {
          const part = valueInfo.parts[j];
          let queryPartEnd = query.skipUnignorable(i);
          const queryPart = query.lowercase.substring(i, queryPartEnd);
          const queryMatch = part.startsWith(queryPart);
          if (!queryMatch || queryPartEnd >= query.length) {
            if (j !== 0) {
              if (!queryMatch) queryPartEnd = i;
              yield new Token(
                idx,
                queryPartEnd,
                this,
                {
                  valueInfo,
                  part: j,
                  length: queryPartEnd - i,
                },
                10000,
                undefined,
                queryPartEnd >= query.length
              );
            }
            continue outer;
          }
          i = query.skipIgnorable(queryPartEnd);
        }

        yield new Token(idx, i, this, { valueInfo }, 10000);
      }
    }

    createBlockValue(token, query) {
      return token.value.valueInfo.value; // I may have named too many things 'value'
    }

    createText(token, query, autocomplete) {
      if (!token.isTruncated) {
        return query.str.substring(token.start, token.end);
      }
      const str = query.str.substring(token.start, token.end - token.value.length);
      const part = token.value.valueInfo.parts[token.value.part];
      return str + part;
    }
  };

  constructor(values) {
    this.values = [];
    for (const value of values) {
      const lower = value.string.toLowerCase();
      const parts = [];
      {
        let lastPart = 0;
        for (let i = 0; i <= lower.length; i++) {
          const char = lower[i];
          if (QueryInfo.IGNORABLE_CHARS.indexOf(char) !== -1 || !char) {
            parts.push(lower.substring(lastPart, i));
            i = QueryInfo.skipIgnorable(lower, i);
            lastPart = i;
          }
        }
      }
      this.values.push({ lower, parts, value });
    }
    this.cache = null;
    this.cacheQueryID = null;

    this.fullTokenProvider = new StringEnum.FullTokenType(this);
    this.griffTokenProvider = new StringEnum.GriffTokenType(this);
    this.bothTokenProvider = new TokenProviderGroup();
    this.bothTokenProvider.pushProviders(this.fullTokenProvider, this.griffTokenProvider);
  }

  getFullValues(query, idx) {
    if (this.cacheQueryID !== query.id) {
      this.cacheQueryID = query.id;
      this.cache = [];
    }
    let cacheEntry = this.cache[idx];
    if (cacheEntry) return cacheEntry;
    cacheEntry = this.cache[idx] = [];

    for (let valueIdx = 0; valueIdx < this.length; valueIdx++) {
      const valueInfo = this.values[valueIdx];
      cacheEntry.push(null);
      const remainingChar = query.length - idx;
      if (remainingChar < valueInfo.lower.length) {
        if (valueInfo.lower.startsWith(query.lowercase.substring(idx))) {
          const end = remainingChar < 0 ? 0 : query.length;
          cacheEntry[valueIdx] = new Token(idx, end, this.fullTokenProvider, valueInfo.value, 100000, undefined, true);
        }
      } else {
        if (query.lowercase.startsWith(valueInfo.lower, idx)) {
          if (TokenTypeStringLiteral.TERMINATORS.indexOf(query.lowercase[idx + valueInfo.lower.length]) !== -1)
            cacheEntry[valueIdx] = new Token(
              idx,
              idx + valueInfo.lower.length,
              this.fullTokenProvider,
              valueInfo.value
            );
        }
      }
    }
    return cacheEntry;
  }

  get length() {
    return this.values.length;
  }

  get isConstant() {
    return this.length === 1;
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
  static createBlockTokenTypes(querier, block) {
    let fullTokenProviders = [];
    let griffTokenProviders = [];

    let hasDefiningFeature = false;

    for (const blockPart of block.parts) {
      let fullTokenProvider;
      let griffTokenProvider;
      if (typeof blockPart === "string") {
        const stringEnum = new StringEnum([{ value: null, string: blockPart }]);
        fullTokenProvider = stringEnum.fullTokenProvider;
        griffTokenProvider = stringEnum.griffTokenProvider;
        if (hasDefiningFeature) {
          fullTokenProvider = new TokenProviderOptional(fullTokenProvider);
          griffTokenProvider = new TokenProviderOptional(stringEnum.bothTokenProvider);
        } else hasDefiningFeature = true;
      } else {
        switch (blockPart.type) {
          case BlockTypeInfo.BLOCK_INPUT_ENUM:
            const stringEnum = new StringEnum(blockPart.values);
            fullTokenProvider = stringEnum.fullTokenProvider;
            griffTokenProvider = stringEnum.griffTokenProvider;
            hasDefiningFeature = true;
            break;
          case BlockTypeInfo.BLOCK_INPUT_STRING:
            fullTokenProvider = querier.tokenGroupString;
            griffTokenProvider = new TokenProviderOptional(querier.tokenTypeStringLiteral);
            break;
          case BlockTypeInfo.BLOCK_INPUT_NUMBER:
            fullTokenProvider = querier.tokenGroupNumber;
            griffTokenProvider = new TokenProviderOptional(querier.tokenTypeNumberLiteral);
            break;
          case BlockTypeInfo.BLOCK_INPUT_COLOUR:
            fullTokenProvider = TokenTypeColor.INSTANCE;
            griffTokenProvider = TokenTypeColor.INSTANCE;
            break;
          case BlockTypeInfo.BLOCK_INPUT_BOOLEAN:
            fullTokenProvider = querier.tokenGroupBoolean;
            griffTokenProvider = TokenTypeBlank.INSTANCE;
            break;
          case BlockTypeInfo.BLOCK_INPUT_BLOCK:
            fullTokenProvider = querier.tokenGroupStack;
            griffTokenProvider = TokenTypeBlank.INSTANCE;
            break;
        }
      }
      fullTokenProviders.push(fullTokenProvider);
      griffTokenProviders.push(griffTokenProvider);
    }

    return [new TokenTypeBlock(block, fullTokenProviders), new TokenTypeBlock(block, griffTokenProviders)];
  }

  constructor(block, tokenProviders) {
    super();
    this.block = block;
    this.tokenProviders = tokenProviders;
    this.hasSubTokens = true;
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
      score += Math.floor(1000 * (subtokens.length / this.tokenProviders.length));
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

  static skipIgnorable(str, idx) {
    while (QueryInfo.IGNORABLE_CHARS.indexOf(str[idx]) !== -1) ++idx;
    return idx;
  }

  skipIgnorable(idx) {
    return QueryInfo.skipIgnorable(this.queryLc, idx);
  }

  static skipUnignorable(str, idx) {
    while (QueryInfo.IGNORABLE_CHARS.indexOf(str[idx]) === -1 && idx < str.length) ++idx;
    return idx;
  }

  skipUnignorable(idx) {
    return QueryInfo.skipUnignorable(this.queryLc, idx);
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
    this.tokenTypeStringLiteral = new TokenTypeCache(new TokenTypeStringLiteral());
    this.tokenTypeNumberLiteral = new TokenTypeCache(new TokenTypeNumberLiteral());

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
      this.tokenTypeNumberLiteral,
      this.tokenGroupRoundBlocks,
      this.tokenGroupBooleanBlocks,
      new TokenTypeBrackets(this.tokenGroupNumber)
    );

    // Anything that fits into a string hole (Round blocks + Boolean blocks + String Literals + Brackets)
    this.tokenGroupString = new TokenProviderOptional(new TokenProviderGroup());
    this.tokenGroupString.inner.pushProviders(
      this.tokenTypeStringLiteral,
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
      for (const blockTokenType of TokenTypeBlock.createBlockTokenTypes(this, block)) {
        if (block.id === "control_if") {
          console.log(blockTokenType);
        }
        switch (block.shape) {
          case BlockShape.Round:
            this.tokenGroupRoundBlocks.pushProviders(blockTokenType);
            break;
          case BlockShape.Boolean:
            this.tokenGroupBooleanBlocks.pushProviders(blockTokenType);
            break;
          case BlockShape.Stack:
          case BlockShape.End:
            this.tokenGroupStackBlocks.pushProviders(blockTokenType);
            break;
          case BlockShape.Hat:
            this.tokenGroupHatBlocks.pushProviders(blockTokenType);
            break;
        }
      }
    }
  }

  _destroyTokenGroups() {
    this.tokenTypeStringLiteral = null;
    this.tokenTypeNumberLiteral = null;

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
