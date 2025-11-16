export default async function ({ addon, msg, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const Categories = [
    "motion",
    "looks",
    "sound",
    "events",
    "control",
    "sensing",
    "operators",
    "variables",
    "lists",
    "myBlocks",
  ];

  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L235
  // https://github.com/google/blockly/blob/60b7ee1/core/toolbox/toolbox.ts#L683
  const _ToolboxPosition = Blockly.Toolbox.prototype.position;
  Blockly.Toolbox.prototype.position = function () {
    _ToolboxPosition.call(this);

    // Update flyout position when category menu height changes.
    if (this.HtmlDiv && !this.HtmlDiv._observer) {
      this.HtmlDiv._observer = new ResizeObserver(() => {
        const flyout = this.flyout_ || this.getFlyout(); // old Blockly || new Blockly
        flyout.position();
      });
      this.HtmlDiv._observer.observe(this.HtmlDiv);
    }
  };

  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/flyout_vertical.js#L314
  // https://github.com/google/blockly/blob/60b7ee1/core/flyout_vertical.ts#L125
  const _VerticalFlyoutPosition = Blockly.VerticalFlyout.prototype.position;
  Blockly.VerticalFlyout.prototype.position = function () {
    _VerticalFlyoutPosition.call(this);
    if (addon.self.disabled || !this.isVisible() || !this.svgGroup_) {
      return;
    }
    const targetWorkspace = this.targetWorkspace || this.targetWorkspace_; // new Blockly || old Blockly
    const targetWorkspaceMetrics = targetWorkspace.getMetrics();
    if (!targetWorkspaceMetrics) {
      // Hidden components will return null.
      return;
    }

    const injectionDiv = document.querySelector(".injectionDiv");
    const workspaceBorderWidth = injectionDiv.offsetWidth - injectionDiv.clientWidth;
    let viewWidth;
    if (Blockly.registry) {
      // new Blockly: subtract the total width of left and right workspace borders from the workspace width.
      viewWidth = targetWorkspaceMetrics.svgWidth - targetWorkspaceMetrics.toolboxWidth - workspaceBorderWidth;
    } else {
      // old Blockly: subtract the total width of left and right workspace borders and the category menu border
      // from the workspace width.
      viewWidth = targetWorkspaceMetrics.viewWidth - workspaceBorderWidth - 1;
    }
    const x = this.toolboxPosition_ === Blockly.TOOLBOX_AT_RIGHT ? viewWidth : 0;
    const y = targetWorkspace.getToolbox().HtmlDiv.offsetHeight;

    // Addon sets the width of the flyout to the width of the toolbox.
    this.width_ = targetWorkspace.getToolbox().HtmlDiv.clientWidth;
    this.height_ = Math.max(0, targetWorkspaceMetrics.viewHeight - y);

    const setBackgroundPath = Blockly.registry ? "setBackgroundPath" : "setBackgroundPath_";
    this[setBackgroundPath](this.width_, this.height_);

    if (Blockly.registry) {
      // new Blockly
      this.positionAt_(this.width_, this.height_, x, y);

      // Update the scrollbars.
      const scrollbarPair = this.workspace_.scrollbar;
      for (const scrollbar of [scrollbarPair.hScroll, scrollbarPair.vScroll]) {
        if (!scrollbar) continue;
        Blockly.browserEvents.unbind(scrollbar.onMouseDownBarWrapper_);
        scrollbar.onMouseDownBarWrapper_ = Blockly.browserEvents.conditionalBind(
          scrollbar.svgBackground,
          "pointerdown",
          scrollbar,
          scrollbar.onMouseDownBar
        );
      }
    } else {
      this.svgGroup_.setAttribute("width", this.width_);
      this.svgGroup_.setAttribute("height", this.height_);
      var transform = "translate(" + x + "px," + y + "px)";
      Blockly.utils.setCssTransform(this.svgGroup_, transform);

      // Update the scrollbar (if one exists).
      if (this.scrollbar_) {
        // Set the scrollbars origin to be the top left of the flyout.
        this.scrollbar_.setOrigin(
          x + (this.toolboxPosition_ === Blockly.TOOLBOX_AT_RIGHT ? 0 : this.width_ - this.getWidth()),
          y
        );
        this.scrollbar_.resize();
        Blockly.unbindEvent_(this.scrollbar_.onMouseDownBarWrapper_);
        this.scrollbar_.onMouseDownBarWrapper_ = Blockly.bindEventWithChecks_(
          this.scrollbar_.svgBackground_,
          "mousedown",
          this.scrollbar_,
          this.scrollbar_.onMouseDownBar_
        );
      }
    }

    // Set CSS variables for the userstyle.
    const container = this.svgGroup_.closest("[class*='gui_tab-panel_']");
    container.style.setProperty("--sa-add-extension-button-y", `${y - 33}px`);
    container.parentElement.style.setProperty("--sa-flyout-y", `${y}px`);
  };

  let CheckableContinuousFlyout;
  if (Blockly.registry) {
    // new Blockly
    CheckableContinuousFlyout = addon.tab.traps.getWorkspace().getFlyout().constructor;
  } else {
    CheckableContinuousFlyout = Blockly.VerticalFlyout;
  }
  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/flyout_base.js#L370
  // https://github.com/scratchfoundation/scratch-blocks/blob/2884131/src/checkable_continuous_flyout.ts#L60
  const _CheckableContinuousFlyoutGetWidth = CheckableContinuousFlyout.prototype.getWidth;
  CheckableContinuousFlyout.prototype.getWidth = function () {
    // In RTL, this will be called by Blockly to position blocks inside the flyout.
    let width = _CheckableContinuousFlyoutGetWidth.call(this);
    if (!addon.self.disabled) width += 60;
    return width;
  };

  if (Blockly.registry) {
    // new Blockly

    // https://github.com/google/blockly/blob/60b7ee1/core/toolbox/toolbox.ts#L185
    const _ToolboxCreateDom = Blockly.Toolbox.prototype.createDom_;
    Blockly.Toolbox.prototype.createDom_ = function (...args) {
      const container = _ToolboxCreateDom.call(this, ...args);
      if (addon.self.disabled) return container;

      /* Create a separate container for extension categories */
      this.secondTable = this.createContentsContainer_();
      this.secondTable.classList.add("scratchCategorySecondMenu");
      this.secondTable.tabIndex = 0;
      Blockly.utils.aria.setRole(this.secondTable, Blockly.utils.aria.Role.TREE);
      container.appendChild(this.secondTable);

      /* Keyboard navigation */
      const keyDownEvent = Blockly.utils.browserEvents.conditionalBind(
        this.secondTable,
        "keydown",
        this,
        this.onKeyDown_,
        /* opt_noCaptureIdentifier */ false
      );
      this.boundEvents_.push(keyDownEvent);

      return container;
    };

    // https://github.com/google/blockly/blob/60b7ee1/core/toolbox/toolbox.ts#L380
    const _ToolboxRenderContents = Blockly.Toolbox.prototype.renderContents_;
    Blockly.Toolbox.prototype.renderContents_ = function (toolboxDef) {
      /* Separate extensions from core categories */
      const coreItems = [];
      const extensionItems = [];
      for (const item of toolboxDef) {
        if (item.kind.toUpperCase() === "CATEGORY" && !Categories.includes(item.toolboxitemid)) {
          extensionItems.push(item);
        } else {
          coreItems.push(item);
        }
      }
      _ToolboxRenderContents.call(this, coreItems);
      const originalTable = this.contentsDiv_;
      this.contentsDiv_ = this.secondTable;
      _ToolboxRenderContents.call(this, extensionItems);
      this.contentsDiv_ = originalTable;
    };

    // https://github.com/google/blockly/blob/60b7ee1/core/toolbox/toolbox.ts#L895
    const _ToolboxSelectItem = Blockly.Toolbox.prototype.selectItem_;
    Blockly.Toolbox.prototype.selectItem_ = function (oldItem, newItem) {
      _ToolboxSelectItem.call(this, oldItem, newItem);
      Blockly.utils.aria.setState(this.secondTable, Blockly.utils.aria.State.ACTIVEDESCENDANT, newItem.getId());
    };

    // https://github.com/google/blockly/blob/60b7ee1/core/toolbox/toolbox.ts#L878
    const _ToolboxDeselectItem = Blockly.Toolbox.prototype.deselectItem_;
    Blockly.Toolbox.prototype.deselectItem_ = function (item) {
      _ToolboxDeselectItem.call(this, item);
      Blockly.utils.aria.setState(this.secondTable, Blockly.utils.aria.State.ACTIVEDESCENDANT, "");
    };
  } else {
    // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L595
    const _CategoryMenuCreateDom = Blockly.Toolbox.CategoryMenu.prototype.createDom;
    Blockly.Toolbox.CategoryMenu.prototype.createDom = function () {
      _CategoryMenuCreateDom.call(this);
      if (addon.self.disabled) return;
      this.secondTable = document.createElement("div");
      this.secondTable.className =
        "scratchCategorySecondMenu " +
        (this.parent_.horizontalLayout_ ? "scratchCategoryMenuHorizontal" : "scratchCategoryMenu");
      this.parentHtml_.appendChild(this.secondTable);
    };

    // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L606
    const _CategoryMenuPopulate = Blockly.Toolbox.CategoryMenu.prototype.populate;
    Blockly.Toolbox.CategoryMenu.prototype.populate = function (domTree) {
      if (!domTree) return;
      const extensionsNodes = [];
      const coreTree = domTree.cloneNode(true);
      if (!addon.self.disabled) {
        coreTree.childNodes.forEach((child) => {
          if (child.tagName === "category" && !Categories.includes(child.id)) {
            extensionsNodes.push(child.cloneNode(true));
            child.remove();
          }
        });
      }
      _CategoryMenuPopulate.call(this, coreTree);
      for (const child of extensionsNodes) {
        const row = document.createElement("div");
        row.className = "scratchCategoryMenuRow";
        this.secondTable.appendChild(row);
        if (child) {
          this.categories_.push(new Blockly.Toolbox.Category(this, row, child));
        }
      }
      if (!addon.self.disabled) {
        this.height_ = this.table.offsetHeight + this.secondTable.offsetHeight;
      }
    };

    // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L639
    const _CategoryMenuDispose = Blockly.Toolbox.CategoryMenu.prototype.dispose;
    Blockly.Toolbox.CategoryMenu.prototype.dispose = function () {
      _CategoryMenuDispose.call(this);
      if (this.secondTable) {
        this.secondTable.remove();
        this.secondTable = null;
      }
    };
  }

  // https://github.com/scratchfoundation/scratch-blocks/blob/d374085e42a84d8aaf10f1ef3fb6ec6e9f1b7cf4/core/scrollbar.js#L700
  // https://github.com/google/blockly/blob/60b7ee1/core/scrollbar.ts#L711
  const _ScrollbarOnMouseDownBarName = Blockly.registry ? "onMouseDownBar" : "onMouseDownBar_";
  const _ScrollbarOnMouseDownBar = Blockly.Scrollbar.prototype[_ScrollbarOnMouseDownBarName];
  Blockly.Scrollbar.prototype[_ScrollbarOnMouseDownBarName] = function (e) {
    // Scratch doesn't add the scrollbar origin coordinates when comparing mouse position with handle position
    const origin = this.origin || this.origin_; // new Blockly || old Blockly
    const newEvent = new MouseEvent("mousedown", {
      // used by Blockly.utils.isRightButton:
      button: e.button,
      // used by Blockly.utils.mouseToSvg:
      clientX: e.clientX + origin.x,
      clientY: e.clientY + origin.y,
    });
    newEvent.stopPropagation = () => e.stopPropagation();
    newEvent.preventDefault = () => e.preventDefault();
    _ScrollbarOnMouseDownBar.call(this, newEvent);
  };

  function updateToolbox() {
    const workspace = Blockly.getMainWorkspace();
    const toolbox = workspace.getToolbox();
    if (!toolbox) return;

    if (Blockly.registry) {
      // new Blockly
      // Must remove and repopulate the toolbox so we can run our polluted commands.
      if (!toolbox.HtmlDiv) return;
      toolbox.HtmlDiv.remove();
      toolbox.HtmlDiv = toolbox.createDom_(workspace);
      const selectedItemId = toolbox.getSelectedItem().id_;
      toolbox.render(workspace.options.languageTree);
      toolbox.selectItem_(null, toolbox.contents.get(selectedItemId));
    } else {
      const categoryMenu = toolbox.categoryMenu_;
      if (!categoryMenu) return;

      // Scratch may have already updated the toolbox for us, so no need to update it again.
      if (categoryMenu.secondTable && !addon.self.disabled) return;
      // Must dispose and createDom the category menu so we can run our polluted commands.
      categoryMenu.dispose();
      categoryMenu.createDom();
      // Repopulate the category menu since we've just disposed it.
      toolbox.populate_(workspace.options.languageTree);
      // Reposition the toolbox, since it's likely our addon moved it.
      toolbox.position();
    }
  }

  function updateClass() {
    // Add class to allow editor-compact to handle this addon
    if (addon.self.disabled) document.body.classList.remove("sa-columns-enabled");
    else document.body.classList.add("sa-columns-enabled");
  }

  updateToolbox();
  addon.self.addEventListener("disabled", updateToolbox);
  addon.self.addEventListener("reenabled", updateToolbox);

  updateClass();
  addon.self.addEventListener("disabled", updateClass);
  addon.self.addEventListener("reenabled", updateClass);

  while (true) {
    const addExtensionButton = await addon.tab.waitForElement("[class*='extension-button_extension-button_']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      condition: () => !addon.tab.redux.state.scratchGui.mode.isPlayerOnly,
    });
    const addExtensionLabel = Object.assign(document.createElement("span"), {
      className: "sa-add-extension-label",
      innerText: addon.tab.scratchMessage("gui.gui.addExtension"),
    });
    addon.tab.displayNoneWhileDisabled(addExtensionLabel);
    addExtensionButton.appendChild(addExtensionLabel);
    addExtensionButton.removeAttribute("title");
  }
}
