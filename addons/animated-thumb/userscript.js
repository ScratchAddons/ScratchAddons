import ThumbSetter from "../../libraries/common/cs/thumb-setter.js";
import dataURLToBlob from "../../libraries/common/cs/data-url-to-blob.js";

export default async function ({ addon, console, msg }) {
  let projectId = location.href.match(/\d+/)?.[0];
  const createModal = ({
    skipFirstStep = false, // if true, open file selection dialog immediately
  } = {}) => {
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
      isOpen: !skipFirstStep,
    });
    container.classList.add("sa-animated-thumb-popup");
    content.classList.add("sa-animated-thumb-popup-content");
    if (!skipFirstStep) {
      content.appendChild(
        Object.assign(document.createElement("p"), {
          textContent: msg("description"),
          className: "sa-animated-thumb-text",
        })
      );
    }
    const modalButtons = Object.assign(document.createElement("div"), {
      className: "flex-row action-buttons sa-animated-thumb-popup-actions",
    });
    const uploadFromFileButton = Object.assign(document.createElement("button"), {
      textContent: msg("select-file"),
      className: "button action-button sa-animated-thumb-popup-action",
    });
    const uploadFromStageButton = Object.assign(document.createElement("button"), {
      textContent: msg("use-stage"),
      className: "button action-button sa-animated-thumb-popup-action",
    });
    modalButtons.appendChild(uploadFromFileButton);
    modalButtons.appendChild(uploadFromStageButton);
    if (!skipFirstStep) content.appendChild(modalButtons);
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
            if (skipFirstStep) open();
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
            if (skipFirstStep) open();
          }
        )
        .finally(() => {
          ignoreClickOutside = false;
          uploadFromFileButton.removeAttribute("disabled");
          uploadFromFileButton.classList.remove("loading");
          uploadFromStageButton.removeAttribute("disabled");
          uploadFromStageButton.classList.remove("loading");
        });

    const upload = () => {
      modalResultArea.classList.add("hidden");
      uploadFromFileButton.setAttribute("disabled", "true");
      uploadFromStageButton.setAttribute("disabled", "true");
    };

    const uploadFromFile = () => {
      upload();
      setter.addFileInput();
      ignoreClickOutside = true; // To stop modal from being closed
      setter.showInput();
    };
    if (skipFirstStep) uploadFromFile();
    uploadFromFileButton.addEventListener("click", (e) => {
      uploadFromFileButton.classList.add("loading");
      uploadFromFile();
    });
    uploadFromStageButton.addEventListener("click", (e) => {
      uploadFromStageButton.classList.add("loading");
      upload();
      addon.tab.traps.vm.postIOData("video", { forceTransparentPreview: true });
      addon.tab.traps.vm.renderer.requestSnapshot((dataURL) => {
        addon.tab.traps.vm.postIOData("video", { forceTransparentPreview: false });
        setter.upload(dataURLToBlob(dataURL));
      });
      addon.tab.traps.vm.renderer.draw();
    });
  };

  await addon.tab.waitForElement(".guiPlayer [class*='stage-header_stage-size-row_']", {
    reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
  });
  if (document.querySelector("[class*='stage-header_setThumbnailButton_']")) {
    // Scratch update

    let uploadButton = null;
    let tooltip = null;

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
        className: addon.tab.scratchClass("button_outlined-button", "stage-header_setThumbnailButton", {
          others: "sa-set-thumbnail-upload-button",
        }),
        textContent: msg("dropdown-upload"),
        title: msg("added-by"),
      });
      uploadButton.insertBefore(
        Object.assign(document.createElement("img"), {
          // src: addon.self.dir + "/upload.svg"
          src: addon.self.dir + "../../../images/cs/icon.svg",
        }),
        uploadButton.firstChild
      );
      uploadButton.addEventListener("click", (e) => {
        e.stopPropagation();
        createModal({ skipFirstStep: true });
      });
      parent.appendChild(uploadButton);
      document.addEventListener("click", () => closeDropdown(), { once: true });
    };

    while (true) {
      const setThumbnailButton = await addon.tab.waitForElement("[class*='stage-header_setThumbnailButton_']", {
        markAsSeen: true,
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
        reduxEvents: ["scratch-gui/mode/SET_PLAYER", "scratch-gui/mode/SET_FULL_SCREEN"],
      });
      setThumbnailButton.classList.add("sa-has-dropdown");
      const dropdownContainer = Object.assign(document.createElement("div"), {
        className: "sa-set-thumbnail-dropdown-container",
      });
      const dropdownButton = Object.assign(document.createElement("button"), {
        className: "sa-set-thumbnail-dropdown-button",
      });
      dropdownButton.appendChild(
        Object.assign(document.createElement("img"), {
          src: "/static/blocks-media/default/dropdown-arrow.svg",
          draggable: false,
        })
      );
      dropdownButton.addEventListener("click", (e) => {
        if (document.querySelector(".tooltip-set-thumbnail")) {
          // User hasn't clicked Set Thumbnail yet. Show the modal.
          setThumbnailButton.click();
        } else {
          if (tooltip) {
            tooltip.remove();
            localStorage.setItem("saAnimatedThumbHideDropdownTooltip", "1");
          }
          toggleDropdown(dropdownContainer);
          e.stopPropagation();
        }
      });
      dropdownContainer.appendChild(dropdownButton);
      addon.tab.displayNoneWhileDisabled(dropdownContainer);
      addon.tab.appendToSharedSpace({
        space: "stageHeader",
        order: -1,
        element: dropdownContainer,
      });

      if (!localStorage.getItem("saAnimatedThumbHideDropdownTooltip")) {
        tooltip = Object.assign(document.createElement("div"), {
          className: "validation-message validation-info sa-animated-thumb-tooltip",
          textContent: msg("info-tooltip"),
        });
        dropdownContainer.appendChild(tooltip);
      }

      addon.tab
        .waitForElement(".tooltip-set-thumbnail", {
          reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
        })
        .then(() => {
          // Remove the tooltip
          if (tooltip) {
            tooltip.remove();
            localStorage.setItem("saAnimatedThumbHideDropdownTooltip", "1");
          }

          // Add message to the Set Thumbnail modal when it's opened instead
          addon.tab
            .waitForElement(".update-thumbnail-info-modal-inner", {
              reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
            })
            .then((infoContent) => {
              const message = Object.assign(document.createElement("div"), {
                className: "sa-set-thumbnail-info-box",
              });
              message.appendChild(
                Object.assign(document.createElement("div"), {
                  className: "sa-set-thumbnail-info-box-title",
                  textContent: msg("/_general/meta/message-from-sa"),
                })
              );
              message.appendChild(document.createTextNode(msg("info-box")));
              infoContent.insertBefore(message, infoContent.lastChild);
            });
        });
    }
  } else {
    while (true) {
      await addon.tab.waitForElement(".flex-row.subactions > .flex-row.action-buttons", {
        markAsSeen: true,
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      });
      if (!document.querySelector(".form-group.project-title")) continue;
      const element = Object.assign(document.createElement("button"), {
        textContent: msg("set-thumbnail"),
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
}
