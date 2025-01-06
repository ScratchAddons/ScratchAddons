import BlockInstance from "./BlockInstance.js";
import BlockFlasher from "./BlockFlasher.js";

// Make these global so that every addon uses the same arrays.
let views = [];
let forward = [];
export default class Utils {
  constructor(addon) {
    this.addon = addon;
    this.addon.tab.traps.getBlockly().then((blockly) => {
      this.blockly = blockly;
    });
    /**
     * Scratch Virtual Machine
     * @type {null|*}
     */
    this.vm = this.addon.tab.traps.vm;
    // this._myFlash = { block: null, timerID: null, colour: null };
    this.offsetX = 32;
    this.offsetY = 32;
    this.navigationHistory = new NavigationHistory(this.addon);
  }

  /**
   * Get the Scratch Editing Target
   * @returns {?Target} the scratch editing target
   */
  getEditingTarget() {
    return this.vm.runtime.getEditingTarget();
  }

  /**
   * Set the current workspace (switches sprites)
   * @param targetID {string}
   */
  setEditingTarget(targetID) {
    if (this.getEditingTarget().id !== targetID) {
      this.vm.setEditingTarget(targetID);
    }
  }

  /**
   * Based on wksp.centerOnBlock(li.data.labelID);
   * @param blockOrId {Blockly.Block|{id}|BlockInstance} A Blockly Block, a block id, or a BlockInstance
   */
  scrollBlockIntoView(blockOrId) {
    let workspace = this.addon.tab.traps.getWorkspace();
    /** @type {Blockly.Block} */
    let block; // or is it really a Blockly.BlockSvg?

    if (blockOrId instanceof BlockInstance) {
      // Switch to sprite
      this.setEditingTarget(blockOrId.targetId);
      // Highlight the block!
      block = workspace.getBlockById(blockOrId.id);
    } else {
      block = blockOrId && blockOrId.id ? blockOrId : workspace.getBlockById(blockOrId);
    }

    if (!block) {
      return;
    }

    /**
     * !Blockly.Block
     */
    let root = block.getRootBlock();
    let base = this.getTopOfStackFor(block);
    let ePos = base.getRelativeToSurfaceXY(), // Align with the top of the block
      rPos = root.getRelativeToSurfaceXY(), // Align with the left of the block 'stack'
      scale = workspace.scale,
      x = rPos.x * scale,
      y = ePos.y * scale,
      xx = block.width + x, // Turns out they have their x & y stored locally, and they are the actual size rather than scaled or including children...
      yy = block.height + y,
      s = workspace.getMetrics();
    if (
      x < s.viewLeft + this.offsetX - 4 ||
      xx > s.viewLeft + s.viewWidth ||
      y < s.viewTop + this.offsetY - 4 ||
      yy > s.viewTop + s.viewHeight
    ) {
      let { sx, sy } = this.navigationHistory.scrollPosFromOffset(
        {
          left: x - this.offsetX,
          top: y - this.offsetY,
        },
        s
      );

      this.navigationHistory.storeView(this.navigationHistory.peek(), 64);

      // workspace.hideChaff(),
      workspace.scrollbar.set(sx, sy);
      this.navigationHistory.storeView({ left: sx, top: sy }, 64);
    }
    this.blockly?.hideChaff();
    BlockFlasher.flash(block);
  }

  /**
   * Find the top stack block of a  stack
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
  constructor(addon) {
    this.addon = addon;
  }

  scrollPosFromOffset({ left, top }, metrics) {
    // New Blockly uses "scrollLeft" and "scrollTop" instead of "contentLeft" and "contentTop"
    let scrollLeft = metrics.scrollLeft ?? metrics.contentLeft;
    let scrollTop = metrics.scrollTop ?? metrics.contentTop;
    return {
      sx: left - scrollLeft,
      sy: top - scrollTop,
    };
  }

  /**
   * Keep a record of the scroll and zoom position
   */
  storeView(next, dist) {
    forward = [];
    let workspace = this.addon.tab.traps.getWorkspace(),
      s = workspace.getMetrics();

    let pos = { left: s.viewLeft, top: s.viewTop };
    if (!next || distance(pos, next) > dist) {
      views.push(pos);
    }
  }

  peek() {
    return views.length > 0 ? views[views.length - 1] : null;
  }

  goBack() {
    const workspace = this.addon.tab.traps.getWorkspace(),
      s = workspace.getMetrics();

    let pos = { left: s.viewLeft, top: s.viewTop };
    let view = this.peek();
    if (!view) {
      return;
    }
    if (distance(pos, view) < 64) {
      // Go back to current if we are already far away from it
      if (views.length > 1) {
        views.pop();
        forward.push(view);
      }
    }

    view = this.peek();
    if (!view) {
      return;
    }

    let { sx, sy } = this.scrollPosFromOffset(view, s);

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
    let view = forward.pop();
    if (!view) {
      return;
    }
    views.push(view);

    let workspace = this.addon.tab.traps.getWorkspace(),
      s = workspace.getMetrics();

    let { sx, sy } = this.scrollPosFromOffset(view, s);

    workspace.scrollbar.set(sx, sy);
  }
}

function distance(pos, next) {
  return Math.sqrt(Math.pow(pos.left - next.left, 2) + Math.pow(pos.top - next.top, 2));
}
