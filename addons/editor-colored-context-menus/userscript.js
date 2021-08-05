export default async function ({ addon, global, console }) {
  document.body.addEventListener("mousedown", handleClick, true);
}

function handleClick(e) {
  if (e.button !== 2) {
    return;
  }

  const widgetDiv = document.querySelector(".blocklyWidgetDiv");
  if (!widgetDiv) {
    return;
  }

  let target = e.target;
  if (target.closest(".blocklyMainBackground") || target.closest(".blocklyBubbleCanvas")) {
    widgetDiv.classList.remove("u-contextmenu-colored");
    return;
  }

  let block = target.closest("[data-id]");
  if (!block) {
    // When right clicking on the boundaries of a block in the flyout,
    // the click event can happen on a background rectangle and not on the actual block for some reason.
    // In this case, the block group should immediately follow the rect.
    if (target.tagName === "rect") {
      target = target.nextSibling;
      block = target && target.closest("[data-id]");
    }
    if (!block) {
      return;
    }
  }

  let blocklyBlock = Blockly.getMainWorkspace().getBlockById(block.dataset.id);
  // Keep jumping to the parent block until we find a non-shadow block.
  while (blocklyBlock && blocklyBlock.isShadow()) {
    blocklyBlock = blocklyBlock.getParent();
  }
  if (!blocklyBlock) {
    return;
  }

  const background = blocklyBlock.svgPath_;
  if (!background) {
    return;
  }

  const fill = window.getComputedStyle(background).getPropertyValue("fill");
  if (!fill) {
    return;
  }

  const border = window.getComputedStyle(background).getPropertyValue("stroke") || "#0003";
  const textColor = window.getComputedStyle(background).getPropertyValue("--sa-block-text-color") || "#fff";
  const hoverBg = window.getComputedStyle(background).getPropertyValue("--sa-block-secondary-color") || "#0001";

  widgetDiv.classList.add("u-contextmenu-colored");
  widgetDiv.style.setProperty("--u-contextmenu-bg", fill);
  widgetDiv.style.setProperty("--u-contextmenu-border", border);
  widgetDiv.style.setProperty("--u-contextmenu-text", textColor);
  widgetDiv.style.setProperty("--u-contextmenu-hover", hoverBg);
}
