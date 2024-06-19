/**
 * @file Contains all the logic for the parsing of queries by the {@link WorkspaceQuerier}.
 * I'm really sorry if somebody other than me ever has to debug this.
 * Wish you luck <3
 *
 * Once you *think* you understand the function of the major classes, read the docs on
 * {@link WorkspaceQuerier._createTokenGroups} for some more specifics on the algorithm works,
 * and to achieve maximum enlightenment.
 *
 * @author Tacodiva
 */

import {
  BlockInputType,
  BlockInstance,
  BlockShape,
  BlockTypeInfo,
  BlockInputEnum,
  BlockInputString,
} from "./BlockTypeInfo.js";

/**
 *
 * A token is a part of a query that is interpreted in a specific way.
 *
 * In the query 'say 1 = Hello World', the base tokens are 'say', '1', '=, and 'Hello World'.
 * Each token contains where in the query it is located and what {@link TokenType} it is.
 *
 * Sometimes the same section of a query has multiple tokens because there are different
 * interpretations of what type of token it is. For example, imagine you had a variable named
 * 'x'. The query 'set x to 10', is ambiguous because you could be referring to the motion block
 * `set x to ()` or the data block `set [x] to ()`. This ambiguity results in two different
 * tokens being creating for 'x', one is 'set x to' referring to the motion block, and the other
 * is just 'x', referring to the variable.
 *
 * Calling this a 'token' is somewhat misleading, often language interpreters will have a 'parse tree'
 * with tokens and an 'abstract syntax tree' with higher level elements, but I have chosen to make these
 * two trees one in the same. Because of this, every token represents a logical part of a block.
 * Going back to the 'say 1 = Hello World' example, there are two 'parent' tokens, both are of type
 * {@link TokenTypeBlock}. The first is for the equals block, which contains three subtokens; '1',
 * '=' and 'Hello World'. The second is the say block, whos first child is 'say' and second child is
 * the token for the equals block (which itself has three children). For a query result to be valid,
 * it must have a token which encapsulates the entire query, in this case the say block token starts
 * at the first letter and ends at the last letter, so it's a valid interpretation. The token which
 * encapsulates the whole query is referred to as the root token.
 */
class Token {
  /**
   * @param {number} start
   * @param {number} end
   * @param {TokenType} type
   * @param {*} value
   * @param {number} precedence
   * @param {boolean} isTruncated
   * @param {boolean} isLegal
   */
  constructor(
    start,
    end,
    type,
    value,
    { precedence = -1, isProper = true, isTruncated = false, isLegal = true, isDefiningFeature = false } = {}
  ) {
    /** @type {number} The index of the first letter of this token in the query */
    this.start = start;
    /** @type {number} The index of the last letter of this token in the query */
    this.end = end;
    /** @type {TokenType} The type of this token. */
    this.type = type;
    /** @type {*} Additional information about this token, controlled and interpreted by the token type. */
    this.value = value;
    /**
     * The precedence of this token, used to implement order of operations. Tokens with a higher
     * precedence should be evaluated *after* those with a lower precedence. Brackets have a
     * precedence of 0 so they are always evaluated first. A precedence of -1 means that precedence
     * is not specified and the parser makes no guarantees about the order of operations.
     * @type {number}
     */
    this.precedence = precedence;
    /**
     * True if this token is fully written out. For example, in the query "m v = 10" where "m v"
     * expands to "my variable", the token "m v" is not proper, as it is not fully written.
     * Note that unlike trauncation, parent tokens do not inherit this property (so in the above
     * example, the '=' block token would still be proper).
     */
    this.isProper = isProper;
    /**
     * Sometimes, tokens are truncated. Imagine the query 'say Hello for 10 se', here the last
     * token should be 'seconds', but it's truncated. For this token, the isTruncated value is set
     * to true. Additionally, the token for the whole block (which contains the tokens 'say', 'Hello',
     * 'for', '10' and 'se') also has it's isTruncated value set to true, because it contains a
     * truncated token.
     * @type {boolean}
     */
    this.isTruncated = isTruncated;
    /**
     * Used to generate autocomplete text, even if that autocomplete text doesn't make a valid query
     * by itself. For example in the query 'if my varia', we want to autocomplete to 'my variable',
     * but the query 'if my variable' is still not valid, because my variable is not a boolean. In
     * this case, the 'my variable' token would still be emitted as the second child of the 'if' token,
     * but it would be marked as illegal.
     */
    this.isLegal = isLegal;
    /**
     * If we see this token, should we know what block it's connected to?
     *
     * For example, in the query 'say Hi', 'say' is a defining feature because
     * we can narrow down what block it's from based only the fact that it's present.
     * 'Hi', however, is not a defining feature as it could be a part of lots of
     * different blocks.
     *
     * This is used to help eliminate some dodgey interpretations of queries, if a block
     * has no subtokens marked a defining feature it's disguarded.
     * @type {boolean}
     */
    this.isDefiningFeature = isDefiningFeature;
  }

  /**
   * @see {TokenType.createBlockValue}
   * @param {QueryInfo} query
   * @returns
   */
  createBlockValue(query) {
    return this.type.createBlockValue(this, query);
  }
}

/**
 * The parent of any class that can enumerate tokens given a query and a location within that
 * query to search.
 *
 * As the same position in a query can have multiple interpretations (see {@link Token}), every
 * token provider's {@link parseTokens} method can return multiple tokens for the same index.
 *
 * Like tokens, there is a token provider tree. See {@link WorkspaceQuerier._createTokenGroups}
 * for more info on this tree.
 *
 * @abstract
 */
class TokenProvider {
  constructor(shouldCache) {
    if (this.constructor === TokenProvider) throw new Error("Abstract classes can't be instantiated.");
    /**
     * Can the results of this token provider be stored? True
     * if {@link parseTokens} will always return the same thing for the same inputs or if
     * this token provider already caches it's result, so caching it again is redundant.
     * @type {boolean}
     */
    this.shouldCache = shouldCache;
  }

  /**
   * Return the tokens found by this token provider in `query` at character `idx`.
   * @param {QueryInfo} query The query to search
   * @param {number} idx The index to start the search at
   * @param {number} depth The number of blocks this token is inside of.
   *  For the query 1 + 1, the `+` block token would have a depth of 0 and the `1` tokens would have a depth of 1.
   * @yields {Token} All the tokens found
   * @abstract
   */
  // eslint-disable-next-line require-yield
  *parseTokens(query, idx, depth) {
    throw new Error("Sub-class must override abstract method.");
  }
}

/**
 * A token provider which wraps around another token provider, always returning a blank token in
 * addition to whatever the inner token provider returns.
 *
 * Used for tokens that can possibility be omitted, like numbers. For example, the '+' block always
 * needs three inputs, but the user could query '1 +'. In this case its subtokens are '1', '+' and
 * a {@link TokenTypeBlank}, provided by this provider.
 */
class TokenProviderOptional extends TokenProvider {
  /**
   * @param {TokenProvider} inner
   */
  constructor(inner) {
    super(inner.shouldCache);
    /** @type {TokenProvider} The inner token provider to return along with the blank token. */
    this.inner = inner;
  }

  *parseTokens(query, idx, depth) {
    yield TokenTypeBlank.INSTANCE.createToken(idx);
    yield* this.inner.parseTokens(query, idx, depth);
  }
}

/**
 * Caches the output of an inner token provider.
 * Used for tokens that are a part of multiple token provider groups.
 */
class TokenProviderSingleCache extends TokenProvider {
  /**
   * @param {TokenProvider} inner
   */
  constructor(inner) {
    super(false);
    /** @type {TokenProvider} */
    this.inner = inner;
    if (this.inner.shouldCache) {
      /** @type {Token[]?} */
      this.cache = [];
      /** @type {number?} */
      this.cacheQueryID = null;
    }
  }

  *parseTokens(query, idx, depth) {
    if (!this.inner.shouldCache) {
      yield* this.inner.parseTokens(query, idx, depth);
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
    this.cache[idx] = cacheEntry = [];
    for (const token of this.inner.parseTokens(query, idx, depth)) {
      cacheEntry.push(token);
      yield token;
    }
  }
}

/**
 * Collects multiple inner token providers into one token provider group.
 * Additionally, caches the results of all the cacheable inner token providers.
 */
class TokenProviderGroup extends TokenProvider {
  constructor() {
    // No need to cache this as it already caches it's own output.
    super(false);
    /** @type {TokenProvider[]} The providers that make up this group */
    this.providers = [];
    /** @type {TokenProvider[]} Providers that are a part of the group, but tokens they produce are illegal */
    this.illegalProviders = [];
    /** @type {Object<number, CacheEntry>?} The cache */
    this.cache = null;
    /** @type {number?} The query ID of the query whos results are currently cached */
    this.cacheQueryID = null;
    /** @type {boolean} Are any of our inner tokens cacheable? */
    this.hasCacheable = false;
  }

  /**
   * @typedef CacheEntry
   * @property {Token[][]} tokenCaches
   * @property {TokenProvider[][]} providerCaches
   */

  /**
   * Adds token providers to this token provider group.
   * @param {TokenProvider[]} providers
   * @param {boolean} legal Are the results of this provider legal in the current context?
   */
  pushProviders(providers, legal = true) {
    if (!this.hasCacheable)
      for (const provider of providers) {
        if (provider.shouldCache) {
          this.hasCacheable = true;
          break;
        }
      }
    if (legal) this.providers.push(...providers);
    else this.illegalProviders.push(...providers);
  }

  *parseTokens(query, idx, depth) {
    // If none of our providers are cacheable, just parse all the tokens again
    if (!this.hasCacheable) {
      for (const provider of this.providers) yield* provider.parseTokens(query, idx, depth);
      return;
    }

    // If the query ID has changed, the cache is no longer valid
    if (this.cacheQueryID !== query.id) {
      this.cache = [];
      this.cacheQueryID = query.id;
    } else {
      // Otherwise, search for a cache entry for idx
      const cacheEntry = this.cache[idx];
      if (cacheEntry) {
        // If we find one, yield all the cached results
        const tokenCaches = cacheEntry.tokenCaches;
        const providerCaches = cacheEntry.providerCaches;
        for (let i = 0; i < tokenCaches.length; i++) {
          const tokenCache = tokenCaches[i];
          const providerCache = providerCaches[i];
          for (const provider of providerCache) yield* provider.parseTokens(query, idx, depth);
          yield* tokenCache;
        }
        return;
      }
    }

    // No applicable cache entry was found :(
    // Call all our child token providers and create a new cache entry

    let tokenCache = [];
    let providerCache = [];

    const tokenCaches = [tokenCache];
    const providerCaches = [providerCache];
    this.cache[idx] = { tokenCaches, providerCaches };

    for (const provider of this.providers) {
      if (provider.shouldCache) {
        for (const token of provider.parseTokens(query, idx, depth)) {
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
        yield* provider.parseTokens(query, idx, depth);
      }
    }
    for (const provider of this.illegalProviders) {
      for (let token of provider.parseTokens(query, idx, depth)) {
        token = { ...token, isLegal: false };
        tokenCache.push(token);
        yield token;
      }
    }
  }
}

/**
 * A class representing the type of a token (see {@link Token.type})
 *
 * All token types extend from {@link TokenProvider} and they provide all the tokens
 * of their type they can find.
 *
 * @abstract
 */
class TokenType extends TokenProvider {
  constructor(dontCache = false) {
    super(!dontCache);

    if (this.constructor === TokenType) throw new Error("Abstract classes can't be instantiated.");

    /** @type {boolean} Is this token type always represented by the same string of characters? */
    this.isConstant = false;
  }

  /**
   * Turns `token` into a value which can be passed into the {@link BlockInstance} constructor.
   * For example, in string literal tokens, this gets the string value of the token which can then
   * be used to create a block.
   * @param {Token} token
   * @param {QueryInfo} query
   * @returns {*}
   */
  createBlockValue(token, query) {
    return token.value;
  }

  /**
   * Creates the string form of this token in the same format that was used in the query.
   * If the token was only partially typed in the query, creating the text will complete the token.
   * @param {Token} token
   * @param {QueryInfo} query
   * @param {boolean} endOnly Should we only append to the end of the query. If this is false, we
   * can create text in the middle of the query that wasn't there. This is used to autocomplete
   * {@link StringEnum.GriffTokenType} tokens in the middle of a query.
   * @returns {string}
   */
  createText(token, query, endOnly) {
    throw new Error("Sub-class must override abstract method.");
  }

  /**
   * @param {Token} token
   * @param {QueryInfo} query
   * @returns {Token[]}
   */
  getSubtokens(token, query) {
    return undefined;
  }
}

/**
 * The type for tokens that represent an omitted field.
 * Used by {@link TokenProviderOptional}
 */
class TokenTypeBlank extends TokenType {
  static INSTANCE = new TokenTypeBlank();

  constructor() {
    super();
    this.isConstant = true;
  }

  *parseTokens(query, idx, depth) {
    yield this.createToken(idx);
  }

  /**
   * Create a new blank token
   * @param {number} idx The position of the blank token
   * @returns {Token}
   */
  createToken(idx) {
    return new Token(idx, idx, this, null);
  }

  createText(token, query) {
    return "";
  }
}

/**
 * Represents a token whos value must be one of a predetermined set of strings.
 * For example, a token for a dropdown menu (like the one in `set [my variable] to x`) is a
 * string enum, because the value must be one of a set of strings.
 *
 * String enums are also used for values that can only be one specific value (like the 'set' from
 * `set [my variable] to x`). These cases are just string enums with one possible value.
 */
class TokenTypeStringEnum extends TokenType {
  /**
   * @typedef StringEnumValue
   * @property {string} value The string that needs to be in the query
   * @property {string} lower Cached value.toLowerCase()
   * @property {string[]} parts lower, split up by ignoreable characters.
   */

  /**
   * @param {(import("./BlockTypeInfo").BlockInputEnumOption[]} values
   */
  constructor(values) {
    super();
    this.isConstant = values.length === 1;

    /** @type {StringEnumValue[]} */
    this.values = [];
    for (const value of values) {
      let lower = value.string.toLowerCase();
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
  }

  *parseTokens(query, idx, depth) {
    for (let valueIdx = 0; valueIdx < this.values.length; valueIdx++) {
      const valueInfo = this.values[valueIdx];
      let yieldedToken = false;

      const remainingChar = query.length - idx;
      const substr = query.lowercase.substring(idx);

      // If all we have is a string which could be a number, it doesn't count as a defining feature.
      // This is to get rid of "10" constantly suggesting "10 ^ of ()"
      let isDefiningFeature = !TokenTypeNumberLiteral.isValidNumber(substr);

      if (remainingChar < valueInfo.lower.length) {
        if (valueInfo.lower.startsWith(substr)) {
          const end = remainingChar < 0 ? 0 : query.length;
          yield new Token(idx, end, this, valueInfo, { isTruncated: true, isDefiningFeature });
          yieldedToken = true;
        }
      } else {
        if (query.lowercase.startsWith(valueInfo.lower, idx)) {
          yield new Token(idx, idx + valueInfo.lower.length, this, valueInfo, { isDefiningFeature });
          yieldedToken = true;
        }
      }
    }
  }

  createBlockValue(token, query) {
    return token.value.value;
  }

  createText(token, query, endOnly) {
    if (!token) return this.values[0].lower;
    return token.value.lower;
  }
}

/**
 * The token type for a literal string, like 'Hello World' in the query `say Hello World`
 */
class TokenTypeStringLiteral extends TokenType {
  static TERMINATORS = [undefined, " ", "+", "-", "*", "/", "=", "<", ">", ")"];

  static isTerminator(char) {
    return this.TERMINATORS.includes(char);
  }

  /**
   * Each time we encounter a 'terminator' we have to return the string we've read so far as a
   * possible interpretation. If we didn't, when looking for a string at index 4 of 'say Hello
   * World for 10 seconds' we would just return 'Hello World for 10 seconds', leading to the
   * only result being `say "Hello World for 10 seconds"`. This also means in addition to
   * 'Hello World' we also return 'Hello', 'Hello World for', 'Hello World for 10' and '
   * Hello World for 10 seconds', but that's just the price we pay for trying to enumerate every
   * interpretation.
   */
  *parseTokens(query, idx, depth) {
    // First, look for strings in quotes
    let quoteEnd = -1;
    if (query.str[idx] === '"' || query.str[idx] === "'") {
      const quote = query.str[idx];
      let value = "";
      let valueStart = idx + 1;
      for (let i = idx + 1; i <= query.length; i++) {
        if (query.str[i] === "\\") {
          value += query.str.substring(valueStart, i);
          valueStart = ++i;
        } else if (query.str[i] === quote) {
          yield new Token(idx, i + 1, this, value + query.str.substring(valueStart, i));
          quoteEnd = i + 1;
          break;
        }
      }
    }
    // Then all the other strings
    let wasTerminator = false;
    let wasIgnorable = false;
    for (let i = idx; i <= query.length; i++) {
      const isTerminator = TokenTypeStringLiteral.isTerminator(query.str[i]);
      const isIgnorable = QueryInfo.IGNORABLE_CHARS.includes(query.str[i]);
      if ((wasTerminator !== isTerminator || i == query.length) && !wasIgnorable && i !== idx && i !== quoteEnd) {
        const value = query.str.substring(idx, i);
        yield new Token(idx, i, this, value);
      }
      wasTerminator = isTerminator;
      wasIgnorable = isIgnorable;
    }
  }

  createText(token, query, endOnly) {
    return query.str.substring(token.start, token.end);
  }
}

/**
 * The token type for a literal number, like 69 in the query 'Hello + 69'
 * This token type also supports numbers in formats scratch doesn't let you type,
 * but accepts like '0xFF', 'Infinity' or '1e3'.
 */
class TokenTypeNumberLiteral extends TokenType {
  static isValidNumber(str) {
    return !isNaN(+str) || !isNaN(parseFloat(+str));
  }

  *parseTokens(query, idx, depth) {
    for (let i = idx; i <= query.length; i++) {
      if (TokenTypeStringLiteral.isTerminator(query.str[i]) && i !== idx) {
        const value = query.str.substring(idx, i);
        if (TokenTypeNumberLiteral.isValidNumber(value)) {
          yield new Token(idx, i, this, value);
          break;
        }
      }
    }
  }

  createText(token, query, endOnly) {
    return query.str.substring(token.start, token.end);
  }
}

/**
 * A token type for literal colors, like '#ffffff' for white.
 */
class TokenTypeColor extends TokenType {
  static INSTANCE = new TokenProviderOptional(new TokenTypeColor());
  static HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

  *parseTokens(query, idx, depth) {
    if (!query.str.startsWith("#", idx)) return;
    for (let i = 0; i < 6; i++) {
      if (TokenTypeColor.HEX_CHARS.indexOf(query.lowercase[idx + i + 1]) === -1) return;
    }
    yield new Token(idx, idx + 7, this, query.str.substring(idx, idx + 7));
  }

  createText(token, query, endOnly) {
    return query.query.substring(token.start, token.end);
  }
}

/**
 * A token type for tokens that are in brackets, like (1 + 1) in '(1 + 1) * 2'.
 */
class TokenTypeBrackets extends TokenType {
  /**
   * @param {TokenProvider} tokenProvider
   */
  constructor(tokenProvider) {
    super();
    /** @type {TokenProvider} The tokens to look for between the brackets */
    this.tokenProvider = tokenProvider;
  }

  *parseTokens(query, idx, depth) {
    const start = idx;
    if (query.str[idx++] !== "(") return;
    idx = query.skipIgnorable(idx);
    for (const token of this.tokenProvider.parseTokens(query, idx, depth)) {
      if (token.type instanceof TokenTypeBlank) continue; // Do not allow empty brackets like '()'
      var tokenEnd = query.skipIgnorable(token.end);
      let isTruncated = token.isTruncated;
      if (!isTruncated) {
        if (tokenEnd === query.length) isTruncated = true;
        else if (query.str[tokenEnd] === ")") ++tokenEnd;
        else continue;
      }
      // Note that for bracket tokens, precedence = 0
      const newToken = new Token(start, tokenEnd, this, token.value, {
        precedence: 0,
        isTruncated,
        isLegal: token.isLegal,
      });
      newToken.innerToken = token;
      yield newToken;
    }
  }

  createBlockValue(token, query) {
    return token.innerToken.createBlockValue(token.innerToken, query);
  }

  createText(token, query, endOnly) {
    let text = "(";
    text += query.str.substring(token.start + 1, token.innerToken.start);
    text += token.innerToken.type.createText(token.innerToken, query, endOnly);
    if (token.innerToken.end !== token.end) text += query.str.substring(token.innerToken.end, token.end - 1);
    text += ")";
    return text;
  }

  getSubtokens(token, query) {
    return [token.innerToken];
  }
}

/**
 * The token type for a block, like 'say Hello' or '1 + 1'.
 */
class TokenTypeBlock extends TokenType {
  /**
   * @param {WorkspaceQuerier} querier
   * @param {BlockTypeInfo} block
   * @private
   */
  constructor(querier, block) {
    super();
    this.block = block;
    this.hasSubTokens = true;
    /**
     * The list of token types that make up this block.
     *
     * For example, for the non-griff version of the 'say' block this array would contains two
     * providers, the first is a {@link StringEnum.FullTokenType} containing only the value 'say'
     * and the second is equal to querier.tokenGroupString.
     *
     * @type {TokenProvider[]}
     */
    this.fullTokenProviders = [];

    for (const blockPart of block.parts) {
      let fullTokenProvider;
      if (typeof blockPart === "string") {
        fullTokenProvider = new TokenTypeStringEnum([{ value: null, string: blockPart }]);
      } else {
        switch (blockPart.type) {
          case BlockInputType.ENUM:
            fullTokenProvider = new TokenTypeStringEnum(blockPart.values);
            if (blockPart.isRound) {
              const enumGroup = new TokenProviderGroup();
              enumGroup.pushProviders([fullTokenProvider, querier.tokenGroupRoundBlocks]);
              fullTokenProvider = enumGroup;
            }
            break;
          case BlockInputType.STRING:
            fullTokenProvider = querier.tokenGroupString;
            break;
          case BlockInputType.NUMBER:
            fullTokenProvider = querier.tokenGroupNumber;
            break;
          case BlockInputType.COLOUR:
            fullTokenProvider = TokenTypeColor.INSTANCE;
            break;
          case BlockInputType.BOOLEAN:
            fullTokenProvider = querier.tokenGroupBoolean;
            break;
          case BlockInputType.BLOCK:
            fullTokenProvider = querier.tokenGroupStack;
            break;
        }
      }
      this.fullTokenProviders.push(fullTokenProvider);
    }

    /**
     * @type {{strings: string[], inputs: [], length: number}[]}
     */
    this.stringForms = [];

    const enumerateStringForms = (partIdx = 0, strings = [], inputs = [], length = 0) => {
      for (; partIdx < block.parts.length; partIdx++) {
        let blockPart = block.parts[partIdx];
        if (typeof blockPart === "string") {
          length += blockPart.length;
          strings.push(...blockPart.toLowerCase().split(" "));
        } else if (blockPart.type === BlockInputType.ENUM) {
          for (const enumValue of blockPart.values) {
            enumerateStringForms(
              partIdx + 1,
              [...strings, ...enumValue.string.toLowerCase().split(" ")],
              [...inputs, enumValue],
              length + enumValue.string.length
            );
          }
          return;
        } else {
          inputs.push(null);
        }
      }
      this.stringForms.push({ strings, inputs, length });
    };

    enumerateStringForms();
  }

  /**
   * @param {QueryInfo} query
   * @param {number} idx
   * @param {number} depth
   * @returns
   */
  *parseTokens(query, idx, depth) {
    if (depth !== 0 && !query.canCreateMoreNestedBlocks()) return;

    let yieldedTokens = false;

    for (const subtokens of this._parseSubtokens(query, idx, this.fullTokenProviders)) {
      let token = this._createToken(query, idx, this.fullTokenProviders, subtokens);
      if (token) {
        yield token;
        yieldedTokens = true;
      }
    }

    if (yieldedTokens) return;

    outer: for (const stringForm of this.stringForms) {
      let lastPartIdx = -1;
      let i = idx;
      let hasDefiningFeature = false;

      while (true) {
        i = query.skipIgnorable(i);

        const wordEnd = query.skipUnignorable(i);

        if (wordEnd === i) {
          if (hasDefiningFeature)
            yield new Token(idx, wordEnd, this, { stringForm, lastPartIdx: -1 }, { isProper: false });
          break;
        } else {
          const word = query.lowercase.substring(i, wordEnd);
          let match = -1;

          for (let formPartIdx = lastPartIdx + 1; formPartIdx < stringForm.strings.length; formPartIdx++) {
            const stringFormPart = stringForm.strings[formPartIdx];

            if (stringFormPart.startsWith(word)) {
              match = formPartIdx;
              break;
            }
          }

          if (match === -1) continue outer;
          lastPartIdx = match;

          hasDefiningFeature ||= !TokenTypeNumberLiteral.isValidNumber(word);

          if (query.skipIgnorable(wordEnd) < query.length) {
            if (hasDefiningFeature)
              yield new Token(idx, wordEnd, this, { stringForm, lastPartIdx, i }, { isProper: false });
          }
          i = wordEnd;
        }
      }
    }
  }

  /**
   * @private
   * @param {QueryInfo} query
   * @param {number} idx
   * @param {TokenProvider[]} subtokenProviders
   * @param {Token[]} subtokens
   * @returns {Token?}
   */
  _createToken(query, idx, subtokenProviders, subtokens) {
    subtokens.reverse();
    let isLegal = true;
    let isTruncated = subtokens.length < subtokenProviders.length;
    let hasDefiningFeature = false;

    for (const subtoken of subtokens) {
      isTruncated |= subtoken.isTruncated; // If any of our kids are truncated, so are we
      isLegal &&= subtoken.isLegal; // If any of our kids are illegal, so are we
      if (subtoken.isDefiningFeature && subtoken.start < query.length) hasDefiningFeature = true;
    }

    /** See {@link Token.isDefiningFeature} */
    if (!hasDefiningFeature) return null;

    const end = query.skipIgnorable(subtokens[subtokens.length - 1].end);
    return new Token(idx, end, this, { subtokens }, { precedence: this.block.precedence, isTruncated, isLegal });
  }

  /**
   * Parse all the tokens from this.tokenProviders[tokenProviderIdx] then
   * recursively call this for the next token. Returns a list of tokens for
   * each combination of possible interpretations of the subtokens.
   *
   * Note that the tokens in the returned token arrays are in reverse to the
   * order of their providers in this.tokenProviders, just to confuse you :P
   *
   * @private
   * @param {QueryInfo} query
   * @param {number} idx
   * @param {TokenProvider[]} subtokenProviders
   * @param {number} depth
   * @param {number} tokenProviderIdx
   * @param {boolean} parseNextToken
   * @yields {Token[]}
   */
  *_parseSubtokens(query, idx, subtokenProviders, depth, tokenProviderIdx = 0, parseNextToken = true) {
    idx = query.skipIgnorable(idx);
    let tokenProvider = subtokenProviders[tokenProviderIdx];

    for (const token of tokenProvider.parseTokens(query, idx, depth + 1)) {
      ++query.tokenCount;

      if (!query.canCreateMoreTokens()) break;
      if (depth !== 0 && !query.canCreateMoreNestedBlocks()) break;

      if (this.block.precedence !== -1) {
        if (
          // If we care about the precedence of this block
          // Discard this token if its precedence is higher than ours, meaning it should be calculated
          //  before us not afterward.
          token.precedence > this.block.precedence &&
          // See https://github.com/ScratchAddons/ScratchAddons/issues/5981
          (tokenProviderIdx === 0 || !(token.type instanceof TokenTypeBlock) || token.type.block.id !== "operator_not")
        )
          continue;
        /**
         * This check eliminates thousands of results by making sure blocks with equal precedence
         * can only contain themselves as their own first input. Without this, the query '1 + 2 + 3'
         * would have two interpretations '(1 + 2) + 3' and '1 + (2 + 3)'. This rule makes the second
         * of those invalid because the root '+' block contains itself as its third token.
         */
        if (token.precedence === this.block.precedence) {
          const inputIndex = this.block.parts[tokenProviderIdx].inputIdx;
          if (inputIndex !== 0) continue;
        }
      }

      if (!parseNextToken || !token.isLegal || tokenProviderIdx === subtokenProviders.length - 1) {
        yield [token];
      } else {
        for (const subTokenArr of this._parseSubtokens(
          query,
          token.end,
          subtokenProviders,
          depth,
          tokenProviderIdx + 1,
          !token.isTruncated
        )) {
          subTokenArr.push(token);
          yield subTokenArr;
        }
      }
    }
  }

  createBlockValue(token, query) {
    if (!token.isLegal) throw new Error("Cannot create a block from an illegal token.");
    let blockInputs;

    if (token.value.stringForm) {
      blockInputs = token.value.stringForm.inputs;
    } else {
      const subtokens = token.value.subtokens;
      blockInputs = [];
      for (let i = 0; i < subtokens.length; i++) {
        const blockPart = this.block.parts[i];
        if (typeof blockPart !== "string") blockInputs.push(subtokens[i].createBlockValue(query));
      }
      while (blockInputs.length < this.block.inputs.length) blockInputs.push(null);
    }

    return this.block.createBlock(...blockInputs);
  }

  createText(token, query, endOnly) {
    if (token.value.stringForm) {
      if (endOnly) {
        if (token.value.lastPartIdx === -1 || token.end <= query.length) {
          return query.str.substring(token.start, token.end);
        } else {
          return (
            query.str.substring(token.start, token.end) +
            token.value.stringForm.strings[token.value.lastPartIdx].substring(token.end - token.value.i) +
            " " +
            token.value.stringForm.strings.slice(token.value.lastPartIdx + 1).join(" ")
          );
        }
      }

      return token.value.stringForm.strings.join(" ");
    }
    if (!token.isTruncated && endOnly) return query.str.substring(token.start, token.end);
    const subtokens = token.value.subtokens;
    let text = "";
    if (token.start !== subtokens[0].start) {
      text += query.str.substring(token.start, subtokens[0].start);
    }
    let i;
    for (i = 0; i < subtokens.length; i++) {
      const subtoken = subtokens[i];
      if (!token.isLegal && subtoken.start >= query.length) break;
      const subtokenText = subtoken.type.createText(subtoken, query, endOnly) ?? "";
      text += subtokenText;
      if (i !== subtokens.length - 1) {
        const next = subtokens[i + 1];
        const nextStart = next.start;
        if (nextStart !== subtoken.end) {
          text += query.str.substring(subtoken.end, nextStart);
        } else {
          if (
            (!endOnly || nextStart >= query.length) &&
            subtokenText.length !== 0 &&
            QueryInfo.IGNORABLE_CHARS.indexOf(subtokenText.at(-1)) === -1
          )
            text += " ";
        }
      }
    }
    return text;
  }

  getSubtokens(token, query) {
    return token.value.subtokens;
  }
}

/**
 * A single interpretation of a query.
 */
export class QueryResult {
  constructor(query, token) {
    /**
     * The query that this is a result of.
     * @type {QueryInfo}
     */
    this.query = query;
    /**
     * The root token of this result.
     *
     * The root token is a token which encapsules the entire query.
     * @type {Token}
     */
    this.token = token;
  }

  get isTruncated() {
    return this.token.isTruncated;
  }

  /**
   * @param {boolean} endOnly
   * @returns {string}
   */
  toText(endOnly) {
    return this.token.type.createText(this.token, this.query, endOnly) ?? "";
  }

  /**
   * @returns {BlockInstance}
   */
  getBlock() {
    if (!this.block) this.block = this.token.createBlockValue(this.query);
    return this.block;
  }

  /**
   * @returns {{stringLength: number, tokenLength: number}}
   */
  getLengths() {
    if (this.lengths) return this.lengths;

    let stringLength = 0;
    let tokenLength = 0;

    /** @type {(block: BlockInstance) => void} */
    const getBlockLengths = (block) => {
      let inputIdx = 0;

      for (const part of block.typeInfo.parts) {
        ++tokenLength;

        if (typeof part === "string") {
          stringLength += part.length;
        } else {
          const input = block.inputs[inputIdx++];
          if (input instanceof BlockInstance) {
            getBlockLengths(input);
          } else if (part instanceof BlockInputEnum) {
            stringLength += input.string.length;
          } else if (part instanceof BlockInputString && input !== part.defaultValue) {
            // Make string inputs 100x their real length so they appear at the bottom
            stringLength += ("" + input).length * 100;
          } else if (input != null) {
            stringLength += ("" + input).length;
          }
        }
      }

      // Account for the spaces between inputs
      stringLength += block.typeInfo.parts.length - 1;
    };

    getBlockLengths(this.getBlock());
    return (this.lengths = { stringLength, tokenLength });
  }
}

/**
 * Information on the current query being executed, with some utility
 * functions for helping out token providers.
 */
class QueryInfo {
  /** Characters that can be safely skipped over. */
  static IGNORABLE_CHARS = [" "];

  constructor(querier, query, id) {
    /** @type {WorkspaceQuerier} */
    this.querier = querier;
    /** @type {string} The query */
    this.str = query.replaceAll(String.fromCharCode(160), " ");
    /** @type {string} A lowercase version of the query. Used for case insensitive comparisons. */
    this.lowercase = this.str.toLowerCase();
    /** @type {number} A unique identifier for this query */
    this.id = id;
    /** @type {number} The number of tokens we've found so far */
    this.tokenCount = 0;
    /** @type {number} The number of query results we've found so far */
    this.resultCount = 0;
  }

  /**
   * @param {string} str
   * @param {number} idx The index to start at.
   * @returns {number} The index of the next non-ignorable character in str, after idx.
   */
  static skipIgnorable(str, idx) {
    while (QueryInfo.IGNORABLE_CHARS.indexOf(str[idx]) !== -1) ++idx;
    return idx;
  }

  /**
   * @param {number} idx The index to start at.
   * @returns {number} The index of the next non-ignorable character in the query, after idx.
   */
  skipIgnorable(idx) {
    return QueryInfo.skipIgnorable(this.lowercase, idx);
  }

  /**
   * @param {string} str
   * @param {number} idx The index to start at.
   * @returns {number} The index of the next ignorable character in str, after idx.
   */
  static skipUnignorable(str, idx) {
    while (QueryInfo.IGNORABLE_CHARS.indexOf(str[idx]) === -1 && idx < str.length) ++idx;
    return idx;
  }

  /**
   * @param {number} idx The index to start at.
   * @returns {number} The index of the next ignorable character in the query, after idx.
   */
  skipUnignorable(idx) {
    return QueryInfo.skipUnignorable(this.lowercase, idx);
  }

  /** @type {number} The length in characters of the query. */
  get length() {
    return this.str.length;
  }

  canCreateMoreTokens() {
    return this.tokenCount < WorkspaceQuerier.MAX_TOKENS;
  }

  canCreateMoreNestedBlocks() {
    return this.canCreateMoreTokens() && this.resultCount < WorkspaceQuerier.MAX_RESULTS;
  }
}

/**
 * Workspace queriers keep track of all the data needed to query a given workspace (referred to as
 * the 'workspace index') and provides the methods to execute queries on the indexed workspace.
 */
export default class WorkspaceQuerier {
  static ORDER_OF_OPERATIONS = [
    null, // brackets
    "operator_join",
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

  /**
   * The maximum number of results to find before we give up searching sub-blocks.
   */
  static MAX_RESULTS = 1000;

  /**
   * The maximum number of tokens to find before giving up.
   */
  static MAX_TOKENS = 10000;

  /**
   * Indexes a workspace in preparation for querying it.
   * @param {BlockTypeInfo[]} blocks The list of blocks in the workspace.
   */
  indexWorkspace(blocks) {
    this._queryCounter = 0;
    this._createTokenGroups();
    this._populateTokenGroups(blocks);
    this.workspaceIndexed = true;
  }

  /**
   * Queries the indexed workspace for blocks matching the query string.
   * @param {string} queryStr The query.
   * @returns {{results: QueryResult[], illegalResult: QueryResult | null, limited: boolean}} A list of the results of the query, sorted by their relevance.
   */
  queryWorkspace(queryStr) {
    if (!this.workspaceIndexed) throw new Error("A workspace must be indexed before it can be queried!");
    if (queryStr.trim().length === 0) return { results: [], illegalResult: null, limited: false };

    const query = new QueryInfo(this, queryStr, this._queryCounter++);
    const results = [];
    let foundTokenCount = 0;
    let limited = false;

    let bestIllegalResult = null;
    let bestIllegalResultText = "";

    for (const option of this.tokenGroupBlocks.parseTokens(query, 0, 0)) {
      if (option.end >= queryStr.length) {
        if (option.isLegal) {
          results.push(new QueryResult(query, option));
        } else {
          const text = option.type.createText(option, query, true);
          if (!bestIllegalResult || text.length < text) {
            bestIllegalResult = new QueryResult(query, option);
            bestIllegalResultText = text;
          }
        }
      }
      ++query.resultCount;
      if (!limited && query.resultCount >= WorkspaceQuerier.MAX_RESULTS) {
        console.log("Warning: Workspace query exceeded maximum result count.");
        limited = true;
      }

      if (!query.canCreateMoreTokens()) {
        console.log("Warning: Workspace query exceeded maximum token count.");
        limited = true;
        break;
      }
    }

    // Used to eliminate blocks whos strings can be parsed as something else.
    //  This step removes silly suggestions like `if <(1 + 1) = "2 then"> then`
    const canBeString = Array(queryStr.length).fill(true);

    function searchToken(token) {
      const subtokens = token.type.getSubtokens(token, query);
      if (subtokens) for (const subtoken of subtokens) searchToken(subtoken);
      else if (!(token.type instanceof TokenTypeStringLiteral) && token.isProper && !token.isTruncated)
        for (let i = token.start; i < token.end; i++) {
          canBeString[i] = false;
        }
    }
    for (const result of results) searchToken(result.token);

    function checkValidity(token) {
      const subtokens = token.type.getSubtokens(token, query);
      if (subtokens) {
        for (const subtoken of subtokens) if (!checkValidity(subtoken)) return false;
      } else if (token.type instanceof TokenTypeStringLiteral && !TokenTypeNumberLiteral.isValidNumber(token.value)) {
        for (let i = token.start; i < token.end; i++) if (!canBeString[i]) return false;
      }
      return true;
    }
    let validResults = [];
    for (const result of results) if (checkValidity(result.token)) validResults.push(result);

    validResults = validResults.sort((a, b) => {
      const aLengths = a.getLengths();
      const bLengths = b.getLengths();
      if (aLengths.stringLength != bLengths.stringLength) return aLengths.stringLength - bLengths.stringLength;
      return aLengths.tokenLength - bLengths.tokenLength;
    });

    return {
      results: validResults,
      illegalResult: validResults.length === 0 ? bestIllegalResult : null,
      limited,
    };
  }

  /**
   * Creates the token group hierarchy used by this querier.
   *
   * Each of these token groups represents a list of all the tokens that could be encountered
   * when we're looking for a specific type of input. For example, tokenGroupString contains all
   * the tokens that could be encountered when we're looking for a string input (like after the
   * word 'say' for the `say ()` block). tokenGroupBlocks is an interesting one, it contains all
   * the tokens that could be the root token of a query result. In practice, this just means all
   * the stackable blocks (like 'say') and all the reporter blocks (like '+').
   *
   * But wait, there's a problem. Blocks like `() + ()` have two inputs, both of which are numbers.
   * The issue arises when you realize the block '+' itself also returns a number. So when we
   * try to call parseTokens on the '+' block, it will try to look for it's first parameter thus
   * calling parseTokens on tokenGroupNumber, which will call parseTokens on the '+' block again
   * (because + can return a number) which will call tokenGroupNumber again... and we're in an
   * infinite loop. We can't just exclude blocks from being their own first parameter because then
   * queries like '1 + 2 + 3' wouldn't work. The solution is something you might have only thought
   * of as a performance boost; caching. When tokenGroupNumber gets queried for the second time,
   * it's mid way though building its cache from the first query. If this happens, it just returns
   * all the tokens it had already found, but no more. So in the example above, when the + block calls
   * tokenGroupNumber for the second time it finds only the number literal '1'. It then finds the
   * second number literal '2' and yields the block '1 + 2' which gets added to tokenGroupNumber's
   * cache. '1 + 2' then gets disguarded by the queryWorkspace function because it doesn't cover the
   * whole query. But the '+' block's query to tokenGroupNumber never finished, so it will continue
   * and, because the first one we found is now a part of the cache, tokenGroupNumber will yield
   * '1 + 2' as a result. The + block will continue parsing, find the second '+' and the number '3'
   * and yield '(1 + 2) + 3'. No infinite loops!
   *
   * A consequence of this system is something I implicitly implied in the above paragraph "when the
   * + block calls tokenGroupNumber for the second time it finds only the number literal '1'" This
   * is only true if 'TokenTypeNumberLiteral' is searched before the '+' block. This is why the order
   * the token providers are in is critically important. I'll leave it as an exercise to the reader to
   * work out why, but the same parsing order problems crops up when implementing order of operations.
   * If a suggestion that should show up isn't showing up, it's probably because the token providers
   * in one of the groups is in the wrong order. Ordering the providers within the base groups is dealt
   * with by {@link _populateTokenGroups} and the inter-group ordering is dealt with below, by the
   * order they are passed into pushProviders.
   *
   * @private
   */
  _createTokenGroups() {
    this.tokenTypeStringLiteral = new TokenProviderSingleCache(new TokenTypeStringLiteral());
    this.tokenTypeNumberLiteral = new TokenProviderSingleCache(new TokenTypeNumberLiteral());

    this.tokenGroupRoundBlocks = new TokenProviderGroup(); // Round blocks like (() + ()) or (my variable)
    this.tokenGroupBooleanBlocks = new TokenProviderGroup(); // Boolean blocks like <not ()>
    this.tokenGroupStackBlocks = new TokenProviderGroup(); // Stackable blocks like `move (10) steps`
    this.tokenGroupHatBlocks = new TokenProviderGroup(); // Hat block like `when green flag clicked`

    // Anything that fits into a boolean hole. (Boolean blocks + Brackets)
    this.tokenGroupBoolean = new TokenProviderOptional(new TokenProviderGroup());
    this.tokenGroupBoolean.inner.pushProviders([
      this.tokenGroupBooleanBlocks,
      new TokenTypeBrackets(this.tokenGroupBoolean),
    ]);
    this.tokenGroupBoolean.inner.pushProviders([this.tokenGroupRoundBlocks], false);

    // Anything that fits into a number hole. (Round blocks + Boolean blocks + Number Literals + Brackets)
    this.tokenGroupNumber = new TokenProviderOptional(new TokenProviderGroup());
    this.tokenGroupNumber.inner.pushProviders([
      this.tokenTypeNumberLiteral,
      this.tokenGroupRoundBlocks,
      this.tokenGroupBooleanBlocks,
      new TokenTypeBrackets(this.tokenGroupNumber),
    ]);

    // Anything that fits into a string hole (Round blocks + Boolean blocks + String Literals + Brackets)
    this.tokenGroupString = new TokenProviderOptional(new TokenProviderGroup());
    this.tokenGroupString.inner.pushProviders([
      this.tokenTypeStringLiteral,
      this.tokenGroupRoundBlocks,
      this.tokenGroupBooleanBlocks,
      new TokenTypeBrackets(this.tokenGroupString),
    ]);

    // Anything that fits into a c shaped hole (Stackable blocks)
    this.tokenGroupStack = new TokenProviderOptional(this.tokenGroupStackBlocks);

    // Anything you can spawn using the menu (All blocks)
    this.tokenGroupBlocks = new TokenProviderGroup();
    this.tokenGroupBlocks.pushProviders([
      this.tokenGroupStackBlocks,
      this.tokenGroupBooleanBlocks,
      this.tokenGroupRoundBlocks,
      this.tokenGroupHatBlocks,
    ]);
  }

  /**
   * Populates the token groups created by {@link _createTokenGroups} with the blocks
   * found in the workspace.
   * @param {BlockTypeInfo[]} blocks The list of blocks in the workspace.
   * @private
   */
  _populateTokenGroups(blocks) {
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
      const blockTokenType = new TokenTypeBlock(this, block);
      switch (block.shape) {
        case BlockShape.Round:
          this.tokenGroupRoundBlocks.pushProviders([blockTokenType]);
          break;
        case BlockShape.Boolean:
          this.tokenGroupBooleanBlocks.pushProviders([blockTokenType]);
          break;
        case BlockShape.Stack:
        case BlockShape.End:
          this.tokenGroupStackBlocks.pushProviders([blockTokenType]);
          break;
        case BlockShape.Hat:
          this.tokenGroupHatBlocks.pushProviders([blockTokenType]);
          break;
      }
    }
  }

  /**
   * Clears the memory used by the workspace index.
   */
  clearWorkspaceIndex() {
    this.workspaceIndexed = false;
    this._destroyTokenGroups();
  }

  /**
   * @private
   */
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
}
