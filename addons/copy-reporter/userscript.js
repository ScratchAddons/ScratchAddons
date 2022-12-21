export default async function ({ addon, console, msg }) {
  addon.tab.createEditorContextMenu(
      (ctx) => {
        // ugly hack to get the string value
        let element = ctx.target.lastChild.lastChild;

        if (ctx.type === "monitor_slider") {
          element = element.children[element.children.length - 2].lastChild;
        } else {
          element = element.lastChild;
          if (ctx.type === "monitor_default") {
            element = element.lastChild;
          }
        }

        if (element.innerText.length !== 0) {
          navigator.clipboard.writeText(element.innerText);
        }
      },
      {
        className: "copy",
        types: ["monitor_default", "monitor_large", "monitor_slider"],
        position: "monitor",
        order: 0,
        label: msg("copy-value")
      });

  // add button to reporter bubble
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/workspace_svg.js#L979
  ScratchBlocks.WorkspaceSvg.prototype.reportValue = function(id, value) {
    let block = this.getBlockById(id);
    if (!block) {
      throw "Tried to report value on block that does not exist.";
    }

    ScratchBlocks.DropDownDiv.hideWithoutAnimation();
    ScratchBlocks.DropDownDiv.clearContent();

    let contentDiv = ScratchBlocks.DropDownDiv.getContentDiv();

    let valueReportBox = document.createElement("div");
    valueReportBox.setAttribute("class", "valueReportBox");
    valueReportBox.innerHTML = ScratchBlocks.scratchBlocksUtils.encodeEntities(value);
    valueReportBox.style.userSelect = "text";
    // use to get focus and event priority
    valueReportBox.setAttribute("tabindex", "0");
    // if the user pressed Ctrl+C, prevent propagation to Blockly
    valueReportBox.onkeydown = (event) => {
      if ((event.altKey || event.ctrlKey || event.metaKey) && event.keyCode == 67) {
        event.stopPropagation();
      }
    };

    if (value.length !== 0) {
      let copyButton = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      copyButton.setAttribute("role", "button");
      copyButton.setAttribute("tabindex", "0");
      copyButton.setAttribute("alt", msg("copy-to-clipboard"));
      copyButton.setAttribute("width", "14px");
      copyButton.setAttribute("height", "14px");
      copyButton.setAttribute("viewBox", "0 0 24 24");

      copyButton.style.cursor = "pointer";
      copyButton.style.float = "right";
      copyButton.style.display = "block";
      copyButton.style.userSelect = "none";

      copyButton.innerHTML = `<path fill="currentColor" d="M21 8.94a1.31 1.31 0 0 0-.06-.27v-.09a1.07 1.07 0 0 0-.19-.28l-6-6a1.07 1.07 0 0 0-.28-.19a.32.32 0 0 0-.09 0a.88.88 0 0 0-.33-.11H10a3 3 0 0 0-3 3v1H6a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1h1a3 3 0 0 0 3-3V8.94Zm-6-3.53L17.59 8H16a1 1 0 0 1-1-1ZM15 19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h1v7a3 3 0 0 0 3 3h5Zm4-4a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3v3a3 3 0 0 0 3 3h3Z"/>`;
      copyButton.onclick = () => navigator.clipboard.writeText(value);
      valueReportBox.appendChild(copyButton);
    }

    contentDiv.appendChild(valueReportBox);

    ScratchBlocks.DropDownDiv.setColour(ScratchBlocks.Colours.valueReportBackground, ScratchBlocks.Colours.valueReportBorder);
    ScratchBlocks.DropDownDiv.showPositionedByBlock(this, block);
  };
}
