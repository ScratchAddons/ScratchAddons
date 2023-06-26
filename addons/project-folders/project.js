export default async function ({ addon, console, msg }) {
  const createModal = () => {
    let instructions = document.querySelector(".inplace-textarea");
    let currentFolder = instructions.value.match(/#_.*/)?.[0]?.replace("#_", "") || "";
    // User Interface
    let ignoreClickOutside = false;
    const {
      backdrop,
      container,
      content,
      closeButton: headerCloseButton,
      remove,
    } = addon.tab.createModal(msg("add-to-folder"), {
      isOpen: true,
    });
    container.classList.add("sa-project-folder-popup");
    content.classList.add("sa-project-folder-popup-content");
    content.appendChild(
      Object.assign(document.createElement("p"), {
        textContent: msg("description"),
        className: "sa-project-folder-text",
      })
    );
    const input = Object.assign(document.createElement("input"), {
      className: "sa-project-folder-text input",
    });
    content.appendChild(input);
    input.value = currentFolder;

    // Logic

    let handleClickOutside;
    const closePopup = () => {
      remove();
    };
    const done = () => {
      instructions.value = instructions.value.replace(/[\n]{0,}#_.*/, "") + (input.value ? `\n#_${input.value}` : "");

      instructions.dispatchEvent(
        new Event("blur", {
          bubbles: true,
          cancelable: true,
        })
      );
      remove();
    };

    handleClickOutside = (e) => {
      if (ignoreClickOutside) return;
      closePopup();
    };
    backdrop.addEventListener("click", handleClickOutside);
    headerCloseButton.addEventListener("click", handleClickOutside);

    const buttonRow = Object.assign(document.createElement("div"), {
      className: "flex-row action-buttons sa-project-folder-popup-buttons",
    });
    const closeButton = Object.assign(document.createElement("button"), {
      textContent: msg("done"),
      className: "button action-button close-button white",
    });
    closeButton.addEventListener("click", done, { once: true });
    buttonRow.appendChild(closeButton);
    content.appendChild(buttonRow);
  };

  while (true) {
    await addon.tab.waitForElement(".flex-row.subactions > .flex-row.action-buttons", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    if (!document.querySelector(".form-group.project-title")) continue;
    const element = Object.assign(document.createElement("button"), {
      textContent: msg("add-to-folder"),
      className: "button action-button sa-set-thumbnail-button",
      title: msg("added-by"),
    });
    addon.tab.displayNoneWhileDisabled(element);
    element.addEventListener("click", () => createModal());
    addon.tab.appendToSharedSpace({
      space: "beforeProjectActionButtons",
      order: 0,
      element,
    });
  }
}
