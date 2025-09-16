/**
 * This class is dedicated to maintaining the Undo stack of Blockly
 * It allows us to initiate an undo group such that all subsequent operations are recorded as a single
 * undoable transaction.
 */
export default class UndoGroup {
  /**
   * Start an Undo group - begin recording
   * @param workspace the workspace
   * @param {boolean} [includeLast=false] whether to include the event immediately preceding the start
   */
  static startUndoGroup(workspace, includeLast = false) {
    const undoStack = workspace.undoStack_;
    if (undoStack.length) {
      undoStack[undoStack.length - 1]._devtoolsLastUndo = true;
    }

    workspace._undoGroupIncludeLast = includeLast;
  }

  /**
   * End an Undo group - stops recording
   * @param workspace the workspace
   */
  static endUndoGroup(workspace) {
    const undoStack = workspace.undoStack_;
    const includeLast = workspace._undoGroupIncludeLast;
    delete workspace._undoGroupIncludeLast;
    // Events (responsible for undoStack updates) are delayed with a setTimeout(f, 0)
    // https://github.com/scratchfoundation/scratch-blocks/blob/f159a1779e5391b502d374fb2fdd0cb5ca43d6a2/core/events.js#L182
    // New Blockly uses a setTimeout inside requestAnimationFrame
    // https://github.com/google/blockly/blob/fa4fce5/core/events/utils.ts#L113-L115
    requestAnimationFrame(() => {
      setTimeout(() => {
        const group = generateUID();
        let i = undoStack.length - 1;
        for (; i >= 0 && !undoStack[i]._devtoolsLastUndo; i--) {
          undoStack[i].group = group;
        }
        if (includeLast && i >= 0) undoStack[i].group = group;
      }, 0);
    });
  }
}

/**
 * https://github.com/scratchfoundation/scratch-blocks/blob/2e3a31e/core/utils.js#L610-L623
 * @returns {string}
 * @private
 */
function generateUID() {
  const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%()*+,-./:;=?@[]^_`{|}~";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }
  return result;
}
