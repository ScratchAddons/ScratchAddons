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
    // Events (responsible for undoStack updates) are delayed with a setTimeout inside requestAnimationFrame
    // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/events/utils.ts#L112-L114
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
 * https://github.com/RaspberryPiFoundation/blockly/blob/d28e057/packages/blockly/core/utils/idgenerator.ts#L33-L41
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
