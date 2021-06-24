import Listenable from "../common/Listenable.js";

/** Manages object trapping. */
export default class Trap extends Listenable {
  /** @param {import("./Tab").default} tab */
  constructor(tab) {
    super();
    /** @private */
    this._react_internal_key = undefined;
    /** @private */
    this._isWWW = tab.clientVersion === "scratch-www";
    /** @private */
    this._getEditorMode = () => this._isWWW && tab.editorMode;
    /** @private */
    this._waitForElement = (/** @type {any} */ q) => tab.waitForElement(q, { markAsSeen: true });
    /** @private */

    this._cache = Object.create(null);
  }

  /**
   * Scratch-vm instance.
   *
   * @throws When on non-project page.
   */
  get vm() {
    if (!this._getEditorMode()) throw new Error("Cannot access vm on non-project page");
    return __scratchAddonsTraps._onceMap.vm;
  }

  /** @private */
  get REACT_INTERNAL_PREFIX() {
    return "__reactInternalInstance$";
  }

  /**
   * Gets Blockly instance actually used by Scratch. This is different from window.Blockly.
   *
   * @throws When on non-project page.
   */
  async getBlockly() {
    if (this._cache.Blockly) return this._cache.Blockly;
    const editorMode = this._getEditorMode();
    if (!editorMode || editorMode === "embed") throw new Error("Cannot access Blockly on this page");
    const BLOCKS_CLASS = '[class^="gui_blocks-wrapper"]';
    let elem = document.querySelector(BLOCKS_CLASS);
    if (!elem) {
      elem = await this._waitForElement(BLOCKS_CLASS)??null;
    }
    if (!this._react_internal_key) {
      this._react_internal_key = Object.keys(elem).find((key) => key.startsWith(this.REACT_INTERNAL_PREFIX));
    }
    let childable = elem?.[`${this._react_internal_key}`];
    /* eslint-disable no-empty */
    while (((childable = childable.child), !childable || !childable.stateNode || !childable.stateNode.ScratchBlocks)) {}
    /* eslint-enable no-empty */
    return (this._cache.Blockly = childable.stateNode.ScratchBlocks);
  }
}
