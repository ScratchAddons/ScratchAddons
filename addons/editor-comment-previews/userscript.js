export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const Blockly = await addon.tab.traps.getBlockly();
  console.log(Blockly);

  const previewElement = document.createElement("div");
  previewElement.classList.add("sa-comment-preview");
  previewElement.classList.add("sa-comment-preview-hidden");
  document.querySelector("body").appendChild(previewElement);

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
      } else if (mutation.target.matches("g.blocklyBlockCanvas")) {
        let target = mutation.addedNodes[0];
        while (target) {
          const hoverArea = target;
          if (mutation.removedNodes.length === 0) {
            hoverArea.addEventListener("mousemove", (e) => {
              if (hoverArea.querySelector(".blocklyIconGroup")) {
                const commentId = vm.editingTarget.blocks._blocks[hoverArea.getAttribute("data-id")].comment;
                const commentObject = vm.editingTarget.comments[commentId];
                if (!addon.self.disabled && addon.settings.get("hover-view-block") && commentObject.text !== "") {
                  previewElement.style.left = e.pageX + 8 + "px";
                  previewElement.style.top = e.pageY + 8 + "px";
                  previewElement.innerText = commentObject.text;
                  if (previewElement.innerText !== "") previewElement.classList.remove("sa-comment-preview-hidden");
                }
              }
            });
            hoverArea.addEventListener("mouseleave", (e) => {
              previewElement.classList.add("sa-comment-preview-hidden");
            });
            hoverArea.addEventListener("mousedown", (e) => {
              previewElement.classList.add("sa-comment-preview-hidden");
            });
            target = target.querySelector("g.blocklyDraggable");
          } else {
            previewElement.classList.add("sa-comment-preview-hidden");
            target = null;
          }
        }
      }
    });
  });
  const workspaceElement = await addon.tab.waitForElement('[class*="blocks_blocks"]');
  commentObserver.observe(workspaceElement, { childList: true, subtree: true });
}
