import BlockInstance from "./BlockInstance.js";

// A file to split Editor Devtools by features.

export default class Utils {
  constructor(addon) {
    this.addon = addon;
    this.vm = this.addon.tab.traps.onceValues.vm;
    this._myFlash = { block: null, timerID: null, colour: null };
    this.offsetX = 32;
    this.offsetY = 32;
    this.navigationHistory = new NavigationHistory(this);
    /**
     * The workspace
     */
    this._workspace = null;
  }

  /**
   * Get the Scratch Editing Target
   * @returns {*} the scratch editing target
   */
  getEditingTarget() {
    return this.vm.runtime.getEditingTarget();
  }

  setEditingTarget(targetID) {
    if (this.getEditingTarget().id !== targetID) {
      this.vm.setEditingTarget(targetID);
    }
  }

  /**
   * https://github.com/LLK/scratch-blocks/blob/f159a1779e5391b502d374fb2fdd0cb5ca43d6a2/core/events.js#L182
   * @returns {string}
   * @private
   */
  _generateUID() {
    const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%()*+,-./:;=?@[]^_`{|}~";
    let result = "";
    for (let i = 0; i < 20; i++) {
      result += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    }
    return result;
  }

  /**
   * Start an Undo group - begin recording
   * @param wksp the workspace
   */
  startUndoGroup(wksp) {
    const undoStack = wksp.undoStack_;
    if (undoStack.length) {
      undoStack[undoStack.length - 1]._devtoolsLastUndo = true;
    }
  }

  /**
   * End an Undo group - stops recording
   * @param wksp the workspace
   */
  endUndoGroup(wksp) {
    const undoStack = wksp.undoStack_;
    // Events (responsible for undoStack updates) are delayed with a setTimeout(f, 0)
    // https://github.com/LLK/scratch-blocks/blob/f159a1779e5391b502d374fb2fdd0cb5ca43d6a2/core/events.js#L182
    setTimeout(() => {
      const group = this._generateUID();
      for (let i = undoStack.length - 1; i >= 0 && !undoStack[i]._devtoolsLastUndo; i--) {
        undoStack[i].group = group;
      }
    }, 0);
  }

  /**
   * FLash a block 3 times
   * @param block the block to flash
   */
  doFlash(block) {
    const myFlash = this._myFlash;

    if (myFlash.timerID > 0) {
      clearTimeout(myFlash.timerID);
      myFlash.block.setColour(myFlash.colour);
    }

    let count = 4;
    let flashOn = true;
    myFlash.colour = block.getColour();
    myFlash.block = block;

    function flash() {
      myFlash.block.setColour(flashOn ? "#ffff80" : myFlash.colour);
      flashOn = !flashOn;
      count--;
      if (count > 0) {
        myFlash.timerID = setTimeout(flash, 200);
      } else {
        myFlash.timerID = 0;
      }
    }

    flash();
  }

  /**
   *
   * @returns Blockly.Workspace
   */
  getWorkspace() {
    const currentWorkspace = Blockly.getMainWorkspace();
    if (currentWorkspace.getToolbox()) {
      // Sadly get get workspace does not always return the 'real' workspace... Not sure how to get that at the moment,
      //  but we can work out whether it's the right one by whether it hsa a toolbox.
      this._workspace = currentWorkspace;
    }
    return this._workspace;
  }

  /**
   * Based on wksp.centerOnBlock(li.data.labelID);
   * @param e
   * @param force if true, the view always moves, otherwise only move if the selected element is not entirely visible
   */
  centerTop(e, force) {
    // todo - do I need to change sprite?

    if (e instanceof BlockInstance) {
      // Switch to sprite
      this.setEditingTarget(e.targetId);

      // Highlight the block!
      e = e.id;

      // return;
    }

    let workspace = this.getWorkspace();
    if ((e = e && e.id ? e : workspace.getBlockById(e))) {
      let root = e.getRootBlock();
      let base = this.getTopOfStackFor(e);

      let ePos = base.getRelativeToSurfaceXY(), // Align with the top of the block
        rPos = root.getRelativeToSurfaceXY(), // Align with the left of the block 'stack'
        eSiz = e.getHeightWidth(),
        scale = workspace.scale,
        // x = (ePos.x + (workspace.RTL ? -1 : 1) * eSiz.width / 2) * scale,
        x = rPos.x * scale,
        y = ePos.y * scale,
        xx = e.width + x, // Turns out they have their x & y stored locally, and they are the actual size rather than scaled or including children...
        yy = e.height + y,
        // xx = eSiz.width * scale + x,
        // yy = eSiz.height * scale + y,

        s = workspace.getMetrics();

      // On screen?

      // ratio = workspace.scrollbar.hScroll.ratio_;
      // w.scrollbar.hScroll.scrollViewSize_

      if (
        x < s.viewLeft + this.offsetX - 4 ||
        xx > s.viewLeft + s.viewWidth ||
        y < s.viewTop + this.offsetY - 4 ||
        yy > s.viewTop + s.viewHeight
      ) {
        // sx = s.contentLeft + s.viewWidth / 2 - x,
        let sx = x - s.contentLeft - this.offsetX,
          // sy = s.contentTop - y + Math.max(Math.min(32, 32 * scale), (s.viewHeight - yh) / 2);
          sy = y - s.contentTop - this.offsetY;

        this.navigationHistory.storeView(this.navigationHistory.peek(), 64);

        // workspace.hideChaff(),
        workspace.scrollbar.set(sx, sy);
        this.navigationHistory.storeView({ left: sx, top: sy }, 64);
      }

      this.doFlash(e);
    }
  }

  /**
   * Find the top stack block of a stack
   * @param block a block in a stack
   * @returns {*} a block that is the top of the stack of blocks
   */
  getTopOfStackFor(block) {
    let base = block;
    while (base.getOutputShape() && base.getSurroundParent()) {
      base = base.getSurroundParent();
    }
    return base;
  }
}

class NavigationHistory {
  constructor(utils) {
    this.utils = utils;
    this.views = [];
    this.forward = [];
  }

  /**
   * Keep a record of the scroll and zoom position
   */
  storeView(next, dist) {
    this.forward = [];
    let workspace = this.utils.getWorkspace(),
      s = workspace.getMetrics();

    let pos = { left: s.viewLeft, top: s.viewTop };
    if (!next || distance(pos, next) > dist) {
      this.views.push(pos);
    }
  }

  peek() {
    return this.views.length > 0 ? this.views[this.views.length - 1] : null;
  }

  goBack() {
    const workspace = this.utils.getWorkspace(),
      s = workspace.getMetrics();

    let pos = { left: s.viewLeft, top: s.viewTop };
    let view = this.peek();
    if (!view) {
      return;
    }
    if (distance(pos, view) < 64) {
      // Go back to current if we are already far away from it
      if (this.views.length > 1) {
        this.views.pop();
        this.forward.push(view);
      }
    }

    view = this.peek();
    if (!view) {
      return;
    }

    let sx = view.left - s.contentLeft,
      sy = view.top - s.contentTop;

    // transform.setTranslate(-600,0);

    workspace.scrollbar.set(sx, sy);

    /*
              let blocklySvg = document.getElementsByClassName('blocklySvg')[0];
              let blocklyBlockCanvas = blocklySvg.getElementsByClassName('blocklyBlockCanvas')[0];
              let transform = blocklyBlockCanvas.transform.baseVal.getItem(0);
              let scale = blocklyBlockCanvas.transform.baseVal.getItem(1);

              let transformMatrix = transform.matrix;
              let scaleMatrix = scale.matrix;

              console.log('Transform - getMetrics', s);
              console.log('sx, sy: ', sx, sy);
              console.log('left, top: ', view.left, view.top);
              console.log('contentLeft, right:', s.contentLeft, s.contentTop);
              console.log('transform, scale matrix: ', transformMatrix, scaleMatrix);
  */
  }

  goForward() {
    let view = this.forward.pop();
    if (!view) {
      return;
    }
    this.views.push(view);

    let workspace = this.utils.getWorkspace(),
      s = workspace.getMetrics();

    let sx = view.left - s.contentLeft,
      sy = view.top - s.contentTop;

    workspace.scrollbar.set(sx, sy);
  }
}

function distance(pos, next) {
  return Math.sqrt(Math.pow(pos.left - next.left, 2) + Math.pow(pos.top - next.top, 2));
}
