import { removeAlpha } from "../../libraries/common/cs/text-color.esm.js";

export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const applyContextMenuColor = (block) => {
    const widgetDiv = ScratchBlocks.WidgetDiv.getDiv();
    const background = block.pathObject.svgPath;
    if (!widgetDiv || !background) {
      return;
    }
    const fill = removeAlpha(background.getAttribute("fill"));
    const border = background.getAttribute("stroke") || "#0003";
    widgetDiv.classList.add("sa-contextmenu-colored");
    widgetDiv.style.setProperty("--sa-contextmenu-bg", fill);
    widgetDiv.style.setProperty("--sa-contextmenu-border", border);
  };

  const originalHandleRightClick = ScratchBlocks.Gesture.prototype.handleRightClick;
  ScratchBlocks.Gesture.prototype.handleRightClick = function (...args) {
    const block = this.targetBlock;
    const ret = originalHandleRightClick.call(this, ...args);
    if (block) {
      applyContextMenuColor(block);
    } else {
      ScratchBlocks.WidgetDiv.getDiv().classList.remove("sa-contextmenu-colored");
    }
    return ret;
  };
}
