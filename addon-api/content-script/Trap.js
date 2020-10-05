export default class Trap extends EventTarget {
  constructor() {
    super();
  }
  /**
   * @type {object.<string, *>} mapping for the Once objects trapped.
   */
  get onceValues() {
    return __scratchAddonsTraps._onceMap;
  }
  /**
   * @type {symbol} Symbol for accessing props of trapped objects.
   */
  get numOnce() {
    return __scratchAddonsTraps._trapNumOnce;
  }
  /**
   * @type {symbol} Symbol for accessing props of trapped objects.
   */
  get numMany() {
    return __scratchAddonsTraps._trapNumMany;
  }

  /**
   * Adds listener for Once objects trapped.
   * @param {string} trapName Trap name to listen to. Can be '*' for any.
   * @param {function} fn callback passed to addEventListener.
   */
  addOnceListener(trapName, fn) {
    const eventName = trapName === "*" ? "trapready" : `ready.${trapName}`;
    if (!__scratchAddonsTraps._targetOnce) throw new Error("Event target not initialized");
    __scratchAddonsTraps._targetOnce.addEventListener(eventName, fn);
  }

  /**
   * Removes listener for Once objects trapped.
   * @param {string} trapName Trap name to listen to. Can be '*' for any.
   * @param {function} fn callback passed to removeEventListener.
   */
  removeOnceListener(trapName, fn) {
    const eventName = trapName === "*" ? "trapready" : `ready.${trapName}`;
    if (!__scratchAddonsTraps._targetOnce) throw new Error("Event target not initialized");
    __scratchAddonsTraps._targetOnce.removeEventListener(eventName, fn);
  }

  /**
   * Adds listener for Many objects trapped.
   * @param {string} trapName Trap name to listen to. Can be '*' for any.
   * @param {function} fn callback passed to addEventListener.
   */
  addManyListener(trapName, fn) {
    const eventName = trapName === "*" ? "trapready" : `ready.${trapName}`;
    if (!__scratchAddonsTraps._targetMany) throw new Error("Event target not initialized");
    __scratchAddonsTraps._targetMany.addEventListener(eventName, fn);
  }

  /**
   * Removes listener for Many objects trapped.
   * @param {string} trapName Trap name to listen to. Can be '*' for any.
   * @param {function} fn callback passed to removeEventListener.
   */
  removeManyListener(trapName, fn) {
    const eventName = trapName === "*" ? "trapready" : `ready.${trapName}`;
    if (!__scratchAddonsTraps._targetMany) throw new Error("Event target not initialized");
    __scratchAddonsTraps._targetMany.removeEventListener(eventName, fn);
  }

  /**
   * Adds listener for prototype functions trapped.
   * @param {string} trapName Trap name to listen to. Can be '*' for any.
   * @param {function} fn callback passed to addEventListener.
   */
  addPrototypeListener(trapName, fn) {
    const eventName = trapName === "*" ? "prototypecalled" : `prototype.${trapName}`;
    __scratchAddonsTraps.addEventListener(eventName, fn);
  }

  /**
   * Removes listener for prototype functions trapped.
   * @param {string} trapName Trap name to listen to. Can be '*' for any.
   * @param {function} fn callback passed to removeEventListener.
   */
  removePrototypeListener(trapName, fn) {
    const eventName = trapName === "*" ? "prototypecalled" : `prototype.${trapName}`;
    __scratchAddonsTraps.removeEventListener(eventName, fn);
  }
}
