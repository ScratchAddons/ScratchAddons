export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;

  const updateStyles = () => {
    previewElement.classList.toggle('sa-comment-preview-delay', addon.settings.get('delay') !== 'none');
    previewElement.classList.toggle('sa-comment-preview-reduce-transparency', addon.settings.get('reduce-transparency'));
    previewElement.classList.toggle('sa-comment-preview-fade', !addon.settings.get('reduce-animation'));
  };

  const afterDelay = (cb) => {
    if (!previewElement.classList.contains('sa-comment-preview-hidden')) {
      // If not hidden, updating immediately is preferred
      cb();
      return;
    }
    const delay = addon.settings.get("delay");
    if (delay === 'long') return setTimeout(cb, 500);
    if (delay === 'short') return setTimeout(cb, 300);
    cb();
  };

  let hoveredElement = null;
  let showTimeout = null;
  let mouseX = 0;
  let mouseY = 0;
  let doNotShowUntilMoveMouse = false;

  const previewElement = document.createElement("div");
  previewElement.classList.add("sa-comment-preview");
  previewElement.classList.add("sa-comment-preview-hidden");
  updateStyles();
  addon.settings.addEventListener("change", updateStyles);
  document.body.appendChild(previewElement);

  const getBlockAndComment = (id) => {
    const block = vm.editingTarget.blocks.getBlock(id) || vm.runtime.flyoutBlocks.getBlock(id);
    const comment = block && block.comment && vm.editingTarget.comments[block.comment];
    return {
      block,
      comment
    };
  };

  const setText = (text) => {
    previewElement.innerText = text;
    previewElement.classList.remove('sa-comment-preview-hidden');
    updateMousePosition();
  };

  const updateMousePosition = () => {
    previewElement.style.top = `${mouseY + 8}px`;
    previewElement.style.left = `${mouseX + 8}px`;
  };

  const hidePreview = () => {
    if (hoveredElement) {
      hoveredElement = null;
      previewElement.classList.add('sa-comment-preview-hidden');
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

    let el = null;
    let text = null;
    if (addon.settings.get("hover-view") && (el = e.target.closest('.blocklyBubbleCanvas g'))) {
      const collapsedText = el.querySelector('text.scratchCommentText');
      if (collapsedText.getAttribute('display') !== 'none') {
        const textarea = el.querySelector('textarea');
        text = textarea.value;
      }
    } else if ((el = e.target.closest('.blocklyBlockCanvas .blocklyDraggable[data-id]'))) {
      const id = el.dataset.id;
      const {block, comment} = getBlockAndComment(id);
      if (addon.settings.get("hover-view-block") && comment) {
        text = comment.text;
      } else if (block && block.opcode === 'procedures_call' && addon.settings.get("hover-view-procedure")) {
        const procCode = block.mutation.proccode;
        const procedurePrototype = Object.values(vm.editingTarget.blocks._blocks).find((i) => {
          return i.opcode === "procedures_prototype" && i.mutation.proccode === procCode;
        });
        const procedureDefinition = procedurePrototype && procedurePrototype.parent;
        const procedureComment = getBlockAndComment(procedureDefinition).comment;
        if (procedureComment) {
          text = procedureComment.text;
        }
      }
    }

    if (hoveredElement !== el) {
      if (text !== null && text.trim() !== '') {
        showTimeout = afterDelay(() => {
          hoveredElement = el;
          setText(text);
        });
      } else {
        hidePreview();
      }
    }
  });

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    doNotShowUntilMoveMouse = false;
    if (addon.settings.get("follow-mouse")) {
      updateMousePosition();
    }
  });

  document.addEventListener("mousedown", () => {
    hidePreview();
    doNotShowUntilMoveMouse = true;
  }, {
    capture: true
  });
}
