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
  if (vm.editingTarget) vm.emitWorkspaceUpdate();
  const flyout = await workspace.getFlyout();
  const flyoutWorkspace = flyout.getWorkspace();
  Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.workspaceToDom(flyoutWorkspace), flyoutWorkspace);
  workspace.getToolbox().refreshSelection();
  workspace.toolboxRefreshEnabled_ = true;

  // Create comment preview element (initially hidden)
  const previewElement = document.createElement("div");
  previewElement.classList.add("sa-comment-preview");
  previewElement.classList.add("sa-comment-preview-hidden");
  document.querySelector("body").appendChild(previewElement);
  setAppearance();
  addon.settings.addEventListener("change", setAppearance);

  /** Tracks the text content of the comment associated with what the mouse is hovered over. */
  let mouseOver = null;

  /**
   * When the mouse enters a new element, check if that element is a collapsed comment, a block with a comment attached,
   * or a custom block with a definition that has a comment attached.
   * If so, then show the comment preview element.
   * If not, then dismiss the comment preview element.
   */
  document.addEventListener("mouseover", (e) => {
    if (!addon.self.disabled) {
      /** The element with which this `mouseover` event is concerned. */
      let element = e.target.parentElement;
      const elementType = isBlockElement(element);
      if (elementType !== false) {
        if (elementType === "comment") {
          // If the element is a collapsed comment
          if (
            addon.settings.get("hover-view") &&
            element.querySelector("text.scratchCommentText") &&
            element.querySelector("text.scratchCommentText").getAttribute("display") === null &&
            element.querySelector("text.scratchCommentText").innerText !== ""
          ) {
            setPreview(element.querySelector("textarea").value);
          }
        } else {
          // Ensure that `element` is a block at this point
          if (elementType === "component") element = element.parentElement;
          // Find this exact block instance in the database (checks both workspace and flyout)
          let blocks;
          if (element.matches(".blocklyFlyout *")) blocks = flyout.workspace_.blockDB_;
          else blocks = vm.editingTarget.blocks._blocks;
          let block = blocks[element.getAttribute("data-id")];
          if (block) {
            // Find this block's comment in the VM, or figure out that it doesn't have one
            const comments = vm.editingTarget.comments;
            let commentObject = comments[block.comment];
            if (commentObject && commentObject.text === "") {
              // If the comment exists but is blank, don't show a preview
              previewElement.classList.add("sa-comment-preview-hidden");
              mouseOver = null;
            } else if (commentObject && addon.settings.get("hover-view-block")) {
              // If the comment exists and block comment previews are enabled, show the preview
              // (overrides any definition comments)
              setPreview(commentObject.text);
            } else if (
              addon.settings.get("hover-view-procedure") &&
              (block.opcode === "procedures_call" || block.procCode_)
            ) {
              // The block doesn't have its own comment, but if it's a custom block,
              // check if the definition block has one using VM shenanigans
              let blockName;
              if (block.mutation) blockName = block.mutation.proccode;
              else blockName = block.procCode_;
              const blockEntry = Object.entries(vm.editingTarget.blocks._blocks).find((i) => {
                return i[1].opcode === "procedures_prototype" && i[1].mutation.proccode === blockName;
              });
              if (!blockEntry) {
                // Orphaned blocks/debugger blocks do not have definition
                previewElement.classList.add("sa-comment-preview-hidden");
                mouseOver = null;
                return;
              }
              const prototypeBlock = vm.editingTarget.blocks._blocks[blockEntry[0]];
              const definitionBlock = vm.editingTarget.blocks._blocks[prototypeBlock.parent];
              commentObject = comments[definitionBlock.comment];
              if (commentObject && commentObject.text !== "") {
                // If the comment exists and isn't blank, show the preview
                setPreview(commentObject.text);
              } else {
                // Since no comment was found to display, dismiss the preview
                previewElement.classList.add("sa-comment-preview-hidden");
                mouseOver = null;
              }
            } else {
              // Definition comment previews are disabled, so since no block comment was found, dismiss the preview
              previewElement.classList.add("sa-comment-preview-hidden");
              mouseOver = null;
            }
          }
        }
      } else {
        // The currently hovered element is not a block or comment, so dismiss the preview
        previewElement.classList.add("sa-comment-preview-hidden");
        mouseOver = null;
      }
    }
  });

  /**
   * When the mouse moves, if the comment preview is visible, update its position.
   */
  document.addEventListener("mousemove", (e) => {
    if (
      !addon.self.disabled &&
      (addon.settings.get("follow-mouse") === true ||
        (previewElement.classList.contains("sa-comment-preview-hidden") &&
          window.getComputedStyle(previewElement).opacity < 0.001))
    ) {
      previewElement.style.left = e.clientX + 8 + "px";
      previewElement.style.top = e.clientY + 8 + "px";
    }
  });

  /**
   * When the mouse is clicked, dismiss the comment preview.
   */
  document.addEventListener("click", () => {
    previewElement.classList.add("sa-comment-preview-hidden");
    mouseOver = null;
  });

  /**
   * Calculates the block/comment type of an element.
   * @param element An element from the `document`.
   * @returns `block` if the element is a block, `component` if the element is a component of a block (such as text or
   * an icon), `comment` if the element is a comment, and `false` if the element is none of the above.
   */
  function isBlockElement(element) {
    if (
      element &&
      (element.matches(".blocklyBlockCanvas g.blocklyDraggable") ||
        element.matches(".blocklyBlockCanvas g.blocklyDraggable *") ||
        element.matches("g.blocklyBubbleCanvas *"))
    ) {
      if (element.matches("g.blocklyBubbleCanvas *")) {
        // We are directly hovering over a comment
        return "comment";
      } else if (element.matches(".blocklyBlockCanvas g.blocklyDraggable")) {
        // We are directly hovering over one of the block's elements
        return "block";
      } else {
        // We are hovering over an icon or numeric input nested inside one of the block's elements
        return "component";
      }
    } else {
      // We aren't hovering over a block or a comment
      return false;
    }
  }

  /**
   * Shows the comment preview element after the delay specified in the settings.
   * @param text The text to display in the comment preview.
   */
  function setPreview(text) {
    // Set the delay time, if any
    let timeout;
    if (addon.settings.get("delay") === "long") timeout = 500;
    else if (addon.settings.get("delay") === "short") timeout = 300;
    else timeout = 0;
    // Set the comment preview's contents and track them
    previewElement.innerText = text;
    mouseOver = text;
    setTimeout(() => {
      // Ensures that the element the mouse is hovering AFTER the delay has not changed
      if (mouseOver === text) {
        previewElement.classList.remove("sa-comment-preview-hidden");
      }
    }, timeout);
  }

  /**
   * Reads the addon settings, then sets the delay, transparency, and fade effects of the comment preview by setting
   * the corresponding CSS classes on the comment preview element.
   */
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
}
