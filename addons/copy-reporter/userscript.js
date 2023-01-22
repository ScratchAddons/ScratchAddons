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
      label: msg("copy-value"),
    }
  );

  // add button to reporter bubble
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  // https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/workspace_svg.js#L979
  ScratchBlocks.WorkspaceSvg.prototype.reportValue = function (id, value) {
    let block = this.getBlockById(id);
    if (!block) {
      throw "Tried to report value on block that does not exist.";
    }

    ScratchBlocks.DropDownDiv.hideWithoutAnimation();
    ScratchBlocks.DropDownDiv.clearContent();

    let contentDiv = ScratchBlocks.DropDownDiv.getContentDiv();

    let valueReportBox = document.createElement("div");
    valueReportBox.setAttribute("class", "valueReportBox");
    valueReportBox.innerText = value;
    // use to get focus and event priority
    valueReportBox.setAttribute("tabindex", "0");
    // if the user pressed Ctrl+C, prevent propagation to Blockly
    valueReportBox.onkeydown = (event) => {
      if ((event.altKey || event.ctrlKey || event.metaKey) && event.key === "c") {
        event.stopPropagation();
      }
    };

    if (value.length !== 0) {
      const copyButton = document.createElement("img");
      copyButton.setAttribute("role", "button");
      copyButton.setAttribute("tabindex", "0");
      copyButton.setAttribute("alt", msg("copy-to-clipboard"));
      // cannot be done in CSS because of a bug
      copyButton.setAttribute("width", "14px");
      copyButton.setAttribute("height", "14px");
      copyButton.setAttribute("src", addon.self.dir + "/copy.svg");

      copyButton.classList.add("copy-reporter-icon");

      copyButton.onclick = () => navigator.clipboard.writeText(value);
      valueReportBox.appendChild(copyButton);
    }

    contentDiv.appendChild(valueReportBox);

    ScratchBlocks.DropDownDiv.setColour(
      ScratchBlocks.Colours.valueReportBackground,
      ScratchBlocks.Colours.valueReportBorder
    );
    ScratchBlocks.DropDownDiv.showPositionedByBlock(this, block);
  };
}
