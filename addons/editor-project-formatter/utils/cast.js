/**
 * @fileoverview
 * Utilities for casting and comparing Scratch data-types.
 * Scratch behaves slightly differently from JavaScript in many respects,
 * and these differences should be encapsulated below.
 * For example, in Scratch, add(1, join("hello", world")) -> 1.
 * This is because "hello world" is cast to 0.
 * In JavaScript, 1 + Number("hello" + "world") would give you NaN.
 * Use when coercing a value before computation.
 *
 * Based of {@link https://github.com/TurboWarp/scratch-vm/blob/develop/src/util/cast.js}
 */

/**
 * Used internally by compare()
 * @param {*} val A value that evaluates to 0 in JS string-to-number conversation such as empty string, 0, or tab.
 * @returns {boolean} True if the value should not be treated as the number zero.
 */
const isNotActuallyZero = (val) => {
  if (typeof val !== "string") return false;
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    // '0'.charCodeAt(0) === 48
    // '\t'.charCodeAt(0) === 9
    // We include tab for compatibility with scratch-www's broken trim() polyfill.
    // https://github.com/TurboWarp/scratch-vm/issues/115
    // https://scratch.mit.edu/projects/788261699/
    if (code === 48 || code === 9) {
      return false;
    }
  }
  return true;
};

export default class Cast {
  /**
   * Scratch cast to number.
   * Treats NaN as 0.
   * In Scratch 2.0, this is captured by `interp.numArg.`
   * @param {*} value Value to cast to number.
   * @return {number} The Scratch-casted number value.
   */
  static toNumber(value) {
    // If value is already a number we don't need to coerce it with
    // Number().
    if (typeof value === "number") {
      // Scratch treats NaN as 0, when needed as a number.
      // E.g., 0 + NaN -> 0.
      if (Number.isNaN(value)) {
        return 0;
      }
      return value;
    }
    const n = Number(value);
    if (Number.isNaN(n)) {
      // Scratch treats NaN as 0, when needed as a number.
      // E.g., 0 + NaN -> 0.
      return 0;
    }
    return n;
  }

  /**
   * Scratch cast to boolean.
   * In Scratch 2.0, this is captured by `interp.boolArg.`
   * Treats some string values differently from JavaScript.
   * @param {*} value Value to cast to boolean.
   * @return {boolean} The Scratch-casted boolean value.
   */
  static toBoolean(value) {
    // Already a boolean?
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      // These specific strings are treated as false in Scratch.
      if (value === "" || value === "0" || value.toLowerCase() === "false") {
        return false;
      }
      // All other strings treated as true.
      return true;
    }
    // Coerce other values and numbers.
    return Boolean(value);
  }

  /**
   * Scratch cast to string.
   * @param {*} value Value to cast to string.
   * @return {string} The Scratch-casted string value.
   */
  static toString(value) {
    return String(value);
  }

  /**
   * Determine if a Scratch argument is a white space string (or null / empty).
   * @param {*} val value to check.
   * @return {boolean} True if the argument is all white spaces or null / empty.
   */
  static isWhiteSpace(val) {
    return val === null || (typeof val === "string" && val.trim().length === 0);
  }

  /**
   * Compare two values, using Scratch cast, case-insensitive string compare, etc.
   * In Scratch 2.0, this is captured by `interp.compare.`
   * @param {*} v1 First value to compare.
   * @param {*} v2 Second value to compare.
   * @returns {number} Negative number if v1 < v2; 0 if equal; positive otherwise.
   */
  static compare(v1, v2) {
    let n1 = Number(v1);
    let n2 = Number(v2);
    if (n1 === 0 && isNotActuallyZero(v1)) {
      n1 = NaN;
    } else if (n2 === 0 && isNotActuallyZero(v2)) {
      n2 = NaN;
    }
    if (isNaN(n1) || isNaN(n2)) {
      // At least one argument can't be converted to a number.
      // Scratch compares strings as case insensitive.
      const s1 = String(v1).toLowerCase();
      const s2 = String(v2).toLowerCase();
      if (s1 < s2) {
        return -1;
      } else if (s1 > s2) {
        return 1;
      }
      return 0;
    }
    // Handle the special case of Infinity
    if ((n1 === Infinity && n2 === Infinity) || (n1 === -Infinity && n2 === -Infinity)) {
      return 0;
    }
    // Compare as numbers.
    return n1 - n2;
  }

  /**
   * Determine if a Scratch argument number represents a round integer.
   * @param {*} val Value to check.
   * @return {boolean} True if number looks like an integer.
   */
  static isInt(val) {
    // Values that are already numbers.
    if (typeof val === "number") {
      if (isNaN(val)) {
        // NaN is considered an integer.
        return true;
      }
      // True if it's "round" (e.g., 2.0 and 2).
      return val === Math.floor(val);
    } else if (typeof val === "boolean") {
      // `True` and `false` always represent integer after Scratch cast.
      return true;
    } else if (typeof val === "string") {
      // If it contains a decimal point, don't consider it an int.
      return val.indexOf(".") < 0;
    }
    return false;
  }

  static get LIST_INVALID() {
    return "INVALID";
  }

  static get LIST_ALL() {
    return "ALL";
  }

  /**
   * Compute a 1-based index into a list, based on a Scratch argument.
   * Two special cases may be returned:
   * LIST_ALL: if the block is referring to all of the items in the list.
   * LIST_INVALID: if the index was invalid in any way.
   * @param {*} index Scratch arg, including 1-based numbers or special cases.
   * @param {number} length Length of the list.
   * @param {boolean} acceptAll Whether it should accept "all" or not.
   * @return {(number|string)} 1-based index for list, LIST_ALL, or LIST_INVALID.
   */
  static toListIndex(index, length, acceptAll) {
    if (typeof index !== "number") {
      if (index === "all") {
        return acceptAll ? Cast.LIST_ALL : Cast.LIST_INVALID;
      }
      if (index === "last") {
        if (length > 0) {
          return length;
        }
        return Cast.LIST_INVALID;
      } else if (index === "random" || index === "any") {
        if (length > 0) {
          return 1 + Math.floor(Math.random() * length);
        }
        return Cast.LIST_INVALID;
      }
    }
    index = Math.floor(Cast.toNumber(index));
    if (index < 1 || index > length) {
      return Cast.LIST_INVALID;
    }
    return index;
  }
}
