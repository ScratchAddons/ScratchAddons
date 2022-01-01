/**
 * @fileoverview LogView: A virtualized row viewer.
 */

const clamp = (i, min, max) => Math.max(min, Math.min(max, i));

const LOG_HEIGHT = 20;
const EXTRA_ROWS_ABOVE = 5;
const EXTRA_ROWS_BELOW = 5;
const MAX_LOGS = 200000;

class LogView {
  constructor ({msg, addon}) {
    this.addon = addon;
    this.msg = msg;
    this.vm = addon.tab.traps.vm;

    this.logs = [];
    this.canAutoScrollToEnd = true;

    this.handleScroll = this.handleScroll.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleClickLink = this.handleClickLink.bind(this);

    this.outerElement = document.createElement('div');
    this.outerElement.className = 'sa-debugger-log-outer';
    
    this.innerElement = document.createElement('div');
    this.innerElement.className = 'sa-debugger-log-inner';
    this.outerElement.appendChild(this.innerElement);
    this.innerElement.addEventListener('scroll', this.handleScroll, {passive: true});
    this.innerElement.addEventListener('wheel', this.handleWheel, {passive: true});

    this.endElement = document.createElement('div');
    this.endElement.className = 'sa-debugger-log-end';
    this.innerElement.appendChild(this.endElement);

    this.visible = false;
    this.isScrolledToEnd = true;
    this.scrollTopWhenHidden = 'end';
    this.scrollTop = 0;
    this.updateContentQueued = false;
    this.scrollToEndQueued = false;
  }

  compareLogs () {
    // to be overridden
    return false;
  }

  append (log) {
    this.queueUpdateContent();

    if (typeof log.text !== 'string') {
      log.text = '' + log.text;
    }

    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && this.compareLogs(lastLog, log)) {
      lastLog.count++;
      this.invalidateLogDOM(lastLog);
      return;
    }

    log.count = 1;
    this.logs.push(log);

    while (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }

    this.queueScrollToEnd();
  }

  clear () {
    this.logs.length = 0;
    this.scrollTop = 0;
    this.isScrolledToEnd = true;
    this.queueUpdateContent();
  }

  show () {
    this.visible = true;
    this.height = this.innerElement.offsetHeight;
    this.queueUpdateContent();
    if (this.scrollTopWhenHidden === 'end') {
      this.queueScrollToEnd();
    } else {
      this.innerElement.scrollTop = this.scrollTopWhenHidden;
    }
  }

  hide () {
    this.visible = false;
    this.scrollTopWhenHidden = this.isScrolledToEnd ? 'end' : this.scrollTop;
  }

  handleScroll (e) {
    this.scrollTop = e.target.scrollTop;
    this.isScrolledToEnd = e.target.scrollTop + 5 >= e.target.scrollHeight - e.target.clientHeight;
    this.queueUpdateContent();
  }

  handleWheel (e) {
    if (e.deltaY < 0) {
      this.isScrolledToEnd = false;
    }
  }

  goToBlock (targetId, blockId) {
    const workspace = Blockly.getMainWorkspace();
    const vm = this.vm;
    const redux = this.addon.tab.redux;

    const offsetX = 32;
    const offsetY = 32;
    if (targetId !== vm.editingTarget.id) {
      if (vm.runtime.getTargetById(targetId)) {
        vm.setEditingTarget(targetId);
        setTimeout(() => this.goToBlock(targetId, blockId), 300);
      }
      return;
    }

    const block = workspace.getBlockById(blockId);
    if (!block) return;

    // Don't scroll to blocks in the flyout
    if (block.workspace.isFlyout) return;

    // Make sure the code tab is active
    if (redux.state.scratchGui.editorTab.activeTabIndex !== 0) {
      redux.dispatch({
        type: "scratch-gui/navigation/ACTIVATE_TAB",
        activeTabIndex: 0,
      });
      setTimeout(() => goToBlock(targetId, blockId), 0);
      return;
    }

    // Copied from devtools. If it's code gets improved for this function, bring those changes here too.
    let root = block.getRootBlock();

    let base = block;
    while (base.getOutputShape() && base.getSurroundParent()) {
      base = base.getSurroundParent();
    }

    let ePos = base.getRelativeToSurfaceXY(), // Align with the top of the block
      rPos = root.getRelativeToSurfaceXY(), // Align with the left of the block 'stack'
      scale = workspace.scale,
      x = rPos.x * scale,
      y = ePos.y * scale,
      xx = block.width + x, // Turns out they have their x & y stored locally, and they are the actual size rather than scaled or including children...
      yy = block.height + y,
      s = workspace.getMetrics();
    if (
      x < s.viewLeft + offsetX - 4 ||
      xx > s.viewLeft + s.viewWidth ||
      y < s.viewTop + offsetY - 4 ||
      yy > s.viewTop + s.viewHeight
    ) {
      let sx = x - s.contentLeft - offsetX,
        sy = y - s.contentTop - offsetY;

      workspace.scrollbar.set(sx, sy);
    }
    // Flashing
    const myFlash = { block: null, timerID: null, colour: null };
    if (myFlash.timerID > 0) {
      clearTimeout(myFlash.timerID);
      myFlash.block.setColour(myFlash.colour);
    }

    let count = 4;
    let flashOn = true;
    myFlash.colour = block.getColour();
    myFlash.block = block;

    function _flash() {
      if (!myFlash.block.svgPath_) {
        myFlash.timerID = count = 0;
        flashOn = true;
        return;
      }
      myFlash.block.svgPath_.style.fill = flashOn ? "#ffff80" : myFlash.colour;
      flashOn = !flashOn;
      count--;
      if (count > 0) {
        myFlash.timerID = setTimeout(_flash, 200);
      } else {
        myFlash.timerID = 0;
      }
    }

    _flash();
  }

  handleClickLink (e) {
    e.preventDefault();
    const targetId = e.target.dataset.target;
    const blockId = e.target.dataset.block;
    this.goToBlock(targetId, blockId);
  }

  buildDOM (log) {
    // to be overridden
    throw new Error('not implemented');
  }

  buildDOMCached (log) {
    if (!log._dom) {
      log._dom = this.buildDOM(log);
    }
    return log._dom;
  }

  invalidateAllLogDOM () {
    for (const i of this.logs) {
      this.invalidateLogDOM(i);
    }
  }

  invalidateLogDOM (log) {
    log._dom = null;
  }

  scrollIntoView (index) {
    const distanceFromTop = index * LOG_HEIGHT;
    const viewportStart = this.scrollTop;
    const viewportEnd = this.scrollTop + this.height;
    const isInView = distanceFromTop > viewportStart && distanceFromTop < viewportEnd;
    if (!isInView) {
      this.scrollTop = distanceFromTop;
      this.innerElement.scrollTop = distanceFromTop;
    }
  }

  queueScrollToEnd () {
    if (this.visible && this.canAutoScrollToEnd && this.isScrolledToEnd && !this.scrollToEndQueued) {
      this.scrollToEndQueued = true;
      queueMicrotask(() => {
        this.scrollToEndQueued = false;
        if (this.isScrolledToEnd) {
          const scrollEnd = this.innerElement.scrollHeight - this.innerElement.offsetHeight;
          this.innerElement.scrollTop = scrollEnd;
          this.scrollTop = scrollEnd;
        }
      });
    }
  }

  queueUpdateContent () {
    if (this.visible && !this.updateContentQueued) {
      this.updateContentQueued = true;
      queueMicrotask(() => {
        this.updateContentQueued = false;
        this.updateContent();
      });
    }
  }

  updateContent () {
    const totalHeight = this.logs.length * LOG_HEIGHT;
    this.endElement.style.transform = `translateY(${totalHeight}px)`;

    const scrollStartIndex = Math.floor(this.scrollTop / LOG_HEIGHT);
    const rowsVisible = Math.ceil(this.height / LOG_HEIGHT);
    const startIndex = clamp(scrollStartIndex - EXTRA_ROWS_BELOW, 0, this.logs.length);
    const endIndex = clamp(scrollStartIndex + rowsVisible + EXTRA_ROWS_ABOVE, 0, this.logs.length);

    for (const el of Array.from(this.innerElement.children)) {
      if (el !== this.endElement) {
        el.remove();
      }
    }
    for (let i = startIndex; i < endIndex; i++) {
      const log = this.logs[i];
      const element = this.buildDOMCached(log);
      element.style.transform = `translateY(${i * LOG_HEIGHT}px)`;
      this.innerElement.appendChild(element);
    }
  }
}

export default LogView;
