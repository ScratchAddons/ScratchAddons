export default async function ({ addon, msg, global, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const workspace = Blockly.getMainWorkspace();
  const toolbox = workspace.getToolbox();
  toolbox.dispose();
  toolbox.workspace_ = workspace;

  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L235
  const _ToolboxPosition = Blockly.Toolbox.prototype.position;
  Blockly.Toolbox.prototype.position = function () {
    _ToolboxPosition.call(this);

    var treeDiv = this.HtmlDiv;
    if (!treeDiv) {
      // Not initialized yet.
      return;
    }
    // var svg = this.workspace_.getParentSvg();
    // var svgSize = Blockly.svgSize(svg);

    if (this.toolboxPosition == Blockly.TOOLBOX_AT_RIGHT) {
      // Right
      treeDiv.style.right = "0";
    } else {
      // Left
      treeDiv.style.left = "0";
    }
    treeDiv.style.setProperty("height", "auto", "important");
    treeDiv.style.setProperty("width", Blockly.VerticalFlyout.prototype.DEFAULT_WIDTH + 60 + "px");
  };

  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/flyout_vertical.js#L314
  const _VerticalFlyoutPosition = Blockly.VerticalFlyout.prototype.position;
  Blockly.VerticalFlyout.prototype.position = function () {
    _VerticalFlyoutPosition.call(this);
    if (!this.isVisible()) {
      return;
    }
    var targetWorkspaceMetrics = this.targetWorkspace_.getMetrics();
    if (!targetWorkspaceMetrics) {
      // Hidden components will return null.
      return;
    }

    // This version of the flyout does not change width to fit its contents.
    // Instead it matches the width of its parent or uses a default value.
    this.width_ = this.getWidth();

    var toolboxWidth = this.parentToolbox_.getWidth();
    var categoryWidth = toolboxWidth - this.width_;
    var width = this.toolboxPosition_ == Blockly.TOOLBOX_AT_RIGHT ? targetWorkspaceMetrics.viewWidth : categoryWidth;

    this.width_ += width;

    var x = 0;
    console.log(this.parentToolbox_.HtmlDiv);
    var y = this.parentToolbox_.HtmlDiv.offsetHeight;
    console.log(y);
    y = 126; // temp fix

    // Record the height for Blockly.Flyout.getMetrics_
    this.height_ = Math.max(0, targetWorkspaceMetrics.viewHeight - y);

    this.setBackgroundPath_(this.width_, this.height_);

    this.svgGroup_.setAttribute("width", this.width_);
    this.svgGroup_.setAttribute("height", this.height_);
    var transform = "translate(" + x + "px," + y + "px)";
    Blockly.utils.setCssTransform(this.svgGroup_, transform);

    // Update the scrollbar (if one exists).
    if (this.scrollbar_) {
      // Set the scrollbars origin to be the top left of the flyout.
      this.scrollbar_.setOrigin(x + width, y);
      this.scrollbar_.resize();
    }
  };

  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L595
  const _CategoryMenuCreateDom = Blockly.Toolbox.CategoryMenu.prototype.createDom;
  Blockly.Toolbox.CategoryMenu.prototype.createDom = function () {
    _CategoryMenuCreateDom.call(this);
    this.table.style.setProperty("width", "100%");
    this.table.style.setProperty("display", "grid");
    this.table.style.setProperty("grid-template-columns", "repeat(2, 1fr)");
    this.table.style.setProperty("margin-top", "10px");
    this.table.style.setProperty("margin-bottom", "5px");
    // margin-bottom: 2px;
  };

  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L710
  const _CategoryCreateDom = Blockly.Toolbox.Category.prototype.createDom;
  Blockly.Toolbox.Category.prototype.createDom = function () {
    _CategoryCreateDom.call(this);

    this.parentHtml_.style.setProperty("margin-left", "10px");

    this.item_.style.setProperty("padding", "0px");
    this.item_.style.setProperty("display", "flex");
    this.item_.style.setProperty("margin-bottom", "2px");
    this.item_.style.setProperty("width", "90%");

    this.bubble_.style.setProperty("border-radius", "0px");
    this.bubble_.style.setProperty("width", "8px");
    this.bubble_.style.setProperty("margin", "0px 2px 0px 0px");
    this.bubble_.style.setProperty("border", "none", "important");

    this.label_.style.setProperty("font-size", "12px");
    this.label_.style.setProperty("flex", "1");
    this.label_.style.setProperty("display", "flex");
    this.label_.style.setProperty("align-items", "center");

    this.parent_.parent_.flyout_.position();
  };

  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/toolbox.js#L738
  const _CategorySetSelected = Blockly.Toolbox.Category.prototype.setSelected;
  Blockly.Toolbox.Category.prototype.setSelected = function (selected) {
    _CategorySetSelected.call(this, selected);
    if (selected) {
      this.item_.style.setProperty("background", this.colour_);
      this.label_.style.setProperty("color", "white");
      this.label_.style.setProperty("font-weight", "bold");
    } else {
      this.item_.style.setProperty("background", "none");
      this.label_.style.setProperty("color", "inherit");
      this.label_.style.setProperty("font-weight", "inherit");
    }
  };

  toolbox.init();
}
