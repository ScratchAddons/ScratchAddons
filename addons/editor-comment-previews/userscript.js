export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  const updateStyles = () => {
    previewInner.classList.toggle("sa-comment-preview-delay", addon.settings.get("delay") !== "none");
    previewInner.classList.toggle("sa-comment-preview-reduce-transparency", addon.settings.get("reduce-transparency"));
    previewInner.classList.toggle("sa-comment-preview-fade", !addon.settings.get("reduce-animation"));
  };

  const afterDelay = (cb) => {
    if (!previewInner.classList.contains("sa-comment-preview-hidden")) {
      // If not hidden, updating immediately is preferred
      cb();
      return;
    }
    const delay = addon.settings.get("delay");
    if (delay === "long") return setTimeout(cb, 500);
    if (delay === "short") return setTimeout(cb, 300);
    cb();
  };

  let hoveredElement = null;
  let showTimeout = null;
  let mouseX = 0;
  let mouseY = 0;
  let doNotShowUntilMoveMouse = false;

  const previewOuter = document.createElement("div");
  previewOuter.classList.add("sa-comment-preview-outer");
  const previewInner = document.createElement("div");
  previewInner.classList.add("sa-comment-preview-inner");
  previewInner.classList.add("sa-comment-preview-hidden");
  updateStyles();
  addon.settings.addEventListener("change", updateStyles);
  previewOuter.appendChild(previewInner);
  document.body.appendChild(previewOuter);

  const getBlock = (id) => vm.editingTarget.blocks.getBlock(id) || vm.runtime.flyoutBlocks.getBlock(id);
  const getComment = (block) => block && block.comment && vm.editingTarget.comments[block.comment];
  const getProcedureDefinitionBlock = (procCode) => {
    const procedurePrototype = Object.values(vm.editingTarget.blocks._blocks).find(
      (i) => i.opcode === "procedures_prototype" && i.mutation.proccode === procCode
    );
    if (procedurePrototype) {
      // Usually `parent` will exist but sometimes it doesn't
      if (procedurePrototype.parent) {
        return getBlock(procedurePrototype.parent);
      }
      const id = procedurePrototype.id;
      return Object.values(vm.editingTarget.blocks._blocks).find(
        (i) => i.opcode === "procedures_definition" && i.inputs.custom_block && i.inputs.custom_block.block === id
      );
    }
    return null;
  };

  const setText = (text) => {
    previewInner.innerText = text;
    previewInner.classList.remove("sa-comment-preview-hidden");
    updateMousePosition();
  };

  const updateMousePosition = () => {
    previewOuter.style.transform = `translate(${mouseX + 8}px, ${mouseY + 8}px)`;
  };

  const hidePreview = () => {
    if (hoveredElement) {
      hoveredElement = null;
      previewInner.classList.add("sa-comment-preview-hidden");
    }
  };

  document.addEventListener("mouseover", (e) => {
    if (addon.self.disabled) {
      return;
    }
    clearTimeout(showTimeout);
    if (doNotShowUntilMoveMouse) {
      return;
    }

    const el = e.target.closest(".blocklyBubbleCanvas > g, .blocklyBlockCanvas .blocklyDraggable[data-id]");
    if (el === hoveredElement) {
      // Nothing to do.
      return;
    }
    if (!el) {
      hidePreview();
      return;
    }

    let text = null;
    if (
      addon.settings.get("hover-view") &&
      e.target.closest(".blocklyBubbleCanvas > g") &&
      // Hovering over the thin line that connects comments to blocks should never show a preview
      !e.target.closest("line")
    ) {
      const collapsedText = el.querySelector("text.scratchCommentText");
      if (collapsedText.getAttribute("display") !== "none") {
        const textarea = el.querySelector("textarea");
        text = textarea.value;
      }
    } else if (e.target.closest(".blocklyBlockCanvas .blocklyDraggable[data-id]")) {
      const id = el.dataset.id;
      const block = getBlock(id);
      const comment = getComment(block);
      if (addon.settings.get("hover-view-block") && comment) {
        text = comment.text;
      } else if (block && block.opcode === "procedures_call" && addon.settings.get("hover-view-procedure")) {
        const procCode = block.mutation.proccode;
        const procedureDefinitionBlock = getProcedureDefinitionBlock(procCode);
        const procedureComment = getComment(procedureDefinitionBlock);
        if (procedureComment) {
          text = procedureComment.text;
        }
      }
    }

    if (text !== null && text.trim() !== "") {
      showTimeout = afterDelay(() => {
        hoveredElement = el;
        setText(text);
      });
    } else {
      hidePreview();
    }
  });

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    doNotShowUntilMoveMouse = false;
    if (addon.settings.get("follow-mouse") && !previewInner.classList.contains("sa-comment-preview-hidden")) {
      updateMousePosition();
    }
  });

  document.addEventListener(
    "mousedown",
    () => {
      hidePreview();
      doNotShowUntilMoveMouse = true;
    },
    {
      capture: true,
    }
  );
}
