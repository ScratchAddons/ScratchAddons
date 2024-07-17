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
    this.navigationHistory = new NavigationHistory();
    /**
     * The workspace
     */
    this._workspace = null;

    this.exSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.exSVG.setAttribute("xmlns:html", "http://www.w3.org/1999/xhtml");
    this.exSVG.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    this.exSVG.setAttribute("version", "1.1");
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
   * Returns the main workspace
   * @returns !Blockly.Workspace
   */
  getWorkspace() {
    const currentWorkspace = Blockly.getMainWorkspace();
    if (currentWorkspace.getToolbox()) {
      // Sadly get get workspace does not always return the 'real' workspace... Not sure how to get that at the moment,
      //  but we can work out whether it's the right one by whether it has a toolbox.
      this._workspace = currentWorkspace;
    }
    return this._workspace;
  }

  /**
   * Based on wksp.centerOnBlock(li.data.labelID);
   * @param blockOrId {Blockly.Block|{id}|BlockInstance} A Blockly Block, a block id, or a BlockInstance
   */
  scrollBlockIntoView(blockOrId) {
    let workspace = this.getWorkspace();
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
      // sx = s.contentLeft + s.viewWidth / 2 - x,
      let sx = x - s.contentLeft - this.offsetX,
        // sy = s.contentTop - y + Math.max(Math.min(32, 32 * scale), (s.viewHeight - yh) / 2);
        sy = y - s.contentTop - this.offsetY;

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

  setCSSVars(element) {
    for (let property of document.documentElement.style) {
      if (property.startsWith("--editorTheme3-"))
        element.style.setProperty(property, document.documentElement.style.getPropertyValue(property));
    }
  }

  makeStyle() {
    let style = document.createElement("style");
    style.textContent = `
    .blocklyText {
        fill: ${this.blockly.Colours.text};
        font-family: "Helvetica Neue", Helvetica, sans-serif;
        font-size: 12pt;
        font-weight: 500;
    }
    .blocklyNonEditableText>text, .blocklyEditableText>text {
        fill: ${this.blockly.Colours.textFieldText};
    }
    .blocklyDropdownText {
        fill: ${this.blockly.Colours.text} !important;
    }
    `;
    for (let userstyle of document.querySelectorAll(".scratch-addons-style[data-addon-id='editor-theme3']")) {
      if (userstyle.disabled) continue;
      style.textContent += userstyle.textContent;
    }
    return style;
  }

  removeNonReporterChildren(svgChild) {
    // 获取所有子节点
    const children = Array.from(svgChild.childNodes);
    // 遍历子节点
    children.forEach((child) => {
      // 首先判断是否为<g />标签
      if (child.tagName === "g") {
        // 获取 data-shapes 属性
        const dataShapes = child.getAttribute("data-shapes");
        const dataArgType = child.getAttribute("data-argument-type");
        // 检查 data-shapes 属性值
        if (
          dataShapes !== "reporter round" &&
          dataShapes !== "argument round" &&
          dataShapes !== "reporter boolean" &&
          dataArgType !== "dropdown"
        ) {
          // 如果不是期望的值，从父节点中移除该子节点
          svgChild.removeChild(child);
        }
      }
    });
  }

  /**
   * A function that creates a selected block based on export type and block data.
   *
   * @param {boolean} isExportPNG - Indicates whether the export type is PNG.
   * @param {object} block - The block data to create the selected block.
   * @return {object} The created selected block as an SVG element.
   */
  selectedBlocks(block, enabledAddons, is_need_children) {
    let svg = this.exSVG.cloneNode();

    let svgchild = block.svgGroup_;
    svgchild = svgchild.cloneNode(true);
    if (!is_need_children) {
      this.removeNonReporterChildren(svgchild);
    }
    let dataShapes = svgchild.getAttribute("data-shapes");
    let translateY = 0; // blocks no hat
    const scale = 0.8;
    if (dataShapes === "c-block c-1 hat") {
      translateY = 20; // for My block
    }
    if (dataShapes === "hat") {
      translateY = 16; // for Events
      if (enabledAddons.includes("cat-blocks")) {
        translateY += 16; // for cat ears
      }
    }

    svgchild.setAttribute("transform", `translate(0,${scale * translateY}) scale(${scale})`);
    // this.setCSSVars(svg);
    svg.append(this.makeStyle());
    svg.append(svgchild);
    return svg;
  }

  /**
   * Retrieves the SVG element for the given block. If a block is provided, it selects the selected blocks,
   * otherwise it selects all blocks. It resolves any non-breaking space whitespace in the SVG element and
   * replaces external images with data URIs.
   *
   * @param {Block} block - the block to select the SVG element for (optional)
   * @return {Promise<SVGElement>} a promise that resolves to the SVG element
   */
  getSVGElement(block, enabledAddons, is_need_children) {
    let svg;
    if (block) {
      svg = this.selectedBlocks(block, enabledAddons, is_need_children);
    }

    // resolve nbsp whitespace
    svg.querySelectorAll("text").forEach((text) => {
      text.innerHTML = text.innerHTML.replace(/&nbsp;/g, " ");
    });

    // replace external images with data URIs
    return new Promise((resolve) => {
      Promise.all(
        Array.from(svg.querySelectorAll("image")).map(async (item) => {
          const iconUrl = item.getAttribute("xlink:href");
          if (iconUrl.startsWith("data:")) return;
          const blob = await (await fetch(iconUrl)).blob();
          const reader = new FileReader();
          const dataUri = await new Promise((resolve) => {
            reader.addEventListener("load", () => resolve(reader.result));
            reader.readAsDataURL(blob);
          });
          item.setAttribute("xlink:href", dataUri);
        })
      ).then(() => {
        // remove fill color
        this.removeAllFillStyles(svg);
        resolve(svg);
      });
    });
  }
  removeAllFillStyles(svg) {
    const pathElements = svg.querySelectorAll(".blocklyPath.blocklyBlockBackground");
    pathElements.forEach((pathElement) => {
      if (pathElement.style.fill) {
        pathElement.style.fill = "";
      }
    });
  }
}

class NavigationHistory {
  /**
   * Keep a record of the scroll and zoom position
   */
  storeView(next, dist) {
    forward = [];
    let workspace = Blockly.getMainWorkspace(),
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
    const workspace = Blockly.getMainWorkspace(),
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
    let view = forward.pop();
    if (!view) {
      return;
    }
    views.push(view);

    let workspace = Blockly.getMainWorkspace(),
      s = workspace.getMetrics();

    let sx = view.left - s.contentLeft,
      sy = view.top - s.contentTop;

    workspace.scrollbar.set(sx, sy);
  }
}

function distance(pos, next) {
  return Math.sqrt(Math.pow(pos.left - next.left, 2) + Math.pow(pos.top - next.top, 2));
}
