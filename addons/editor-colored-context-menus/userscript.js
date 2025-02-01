import { removeAlpha } from "../../libraries/common/cs/text-color.esm.js";

export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  const applyContextMenuColor = (block) => {
    let widgetDiv;
    let background;
    if (ScratchBlocks.registry) {
      // New Blockly
      widgetDiv = ScratchBlocks.WidgetDiv.getDiv();
      background = block.pathObject.svgPath;
    } else {
      widgetDiv = ScratchBlocks.WidgetDiv.DIV;
      background = block.svgPath_;
    }
    if (!widgetDiv || !background) {
      return;
    }
    const fill = removeAlpha(background.getAttribute("fill"));
    const border = background.getAttribute("stroke") || "#0003";
    widgetDiv.classList.add("sa-contextmenu-colored");
    widgetDiv.style.setProperty("--sa-contextmenu-bg", fill);
    widgetDiv.style.setProperty("--sa-contextmenu-border", border);
    if (!ScratchBlocks.registry) {
      // Old Blockly
      const text = ScratchBlocks.Colours.text;
      widgetDiv.style.setProperty("--sa-contextmenu-text", text);
    }
  };

  const originalHandleRightClick = ScratchBlocks.Gesture.prototype.handleRightClick;
  ScratchBlocks.Gesture.prototype.handleRightClick = function (...args) {
    const block = ScratchBlocks.registry ? this.targetBlock : this.targetBlock_;
    const ret = originalHandleRightClick.call(this, ...args);
    if (block) {
      applyContextMenuColor(block);
    } else {
      if (ScratchBlocks.registry) {
        // New Blockly
        ScratchBlocks.WidgetDiv.getDiv().classList.remove("sa-contextmenu-colored");
      } else {
        ScratchBlocks.WidgetDiv.DIV.classList.remove("sa-contextmenu-colored");
      }
    }
    return ret;
  };
}
