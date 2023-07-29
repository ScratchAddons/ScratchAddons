export default async function ({ addon, msg, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L235
  const _ToolboxPosition = Blockly.Toolbox.prototype.position;
  Blockly.Toolbox.prototype.position = function () {
    _ToolboxPosition.call(this);

    // Update flyout position when category menu height changes.
    if (this.HtmlDiv && !this.HtmlDiv._observer) {
      this.HtmlDiv._observer = new ResizeObserver(() => {
        this.flyout_.position();
      });
      this.HtmlDiv._observer.observe(this.HtmlDiv);
    }
  };

  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/flyout_vertical.js#L314
  const _VerticalFlyoutPosition = Blockly.VerticalFlyout.prototype.position;
  Blockly.VerticalFlyout.prototype.position = function () {
    _VerticalFlyoutPosition.call(this);
    if (addon.self.disabled || !this.isVisible()) {
      return;
    }
    var targetWorkspaceMetrics = this.targetWorkspace_.getMetrics();
    if (!targetWorkspaceMetrics) {
      // Hidden components will return null.
      return;
    }

    // In RTL, subtract the total width of left and right workspace borders and the category menu border
    // from the workspace width.
    var x = this.toolboxPosition_ === Blockly.TOOLBOX_AT_RIGHT ? targetWorkspaceMetrics.viewWidth - 3 : 0;
    var y = this.parentToolbox_.HtmlDiv.offsetHeight;

    // Addon sets the width of the flyout to the width of the toolbox.
    this.width_ = this.parentToolbox_.getWidth();
    this.height_ = Math.max(0, targetWorkspaceMetrics.viewHeight - y);

    this.setBackgroundPath_(this.width_, this.height_);

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
    }

    // Set CSS variables for the userstyle.
    const container = this.svgGroup_.closest("[class*='gui_tab-panel_']");
    container.style.setProperty("--sa-add-extension-button-y", `${y - 33}px`);
    container.parentElement.style.setProperty("--sa-flyout-y", `${y}px`);
  };

  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/flyout_base.js#L370
  const _VerticalFlyoutGetWidth = Blockly.VerticalFlyout.prototype.getWidth;
  Blockly.VerticalFlyout.prototype.getWidth = function () {
    // In RTL, this will be called by Blockly to position blocks inside the flyout.
    let width = _VerticalFlyoutGetWidth.call(this);
    if (!addon.self.disabled) width += 60;
    return width;
  };

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
    const extensionsNodes = [];
    const extensionTree = domTree.cloneNode(true);
    if (!addon.self.disabled) {
      extensionTree.childNodes.forEach((child) => {
        if (child.tagName === "category" && !Categories.includes(child.id)) {
          extensionsNodes.push(child.cloneNode(true));
          child.remove();
        }
      });
    }
    _CategoryMenuPopulate.call(this, extensionTree);
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

  function updateToolbox() {
    const workspace = Blockly.getMainWorkspace();
    const toolbox = workspace.getToolbox();
    if (!toolbox) return;
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
    const addExtensionButton = await addon.tab.waitForElement("[class*='gui_extension-button_']", {
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
