/**
 * @fileoverview LogView: A virtualized log viewer.
 */

const clamp = (i, min, max) => Math.max(min, Math.min(max, i));

const areLogsEqual = (a, b) => (
  a.text === b.text &&
  a.type === b.type &&
  // TODO: if the same message is logged from a different spot, should those messages be grouped?
  a.blockId === b.blockId &&
  a.targetId === b.targetId
);

class LogView {
  constructor ({msg, addon}) {
    this.addon = addon;
    this.msg = msg;
    this.vm = addon.tab.traps.vm;
    addon.tab.traps.getBlockly().then((ScratchBlocks) => {
      this.ScratchBlocks = ScratchBlocks;
    });

    this.logs = [];

    this.handleScroll = this.handleScroll.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleClickLink = this.handleClickLink.bind(this);

    this.scrollElement = document.createElement('div');
    this.scrollElement.className = 'sa-debugger-log-scroll';
    this.scrollElement.addEventListener('scroll', this.handleScroll, {passive: true});
    this.scrollElement.addEventListener('wheel', this.handleWheel, {passive: true});

    this.logElement = document.createElement('div');
    this.logElement.className = 'sa-debugger-log-container';
    this.scrollElement.appendChild(this.logElement);

    this.visible = false;
    this.isScrolledToEnd = true;
    this.scrollTopWhenHidden = 'end';
    this.scrollTop = 0;
    this.updateContentQueued = false;
    this.scrollToEndQueued = false;
  }

  append (log) {
    this.queueUpdateContent();

    log.text = '' + log.text;

    const lastLog = this.logs[this.logs.length - 1];
    if (lastLog && areLogsEqual(lastLog, log)) {
      lastLog.count++;
      this.invalidateLogDOM(lastLog);
      return;
    }

    log.count = 1;
    this.logs.push(log);

    const MAX_LOGS = 200000
    while (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }

    this.queueScrollToEnd();
  }

  clear () {
    this.logs.length = 0;
    this.queueUpdateContent();
  }

  show () {
    this.visible = true;
    this.queueUpdateContent();
    if (this.scrollTopWhenHidden === 'end') {
      this.queueScrollToEnd();
    } else {
      this.scrollElement.scrollTop = this.scrollTopWhenHidden;
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

  getTargetById (id) {
    return this.addon.tab.traps.vm.runtime.getTargetById(id);
  }

  getTargetInfoById (id) {
    const target = this.getTargetById(id);
    if (target) {
      return {
        exists: true,
        name: target.isOriginal ? target.getName() : this.msg('clone-of', {
          spriteName: target.getName()
        })
      }
    }
    return {
      exists: false,
      name: this.msg('unknown-sprite')
    };
  }

  createBlockPreview (blockId, targetId) {
    const target = this.getTargetById(targetId);
    const block = target.blocks.getBlock(blockId);
    if (!block || !this.ScratchBlocks) {
      return null;
    }
    const inputId = Object.values(block.inputs)[0]?.block;
    const inputBlock = target.blocks.getBlock(inputId);
    if (inputBlock && inputBlock.opcode !== "text") {
      let text, category;
      if (
        inputBlock.opcode === "data_variable" ||
        inputBlock.opcode === "data_listcontents" ||
        inputBlock.opcode === "argument_reporter_string_number" ||
        inputBlock.opcode === "argument_reporter_boolean"
      ) {
        text = Object.values(inputBlock.fields)[0].value;
        if (inputBlock.opcode === "data_variable") {
          category = "data";
        } else if (inputBlock.opcode === "data_listcontents") {
          category = "list";
        } else {
          category = "more";
        }
      } else {
        // Try to call things like https://github.com/LLK/scratch-blocks/blob/develop/blocks_vertical/operators.js
        let jsonData;
        const fakeBlock = {
          jsonInit(data) {
            jsonData = data;
          },
        };
        const blockConstructor = this.ScratchBlocks.Blocks[inputBlock.opcode];
        if (blockConstructor) {
          try {
            blockConstructor.init.call(fakeBlock);
          } catch (e) {
            // ignore
          }
        }
        // If the block has a simple message with no arguments, display it
        if (jsonData && jsonData.message0 && !jsonData.args0) {
          text = jsonData.message0;
          category = jsonData.category;
        }
      }
      if (text && category) {
        const blocklyColor = this.ScratchBlocks.Colours[category === "list" ? "data_lists" : category];
        if (blocklyColor) {
          const element = document.createElement("span");
          element.textContent = text;
          element.className = "sa-debugger-block-preview";
          const colorCategoryMap = {
            list: "data-lists",
            more: "custom",
          };
          element.dataset.category = colorCategoryMap[category] || category;
          element.style.backgroundColor = blocklyColor.primary;
          return element;
        }
      }
    }
    return null;
  }

  buildLogDOM (log) {
    if (!log._dom) {
      const element = document.createElement('div');
      element.dataset.type = log.type;
      element.className = 'sa-debugger-log';

      if (log.count !== 1) {
        const repeats = document.createElement('div');
        repeats.className = 'sa-debugger-log-repeats';
        repeats.textContent = log.count;
        element.appendChild(repeats);
      }

      if (log.type !== 'log') {
        const icon = document.createElement('div');
        icon.className = 'sa-debugger-log-icon';
        icon.title = this.msg('icon-' + log.type);
        element.appendChild(icon);
      }

      if (log.blockId && log.targetId) {
        const preview = this.createBlockPreview(log.blockId, log.targetId);
        if (preview) {
          element.appendChild(preview);
        }
      }

      const body = document.createElement('div');
      body.className = 'sa-debugger-log-body';
      if (log.text.length === 0) {
        body.textContent = this.msg('empty-string');
        body.classList.add('sa-debugger-log-body-empty');
      } else {
        body.textContent = log.text;
      }
      body.title = log.text;
      element.appendChild(body);

      if (log.blockId && log.targetId) {
        const link = document.createElement('a');
        link.className = 'sa-debugger-log-link';
        element.appendChild(link);

        const {exists, name} = this.getTargetInfoById(log.targetId);
        link.textContent = name;
        if (exists) {
          link.addEventListener('click', this.handleClickLink);
          link.dataset.target = log.targetId;
          link.dataset.block = log.blockId;
        } else {
          link.classList.add('sa-debugger-log-link-unknown');
        }
      }

      log._dom = element;
    }
    return log._dom;
  }

  invalidateLogDOM (log) {
    log._dom = null;
  }

  queueScrollToEnd () {
    if (this.visible && this.isScrolledToEnd && !this.scrollToEndQueued) {
      this.scrollToEndQueued = true;
      queueMicrotask(() => {
        this.scrollToEndQueued = false;
        if (this.isScrolledToEnd) {
          const scrollEnd = this.scrollElement.scrollHeight - this.scrollElement.offsetHeight;
          this.scrollElement.scrollTop = scrollEnd;
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
    const LOG_HEIGHT = 20;
    const SCROLL_HEIGHT = 350;
    const EXTRA_ROWS_ABOVE = 5;
    const EXTRA_ROWS_BELOW = 5;

    const totalHeight = this.logs.length * LOG_HEIGHT;
    this.logElement.style.height = `${totalHeight}px`;

    const scrollStartIndex = Math.floor(this.scrollTop / LOG_HEIGHT);
    const rowsVisible = Math.ceil(SCROLL_HEIGHT / LOG_HEIGHT);
    const startIndex = clamp(scrollStartIndex - EXTRA_ROWS_BELOW, 0, this.logs.length);
    const endIndex = clamp(scrollStartIndex + rowsVisible + EXTRA_ROWS_ABOVE, 0, this.logs.length);

    while (this.logElement.firstChild) this.logElement.firstChild.remove();
    for (let i = startIndex; i < endIndex; i++) {
      const log = this.logs[i];
      const element = this.buildLogDOM(log);
      element.style.transform = `translateY(${i * LOG_HEIGHT}px)`;
      this.logElement.appendChild(element);
    }
  }
}

export default LogView;
