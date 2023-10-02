export const createEditorModal = (tab, title, { isOpen = false } = {}) => {
  const container = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_modal-overlay"),
    dir: tab.direction,
  });
  container.style.display = isOpen ? "" : "none";
  document.body.appendChild(container);
  const modal = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_modal-content"),
  });
  modal.addEventListener("click", (e) => e.stopPropagation());
  container.appendChild(modal);
  const header = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_header"),
  });
  modal.appendChild(header);
  header.appendChild(
    Object.assign(document.createElement("div"), {
      className: tab.scratchClass("modal_header-item", "modal_header-item-title"),
      innerText: title,
    })
  );
  const closeContainer = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_header-item", "modal_header-item-close"),
  });
  header.appendChild(closeContainer);
  const closeButton = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("close-button_close-button", "close-button_large"),
  });
  closeContainer.appendChild(closeButton);
  closeButton.appendChild(
    Object.assign(document.createElement("img"), {
      className: tab.scratchClass("close-button_close-icon"),
      src: import.meta.url + "/../../../images/cs/close-s3.svg",
    })
  );
  const content = Object.assign(document.createElement("div"), {
    className: "sa-editor-modal-content",
    style: `
      background-color: var(--editorDarkMode-accent, white);
      color: var(--editorDarkMode-accent-text, #575e75);
    `,
  });
  modal.appendChild(content);
  return {
    container: modal,
    content,
    backdrop: container,
    closeButton,
    open: () => {
      container.style.display = "";
    },
    close: () => {
      container.style.display = "none";
    },
    remove: container.remove.bind(container),
  };
};

export const createScratchWwwModal = (title, { isOpen = false, useSizesClass = true } = {}) => {
  const container = Object.assign(document.createElement("div"), {
    className: "modal-overlay",
  });
  container.style.display = isOpen ? "" : "none";
  if (isOpen) document.body.classList.add("overflow-hidden");
  document.body.appendChild(container);
  const modal = Object.assign(document.createElement("div"), {
    className: "modal-content",
    style: `
      overflow: hidden;
    `,
  });
  if (useSizesClass) modal.classList.add("modal-sizes");
  modal.addEventListener("click", (e) => e.stopPropagation());
  container.appendChild(modal);
  const closeButton = Object.assign(document.createElement("div"), {
    className: "modal-content-close",
  });
  modal.appendChild(closeButton);
  closeButton.appendChild(
    Object.assign(document.createElement("img"), {
      className: "modal-content-close-img",
      src: "/svgs/modal/close-x.svg",
    })
  );
  const header = Object.assign(document.createElement("div"), {
    className: "modal-header modal-title",
    style: `
      height: 3rem;
      box-sizing: border-box;
      padding-top: 0.75rem;
      background-color: var(--darkWww-navbar, #855cd6);
      box-shadow: 0 -1px 0 0 inset var(--darkWww-navbar-variant, #7854c0);
      color: var(--darkWww-navbar-text, white);
      text-align: center;
      font-weight: bold;
    `,
    innerText: title,
  });
  modal.appendChild(header);
  const content = Object.assign(document.createElement("div"), {
    className: "modal-inner-content",
  });
  modal.appendChild(content);
  return {
    container: modal,
    content,
    backdrop: container,
    closeButton,
    open: () => {
      container.style.display = "";
      document.body.classList.add("overflow-hidden");
    },
    close: () => {
      container.style.display = "none";
      document.body.classList.remove("overflow-hidden");
    },
    remove: () => {
      container.remove();
      document.body.classList.remove("overflow-hidden");
    },
  };
};

export const createScratchr2Modal = (title, { isOpen = false } = {}) => {
  const backdrop = Object.assign(document.createElement("div"), {
    className: "modal-backdrop fade hide",
  });
  document.body.appendChild(backdrop);
  const modal = Object.assign(document.createElement("div"), {
    className: "modal fade hide",
  });
  document.body.appendChild(modal);
  const header = Object.assign(document.createElement("div"), {
    className: "modal-header",
  });
  modal.appendChild(header);
  const closeButton = Object.assign(document.createElement("span"), {
    className: "close",
    innerText: "×",
  });
  header.appendChild(closeButton);
  header.appendChild(
    Object.assign(document.createElement("h3"), {
      innerText: title,
    })
  );
  const content = Object.assign(document.createElement("div"), {
    className: "modal-body",
  });
  modal.appendChild(content);
  const open = () => {
    backdrop.classList.remove("hide");
    modal.classList.remove("hide");
    setTimeout(() => {
      backdrop.classList.add("in");
      modal.classList.add("in");
    }, 0);
  };
  const close = () => {
    modal.classList.remove("in");
    setTimeout(() => {
      modal.classList.add("hide");
      backdrop.classList.remove("in");
      setTimeout(() => {
        backdrop.classList.add("hide");
      }, 300);
    }, 300);
  };
  if (isOpen) open();
  return {
    container: modal,
    content,
    backdrop,
    closeButton,
    open: open,
    close: close,
    remove: () => {
      close();
      setTimeout(() => {
        backdrop.remove();
        modal.remove();
      }, 900);
    },
  };
};

const createButtonRow = (tab, mode, { okButtonLabel, cancelButtonLabel } = {}) => {
  const buttonRow = Object.assign(document.createElement("div"), {
    className: {
      editor: tab.scratchClass("prompt_button-row"),
      "scratch-www": "action-buttons",
      scratchr2: "modal-footer",
    }[mode],
  });
  const cancelButton = Object.assign(document.createElement("button"), {
    className: { "scratch-www": "button action-button close-button white" }[mode] || "",
    innerText:
      cancelButtonLabel ||
      tab.scratchMessage(
        {
          editor: "gui.prompt.cancel",
          "scratch-www": "general.cancel",
          scratchr2: "Cancel",
        }[mode]
      ),
  });
  buttonRow.appendChild(cancelButton);
  const okButton = Object.assign(document.createElement("button"), {
    className: {
      editor: tab.scratchClass("prompt_ok-button"),
      "scratch-www": "button action-button submit-button",
    }[mode],
    innerText:
      okButtonLabel ||
      tab.scratchMessage(
        {
          editor: "gui.prompt.ok",
          "scratch-www": "general.okay",
          scratchr2: "OK",
        }[mode]
      ),
  });
  buttonRow.appendChild(okButton);
  return { buttonRow, cancelButton, okButton };
};

export const confirm = (tab, title, message, { useEditorClasses = false, okButtonLabel, cancelButtonLabel } = {}) => {
  const { remove, container, content, backdrop, closeButton } = tab.createModal(title, {
    isOpen: true,
    useEditorClasses: useEditorClasses,
    useSizesClass: true,
  });
  const mode = tab.editorMode !== null && useEditorClasses ? "editor" : tab.clientVersion;
  if (mode === "editor") {
    container.classList.add(tab.scratchClass("prompt_modal-content"));
    content.classList.add(tab.scratchClass("prompt_body"));
  }
  content.appendChild(
    Object.assign(document.createElement("div"), {
      className: { editor: tab.scratchClass("prompt_label") }[mode] || "",
      style: { "scratch-www": "margin: .9375rem 0.8275rem 0 .8275rem" }[mode] || "",
      innerText: message,
    })
  );
  const { buttonRow, cancelButton, okButton } = createButtonRow(tab, mode, {
    okButtonLabel,
    cancelButtonLabel,
  });
  if (mode === "scratchr2") container.appendChild(buttonRow);
  else content.appendChild(buttonRow);
  okButton.focus();
  return new Promise((resolve) => {
    const cancel = () => {
      remove();
      resolve(false);
    };
    const ok = () => {
      remove();
      resolve(true);
    };
    backdrop.addEventListener("click", cancel);
    closeButton.addEventListener("click", cancel);
    cancelButton.addEventListener("click", cancel);
    okButton.addEventListener("click", ok);
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ok();
      if (e.key === "Escape") cancel();
    });
  });
};

export const prompt = (tab, title, message, defaultValue = "", { useEditorClasses = false } = {}) => {
  const { remove, container, content, backdrop, closeButton } = tab.createModal(title, {
    isOpen: true,
    useEditorClasses: useEditorClasses,
    useSizesClass: true,
  });
  const mode = tab.editorMode !== null && useEditorClasses ? "editor" : tab.clientVersion;
  if (mode === "editor") {
    container.classList.add(tab.scratchClass("prompt_modal-content"));
    content.classList.add(tab.scratchClass("prompt_body"));
  }
  content.appendChild(
    Object.assign(document.createElement("div"), {
      className: { editor: tab.scratchClass("prompt_label") }[mode] || "",
      style: { "scratch-www": "margin: .9375rem 0.8275rem 1.125rem .8275rem" }[mode] || "",
      innerText: message,
    })
  );
  const input = Object.assign(document.createElement("input"), {
    className: { editor: tab.scratchClass("prompt_variable-name-text-input"), "scratch-www": "input" }[mode] || "",
    style:
      {
        "scratch-www": `
      width: calc(100% - 1.655rem);
      margin: 0 0.8275rem;
    `,
        scratchr2: "width: calc(100% - 10px)",
      }[mode] || "",
    value: defaultValue,
  });
  content.appendChild(input);
  input.focus();
  input.select();
  const { buttonRow, cancelButton, okButton } = createButtonRow(tab, mode);
  if (mode === "scratchr2") container.appendChild(buttonRow);
  else content.appendChild(buttonRow);
  return new Promise((resolve) => {
    const cancel = () => {
      remove();
      resolve(null);
    };
    const ok = () => {
      remove();
      resolve(input.value);
    };
    backdrop.addEventListener("click", cancel);
    closeButton.addEventListener("click", cancel);
    cancelButton.addEventListener("click", cancel);
    okButton.addEventListener("click", ok);
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ok();
      if (e.key === "Escape") cancel();
    });
  });
};
