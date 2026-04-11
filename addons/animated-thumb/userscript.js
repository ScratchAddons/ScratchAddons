import ThumbSetter from "../../libraries/common/cs/thumb-setter.js";

export default async function ({ addon, console, msg }) {
  let projectId = location.href.match(/\d+/)?.[0];
  const createModal = () => {
    // User Interface
    let ignoreClickOutside = false;
    const {
      backdrop,
      container,
      content,
      closeButton: headerCloseButton,
      open,
      remove,
    } = addon.tab.createModal(msg("set-thumbnail"), {
      isOpen: false,
      useEditorClasses: addon.tab.editorMode === "editor",
    });
    container.classList.add("sa-animated-thumb-popup");
    content.classList.add("sa-animated-thumb-popup-content");
    const modalResultArea = Object.assign(document.createElement("div"), {
      className: "sa-animated-thumb-result-failure hidden",
    });
    content.appendChild(modalResultArea);

    content.appendChild(
      Object.assign(document.createElement("p"), {
        textContent: msg("successful"),
        className: "sa-animated-thumb-text sa-animated-thumb-show-on-success",
      })
    );
    const thumbImage = Object.assign(document.createElement("img"), {
      alt: "",
      width: 320,
      height: 240,
    });
    const thumbImageWrapper = Object.assign(document.createElement("p"), {
      className: "sa-animated-thumb-show-on-success sa-animated-thumb-uploaded-thumb",
    });
    thumbImageWrapper.appendChild(thumbImage);
    content.appendChild(thumbImageWrapper);
    content.appendChild(
      Object.assign(document.createElement("p"), {
        textContent: msg("if-unsuccessful"),
        className: "sa-animated-thumb-text sa-animated-thumb-show-on-success",
      })
    );

    // Logic
    const setter = new ThumbSetter(null, (file) => {
      // Confirm for GIF files about animated files
      if (file.type === "image/gif" && !confirm(msg("gif"))) {
        return Promise.reject("Aborted");
      }
      return Promise.resolve();
    });
    let handleClickOutside;
    const closePopup = () => {
      setter.removeFileInput();
      remove();
    };
    handleClickOutside = (e) => {
      if (ignoreClickOutside) return;
      closePopup();
    };
    backdrop.addEventListener("click", handleClickOutside);
    headerCloseButton.addEventListener("click", handleClickOutside);

    const buttonRow = Object.assign(document.createElement("div"), {
      className: "flex-row action-buttons sa-animated-thumb-popup-buttons",
    });
    const closeButton = Object.assign(document.createElement("button"), {
      textContent: msg("close"),
      className: "button action-button close-button white",
    });
    closeButton.addEventListener("click", closePopup, { once: true });
    buttonRow.appendChild(closeButton);
    content.appendChild(buttonRow);

    setter.onFinished = (promise) =>
      promise
        .then(
          (canceled) => {
            if (canceled) return;
            thumbImage.src = `https://uploads.scratch.mit.edu/get_image/project/${projectId}_480x360.png?nocache=${Date.now()}`;
            content.classList.add("sa-animated-thumb-successful");
            open();
          },
          (status) => {
            modalResultArea.classList.remove("hidden");
            switch (status) {
              case 503:
              case 500:
                modalResultArea.textContent = msg("server-error");
                break;
              case 413:
                modalResultArea.textContent = msg("too-big");
                break;
              default:
                modalResultArea.textContent = msg("error");
            }
            open();
          }
        )
        .finally(() => {
          ignoreClickOutside = false;
        });

    const upload = () => {
      modalResultArea.classList.add("hidden");
    };

    const uploadFromFile = () => {
      upload();
      setter.addFileInput();
      ignoreClickOutside = true; // To stop modal from being closed
      setter.showInput();
    };
    uploadFromFile();
  };

  let dropdownContainer = null;
  let uploadButton = null;

  const closeDropdown = () => {
    if (!uploadButton) return;
    uploadButton.remove();
    uploadButton = null;
  };

  const toggleDropdown = (parent) => {
    if (uploadButton) {
      closeDropdown();
      return;
    }
    uploadButton = Object.assign(document.createElement("button"), {
      className: addon.tab.scratchClass("button_outlined-button", {
        others: "sa-set-thumbnail-upload-button",
      }),
      textContent: msg("dropdown-upload"),
      title: msg("added-by"),
    });
    uploadButton.insertBefore(
      Object.assign(document.createElement("img"), {
        src: addon.self.dir + "/upload.svg",
      }),
      uploadButton.firstChild
    );
    uploadButton.addEventListener("click", (e) => {
      e.stopPropagation();
      createModal();
    });
    parent.appendChild(uploadButton);
    document.addEventListener("click", () => closeDropdown(), { once: true });
  };

  const addDropdown = (setThumbnailButton) => {
    // Add class to parent so that it doesn't get overridden by Scratch
    setThumbnailButton.parentElement.classList.add("sa-has-dropdown");
    dropdownContainer = Object.assign(document.createElement("div"), {
      className: "sa-set-thumbnail-dropdown-container",
    });
    const dropdownButton = Object.assign(document.createElement("button"), {
      className: addon.tab.scratchClass(
        "button_outlined-button",
        addon.tab.editorMode === "editor" ? "stage-header_stage-button" : "",
        { others: "sa-set-thumbnail-dropdown-button" }
      ),
    });
    dropdownButton.appendChild(
      Object.assign(document.createElement("img"), {
        src:
          addon.tab.editorMode === "editor"
            ? "/static/blocks-media/default/dropdown-arrow-dark.svg"
            : "/static/blocks-media/default/dropdown-arrow.svg",
        draggable: false,
      })
    );
    dropdownButton.addEventListener("click", (e) => {
      toggleDropdown(dropdownContainer);
      e.stopPropagation();
    });
    dropdownContainer.appendChild(dropdownButton);
    addon.tab.displayNoneWhileDisabled(dropdownContainer);
    addon.tab.appendToSharedSpace({
      space: "stageHeader",
      order: -1,
      element: dropdownContainer,
    });
  };

  await addon.tab.redux.waitForState((state) => state.scratchGui.projectState.loadingState === "SHOWING_WITH_ID");
  while (true) {
    await addon.tab.waitForElement(
      // Full screen button
      // (need an element that's recreated every time when entering/exiting full screen)
      '[class*="stage-header_right"] > [class*="button_outlined-button_"]:last-child, [class*="stage-header_unselect-wrapper_"] > [class*="button_outlined-button_"]',
      {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "scratch-gui/mode/SET_FULL_SCREEN",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
        ],
      }
    );
    const setThumbnailButton = document.querySelector(
      `
        [class*="stage-header_stage-size-row_"] > [class*="stage-header_stage-button_"]:first-child,
        [class*="stage-header_rightSection_"] > [class*="stage-header_setThumbnailButton_"]
      `,
      { markAsSeen: true }
    );
    if (dropdownContainer) {
      dropdownContainer.remove();
      dropdownContainer = null;
    }
    if (setThumbnailButton) {
      addDropdown(setThumbnailButton);
    }
  }
}
