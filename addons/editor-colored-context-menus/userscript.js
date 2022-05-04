export default async function ({ addon, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const applyContextMenuColor = (block) => {
    const widgetDiv = ScratchBlocks.WidgetDiv.DIV;
    if (!widgetDiv) {
      return;
    }
    const background = block.svgPath_;
    if (!background) {
      return;
    }
    const style = window.getComputedStyle(background);
    const fill = style.getPropertyValue("fill");
    const border = style.getPropertyValue("stroke") || "#0003";
    const textColor = style.getPropertyValue("--sa-block-text-color") || "#fff";
    const hoverBg = style.getPropertyValue("--sa-block-secondary-color") || "#0001";
    widgetDiv.classList.add("sa-contextmenu-colored");
    widgetDiv.style.setProperty("--sa-contextmenu-bg", fill);
    widgetDiv.style.setProperty("--sa-contextmenu-border", border);
    widgetDiv.style.setProperty("--sa-contextmenu-text", textColor);
    widgetDiv.style.setProperty("--sa-contextmenu-hover", hoverBg);
  };

  const originalHandleRightClick = ScratchBlocks.Gesture.prototype.handleRightClick;
  ScratchBlocks.Gesture.prototype.handleRightClick = function (...args) {
    const block = this.targetBlock_;
    const ret = originalHandleRightClick.call(this, ...args);
    if (block) {
      applyContextMenuColor(block);
    }
    return ret;
  };

  const originalHide = ScratchBlocks.WidgetDiv.hide;
  ScratchBlocks.WidgetDiv.hide = function (...args) {
    if (ScratchBlocks.WidgetDiv.DIV) {
      ScratchBlocks.WidgetDiv.DIV.classList.remove("sa-contextmenu-colored");
    }
    return originalHide.call(this, ...args);
  };
}
