/**
 * TO-DO:
 * - Refactor collapsed comment previews
 * - Clean up everything
 * - Fix block-to-block bug
 */
export default async function ({ addon, global, console }) {
  // Get VM
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });

  // Get Blockly and handle flyout safely
  const Blockly = await addon.tab.traps.getBlockly();
  const workspace = await Blockly.getMainWorkspace();
  if (vm.editingTarget) {
    vm.emitWorkspaceUpdate();
  }
  const flyout = await workspace.getFlyout();
  const flyoutWorkspace = flyout.getWorkspace();
  Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.workspaceToDom(flyoutWorkspace), flyoutWorkspace);
  workspace.getToolbox().refreshSelection();
  workspace.toolboxRefreshEnabled_ = true;

  // Create preview element (initially hidden)
  const previewElement = document.createElement("div");
  previewElement.classList.add("sa-comment-preview");
  previewElement.classList.add("sa-comment-preview-hidden");
  document.querySelector("body").appendChild(previewElement);

  // Listeners for collapsed comments
  const commentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.matches("g.blocklyBubbleCanvas")) {
        if (mutation.removedNodes.length === 0) {
          const hoverArea = mutation.addedNodes[0];
          hoverArea.addEventListener("mousemove", (e) => {
            if (
              !addon.self.disabled &&
              addon.settings.get("hover-view") &&
              hoverArea.querySelector("text.scratchCommentText").getAttribute("display") === null &&
              hoverArea.querySelector("text.scratchCommentText").innerText !== ""
            ) {
              previewElement.style.left = e.pageX + 8 + "px";
              previewElement.style.top = e.pageY + 8 + "px";
              previewElement.innerText = hoverArea.querySelector("textarea").value;
              if (previewElement.innerText !== "") previewElement.classList.remove("sa-comment-preview-hidden");
            }
          });
          hoverArea.addEventListener("mouseleave", (e) => {
            previewElement.classList.add("sa-comment-preview-hidden");
          });
          hoverArea.querySelector("image").addEventListener("mouseup", (e) => {
            previewElement.classList.add("sa-comment-preview-hidden");
          });
        } else {
          previewElement.classList.add("sa-comment-preview-hidden");
        }
      }
    });
  });
  const workspaceElement = await addon.tab.waitForElement('[class*="blocks_blocks"]');
  commentObserver.observe(workspaceElement, { childList: true, subtree: true });

  // Listeners for blocks
  let mouseOver = false;
  let mouseOverBlock = null;
  const isBlockElement = (element) => {
    if (
      element &&
      (element.matches(".blocklyBlockCanvas g.blocklyDraggable") ||
        element.parentElement.matches(".blocklyBlockCanvas g.blocklyDraggable"))
    ) {
      if (element.matches(".blocklyBlockCanvas g.blocklyDraggable")) {
        // We are directly hovering over one of the block's elements
        return "block";
      } else {
        // We are hovering over an icon or numeric input nested inside one of the block's elements
        return "component";
      }
    } else {
      return false;
    }
  };

  document.addEventListener("mouseover", (e) => {
    if (!addon.self.disabled) {
      let element = e.target.parentElement;
      const elementType = isBlockElement(element);
      if (mouseOver === false) {
        if (addon.settings.get("hover-view-block") || addon.settings.get("hover-view-procedure")) {
          if (elementType !== false) {
            if (elementType === "component") {
              element = element.parentElement;
            }
            let blocks;
            if (element.matches(".blocklyFlyout *")) {
              blocks = flyout.workspace_.blockDB_;
            } else {
              blocks = vm.editingTarget.blocks._blocks;
            }
            let block = blocks[element.getAttribute("data-id")];
            if (block) {
              const comments = vm.editingTarget.comments;
              let commentObject = comments[block.comment];
              if (addon.settings.get("hover-view-block") && commentObject && commentObject.text !== "") {
                mouseOverBlock = block.id;
                setPreview(e, commentObject, previewElement);
              } else if (
                addon.settings.get("hover-view-procedure") &&
                (block.opcode === "procedures_call" || block.procCode_)
              ) {
                let blockName;
                if (block.mutation) blockName = block.mutation.proccode;
                else blockName = block.procCode_;
                const prototypeBlock =
                  vm.editingTarget.blocks._blocks[
                    Object.entries(vm.editingTarget.blocks._blocks).find((i) => {
                      return i[1].opcode === "procedures_prototype" && i[1].mutation.proccode === blockName;
                    })[0]
                  ];
                const definitionBlock = vm.editingTarget.blocks._blocks[prototypeBlock.parent];
                commentObject = comments[definitionBlock.comment];
                if (commentObject.text !== "") {
                  mouseOverBlock = block.id;
                  setPreview(e, commentObject, previewElement);
                }
              }
            }
          }
        }
      } else if (elementType === false) {
        previewElement.classList.add("sa-comment-preview-hidden");
        mouseOver = false;
        mouseOverBlock = null;
      }
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (
      !addon.self.disabled &&
      (addon.settings.get("delay") === "none" ||
        (previewElement.classList.contains("sa-comment-preview-hidden") &&
          window.getComputedStyle(previewElement).opacity < 0.001))
    ) {
      previewElement.style.left = e.pageX + 8 + "px";
      previewElement.style.top = e.pageY + 8 + "px";
    }
    if (e.target === previewElement) previewElement.classList.add("sa-comment-preview-hidden");
  });

  function setPreview(e, comment, element) {
    let timeout;
    if (addon.settings.get("delay") === "long") timeout = 500;
    else if (addon.settings.get("delay") === "short") timeout = 300;
    else timeout = 0;
    mouseOver = true;
    element.innerText = comment.text;
    setTimeout(() => {
      if (element.innerText !== "" && mouseOver) {
        element.classList.remove("sa-comment-preview-hidden");
      }
    }, timeout);
  }

  document.addEventListener("click", (e) => {
    previewElement.classList.add("sa-comment-preview-hidden");
    mouseOver = false;
    mouseOverBlock = null;
  });

  function setAppearance() {
    if (addon.settings.get("delay") === "none") {
      previewElement.classList.remove("sa-comment-preview-delay");
    } else {
      previewElement.classList.add("sa-comment-preview-delay");
    }
    if (addon.settings.get("reduce-transparency")) {
      previewElement.classList.add("sa-comment-preview-reduce-transparency");
    } else {
      previewElement.classList.remove("sa-comment-preview-reduce-transparency");
    }
    if (addon.settings.get("reduce-animation")) {
      previewElement.classList.remove("sa-comment-preview-fade");
    } else {
      previewElement.classList.add("sa-comment-preview-fade");
    }
  }

  setAppearance();

  addon.settings.addEventListener("change", setAppearance);
}
