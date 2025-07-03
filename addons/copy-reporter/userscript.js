export default async function ({ addon, console, msg }) {
  addon.tab.createEditorContextMenu(
    (ctx) => {
      const className = ctx.type === "monitor_large" ? "monitor_large-value" : "monitor_value";
      const element = ctx.target.querySelector(`[class*='${className}_']`);

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

  // https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/workspace_svg.js#L979
  // https://github.com/scratchfoundation/scratch-blocks/blob/2884131/src/block_reporting.ts
  function reportValue(id, value) {
    let workspace;
    if (ScratchBlocks.registry)
      workspace = addon.tab.traps.getWorkspace(); // new Blockly
    else workspace = this;

    let block = workspace.getBlockById(id) || workspace.getFlyout()?.getWorkspace().getBlockById(id);
    if (!block) {
      throw "Tried to report value on block that does not exist.";
    }

    ScratchBlocks.DropDownDiv.hideWithoutAnimation();
    ScratchBlocks.DropDownDiv.clearContent();

    let contentDiv = ScratchBlocks.DropDownDiv.getContentDiv();

    let valueReportBox = document.createElement("div");
    valueReportBox.setAttribute("class", "valueReportBox");
    valueReportBox.innerText = value;
    if (!addon.self.disabled) {
      // use to get focus and event priority
      valueReportBox.setAttribute("tabindex", "0");
      // if the user pressed Ctrl+C, prevent propagation to Blockly
      valueReportBox.onkeydown = (event) => {
        if ((event.altKey || event.ctrlKey || event.metaKey) && event.code === "KeyC") {
          event.stopPropagation();
        }
      };

      if (value.length !== 0) {
        const copyButton = document.createElement("img");
        copyButton.setAttribute("role", "button");
        copyButton.setAttribute("tabindex", "0");
        copyButton.setAttribute("draggable", false);
        copyButton.setAttribute("alt", msg("copy-to-clipboard"));
        copyButton.setAttribute("src", addon.self.dir + "/copy.svg");

        copyButton.classList.add("sa-copy-reporter-icon");
        addon.tab.displayNoneWhileDisabled(copyButton);

        copyButton.onclick = () => navigator.clipboard.writeText(value);
        valueReportBox.appendChild(copyButton);
      }
    }

    contentDiv.appendChild(valueReportBox);

    ScratchBlocks.DropDownDiv.setColour(
      ScratchBlocks.Colours?.valueReportBackground || "#FFFFFF",
      ScratchBlocks.Colours?.valueReportBorder || "#AAAAAA"
    );

    if (ScratchBlocks.registry) {
      // new Blockly
      let field;
      for (const input of block.inputList) {
        for (const f of input.fieldRow) {
          field = f;
          break;
        }
      }
      if (!field) return;
      ScratchBlocks.DropDownDiv.showPositionedByBlock(field, block);
    } else {
      ScratchBlocks.DropDownDiv.showPositionedByBlock(workspace, block);
    }
  }

  if (ScratchBlocks.registry) {
    // new Blockly
    const vm = addon.tab.traps.vm;
    for (const existingListener of vm.listeners("VISUAL_REPORT")) {
      vm.removeListener("VISUAL_REPORT", existingListener);
    }
    vm.on("VISUAL_REPORT", (data) => {
      reportValue(data.id, data.value);
    });
  } else {
    ScratchBlocks.WorkspaceSvg.prototype.reportValue = reportValue;
  }
}
