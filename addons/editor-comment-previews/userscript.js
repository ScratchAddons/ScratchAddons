export default async function ({ addon, global, console }) {
  // Get traps
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const Blockly = await addon.tab.traps.getBlockly();

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

  // Listeners for regular blocks
  const isBlockElement = (element) => {
    if (
      (element.matches(".blocklyBlockCanvas g.blocklyDraggable") ||
        element.parentElement.matches(".blocklyBlockCanvas g.blocklyDraggable")) &&
      (element.querySelector(".blocklyIconGroup") !== null ||
        element.parentElement.querySelector(".blocklyIconGroup") !== null)
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

  document.addEventListener("mousemove", (e) => {
    let element = e.target.parentElement;
    const elementType = isBlockElement(element);
    if (elementType !== false) {
      if (elementType === "component") {
        element = element.parentElement;
      }
      const commentId = vm.editingTarget.blocks._blocks[element.getAttribute("data-id")].comment;
      const commentObject = vm.editingTarget.comments[commentId];
      if (!addon.self.disabled && addon.settings.get("hover-view-block") && commentObject.text !== "") {
        previewElement.style.left = e.pageX + 8 + "px";
        previewElement.style.top = e.pageY + 8 + "px";
        previewElement.innerText = commentObject.text;
        if (previewElement.innerText !== "") previewElement.classList.remove("sa-comment-preview-hidden");
      }
    }
  });

  document.addEventListener("mouseout", (e) => {
    const element = e.target.parentElement;
    if (isBlockElement(element)) {
      previewElement.classList.add("sa-comment-preview-hidden");
    }
  });

  document.addEventListener("mousedown", (e) => {
    const element = e.target.parentElement;
    if (isBlockElement(element)) {
      previewElement.classList.add("sa-comment-preview-hidden");
    }
  });
}
