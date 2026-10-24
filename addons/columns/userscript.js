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

  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/toolbox/toolbox.ts#L694
  const _ToolboxPosition = Blockly.Toolbox.prototype.position;
  Blockly.Toolbox.prototype.position = function () {
    _ToolboxPosition.call(this);

    // Update flyout position when category menu height changes.
    if (this.HtmlDiv && !this.HtmlDiv._observer) {
      this.HtmlDiv._observer = new ResizeObserver(() => {
        this.getFlyout().position();
      });
      this.HtmlDiv._observer.observe(this.HtmlDiv);
    }
  };

  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/flyout_vertical.ts#L125
  const _VerticalFlyoutPosition = Blockly.VerticalFlyout.prototype.position;
  Blockly.VerticalFlyout.prototype.position = function () {
    _VerticalFlyoutPosition.call(this);
    if (addon.self.disabled || !this.isVisible() || !this.svgGroup_) {
      return;
    }
    const targetWorkspaceMetrics = this.targetWorkspace.getMetrics();
    if (!targetWorkspaceMetrics) {
      // Hidden components will return null.
      return;
    }

    const injectionDiv = document.querySelector(".injectionDiv");
    const workspaceBorderWidth = injectionDiv.offsetWidth - injectionDiv.clientWidth;
    let viewWidth;
    // Subtract the total width of left and right workspace borders from the workspace width.
    viewWidth = targetWorkspaceMetrics.svgWidth - targetWorkspaceMetrics.toolboxWidth - workspaceBorderWidth;
    const x = this.toolboxPosition_ === Blockly.TOOLBOX_AT_RIGHT ? viewWidth : 0;
    const y = this.targetWorkspace.getToolbox().HtmlDiv.offsetHeight;

    // Addon sets the width of the flyout to the width of the toolbox.
    this.width_ = this.targetWorkspace.getToolbox().HtmlDiv.clientWidth;
    this.height_ = Math.max(0, targetWorkspaceMetrics.viewHeight - y);
    this.setBackgroundPath(this.width_, this.height_);

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

    // Set CSS variables for the userstyle.
    const container = this.svgGroup_.closest("[class*='gui_tab-panel_']");
    container.style.setProperty("--sa-add-extension-button-y", `${y - 33}px`);
    container.parentElement.style.setProperty("--sa-flyout-y", `${y}px`);
  };

  const CheckableContinuousFlyout = addon.tab.traps.getWorkspace().getFlyout().constructor;
  // https://github.com/scratchfoundation/scratch-blocks/blob/2884131/src/checkable_continuous_flyout.ts#L60
  const _CheckableContinuousFlyoutGetWidth = CheckableContinuousFlyout.prototype.getWidth;
  CheckableContinuousFlyout.prototype.getWidth = function () {
    // In RTL, this will be called by Blockly to position blocks inside the flyout.
    let width = _CheckableContinuousFlyoutGetWidth.call(this);
    if (!addon.self.disabled) width += 60;
    return width;
  };

  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/toolbox/toolbox.ts#L185
  const _ToolboxCreateDom = Blockly.Toolbox.prototype.createDom_;
  Blockly.Toolbox.prototype.createDom_ = function (...args) {
    const container = _ToolboxCreateDom.call(this, ...args);
    if (addon.self.disabled) return container;

    /* Create a separate container for extension categories */
    this.secondTable = this.createContentsContainer_();
    this.secondTable.classList.add("sa-extension-categories");
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

  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/toolbox/toolbox.ts#L391
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

  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/toolbox/toolbox.ts#L906
  const _ToolboxSelectItem = Blockly.Toolbox.prototype.selectItem_;
  Blockly.Toolbox.prototype.selectItem_ = function (oldItem, newItem) {
    _ToolboxSelectItem.call(this, oldItem, newItem);
    Blockly.utils.aria.setState(this.secondTable, Blockly.utils.aria.State.ACTIVEDESCENDANT, newItem.getId());
  };

  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/toolbox/toolbox.ts#L889
  const _ToolboxDeselectItem = Blockly.Toolbox.prototype.deselectItem_;
  Blockly.Toolbox.prototype.deselectItem_ = function (item) {
    _ToolboxDeselectItem.call(this, item);
    Blockly.utils.aria.setState(this.secondTable, Blockly.utils.aria.State.ACTIVEDESCENDANT, "");
  };

  // https://github.com/RaspberryPiFoundation/blockly/blob/39c4b58/packages/blockly/core/scrollbar.ts#L711
  const _ScrollbarOnMouseDownBar = Blockly.Scrollbar.prototype.onMouseDownBar;
  Blockly.Scrollbar.prototype.onMouseDownBar = function (e) {
    // Scratch doesn't add the scrollbar origin coordinates when comparing mouse position with handle position
    const newEvent = new MouseEvent("mousedown", {
      // used by Blockly.utils.isRightButton:
      button: e.button,
      // used by Blockly.utils.mouseToSvg:
      clientX: e.clientX + this.origin.x,
      clientY: e.clientY + this.origin.y,
    });
    newEvent.stopPropagation = () => e.stopPropagation();
    newEvent.preventDefault = () => e.preventDefault();
    _ScrollbarOnMouseDownBar.call(this, newEvent);
  };

  function updateToolbox() {
    const workspace = Blockly.getMainWorkspace();
    const toolbox = workspace.getToolbox();
    if (!toolbox) return;

    // Must remove and repopulate the toolbox so we can run our polluted commands.
    if (!toolbox.HtmlDiv) return;
    toolbox.HtmlDiv.remove();
    toolbox.HtmlDiv = toolbox.createDom_(workspace);
    const selectedItemId = toolbox.getSelectedItem().id_;
    toolbox.render(workspace.options.languageTree);
    toolbox.selectItem_(null, toolbox.contents.get(selectedItemId));
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
