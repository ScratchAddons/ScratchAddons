import Listenable from "../common/Listenable.js";

/**
 * Manages object trapping.
 * @extends Listenable
 */
export default class Trap extends Listenable {
  constructor(tab) {
    super();
    this._react_internal_key = undefined;
    this._isWWW = tab.clientVersion === "scratch-www";
    this._getEditorMode = () => this._isWWW && tab.editorMode;
    this._waitForElement = (q) => tab.waitForElement(q, { markAsSeen: true });

    this._cache = Object.create(null);
  }

  /**
   * scratch-vm instance.
   * @throws when on non-project page.
   * @type {object}
   */
  get vm() {
    if (!this._getEditorMode()) throw new Error("Cannot access vm on non-project page");
    return __scratchAddonsTraps._onceMap.vm;
  }

  /**
   * @private
   */
  get REACT_INTERNAL_PREFIX() {
    return "__reactInternalInstance$";
  }

  /**
   * Gets Blockly instance actually used by Scratch.
   * This is different from window.Blockly.
   * @async
   * @throws when on non-project page.
   * @returns {Promise<object>}
   */
  async getBlockly() {
    if (this._cache.Blockly) return this._cache.Blockly;
    const editorMode = this._getEditorMode();
    if (!editorMode || editorMode === "embed") throw new Error("Cannot access Blockly on this page");
    const BLOCKS_CLASS = '[class^="gui_blocks-wrapper"]';
    let elem = document.querySelector(BLOCKS_CLASS);
    if (!elem) {
      elem = await this._waitForElement(BLOCKS_CLASS);
    }
    if (!this._react_internal_key) {
      this._react_internal_key = Object.keys(elem).find((key) => key.startsWith(this.REACT_INTERNAL_PREFIX));
    }
    const internal = elem[this._react_internal_key];
    let childable = internal;
    /* eslint-disable no-empty */
    while (((childable = childable.child), !childable || !childable.stateNode || !childable.stateNode.ScratchBlocks)) {}
    /* eslint-enable no-empty */
    return (this._cache.Blockly = childable.stateNode.ScratchBlocks);
  }
}
