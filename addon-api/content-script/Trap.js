import Listenable from "../common/Listenable.js";

/**
 * Manages object trapping.
 * @extends Listenable
 */
export default class Trap extends Listenable {
  constructor(tab) {
    super();
    this._react_internal_key = undefined;
    this._isWWW = () => tab.clientVersion === "scratch-www";
    this._getEditorMode = () => this._isWWW() && tab.editorMode;
    this._waitForElement = tab.waitForElement.bind(tab);
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

  _getBlocksComponent(wrapper) {
    if (!this._react_internal_key) {
      this._react_internal_key = Object.keys(wrapper).find((key) => key.startsWith(this.REACT_INTERNAL_PREFIX));
    }
    const internal = wrapper[this._react_internal_key];
    let childable = internal;
    /* eslint-disable no-empty */
    while (((childable = childable.child), !childable || !childable.stateNode || !childable.stateNode.ScratchBlocks)) {}
    /* eslint-enable no-empty */
    return childable;
  }

  _getBlocksWrapperComponentSync() {
    const editorMode = this._getEditorMode();
    if (!editorMode || editorMode === "embed")
      throw new Error(`Cannot access Blockly on ${editorMode} page (${location.pathname})`);
    const BLOCKS_CLASS = '[class^="gui_blocks-wrapper"]';
    let elem = document.querySelector(BLOCKS_CLASS);
    if (!elem) {
      throw new Error("Could not find workspace element, is the page in editor mode?");
    }
    return this._getBlocksComponent(elem);
  }

  async _getBlocksWrapperComponent() {
    const editorMode = this._getEditorMode();
    if (!editorMode || editorMode === "embed")
      throw new Error(`Cannot access Blockly on ${editorMode} page (${location.pathname})`);
    const BLOCKS_CLASS = '[class^="gui_blocks-wrapper"]';
    let elem = document.querySelector(BLOCKS_CLASS);
    if (!elem) {
      elem = await this._waitForElement(BLOCKS_CLASS, {
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      });
    }
    return this._getBlocksComponent(elem);
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
    const childable = await this._getBlocksWrapperComponent();
    return (this._cache.Blockly = childable.stateNode.ScratchBlocks);
  }

  /**
   * Gets the Blockly workspace synchronously.
   * This must be called while the workspace is visible (i.e. in editor).
   * Unlike Blockly#getMainWorkspace, this always returns the editor workspace
   * (and not the custom block prompt workspace).
   * The result is not cached and should be queried every time workspace access is needed.
   * @returns {object}
   */
  getWorkspace() {
    try {
      return this._getBlocksWrapperComponentSync().stateNode.workspace;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /**
   * Gets react internal key.
   * @param {HTMLElement} elem - the reference
   * @returns {string} the key
   */
  getInternalKey(elem) {
    if (!this._react_internal_key) {
      this._react_internal_key = Object.keys(elem).find((key) => key.startsWith(this.REACT_INTERNAL_PREFIX));
    }
    return this._react_internal_key;
  }

  /**
   * Gets @scratch/paper instance.
   * @async
   * @throws when on non-project page or if paper couldn't be found.
   * @returns {Promise<object>}
   */
  async getPaper() {
    if (this._cache.paper) return this._cache.paper;
    const editorMode = this._getEditorMode();
    if (!editorMode || editorMode === "embed") throw new Error("Cannot access paper on this page");
    // We can access paper through .tool on tools, for example:
    // https://github.com/scratchfoundation/scratch-paint/blob/develop/src/containers/bit-brush-mode.jsx#L60-L62
    // It happens that paper's Tool objects contain a reference to the entirety of paper's scope.
    const modeSelector = await this._waitForElement("[class*='paint-editor_mode-selector']", {
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    const internalState = modeSelector[this.getInternalKey(modeSelector)].child;
    // .tool or .blob.tool only exists on the selected tool
    let toolState = internalState;
    let tool;
    while (toolState) {
      const toolInstance = toolState.child.stateNode;
      if (toolInstance.tool) {
        tool = toolInstance.tool;
        break;
      }
      if (toolInstance.blob && toolInstance.blob.tool) {
        tool = toolInstance.blob.tool;
        break;
      }
      toolState = toolState.sibling;
    }
    if (tool) {
      const paperScope = tool._scope;
      this._cache.paper = paperScope;
      return paperScope;
    }
    throw new Error("cannot find paper :(");
  }
}
