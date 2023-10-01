import ThumbSetter from "../../libraries/common/cs/thumb-setter.js";
import dataURLToBlob from "../../libraries/common/cs/data-url-to-blob.js";
import { init, saveConfig, isOverwritingEnabled, blockOverwriting } from "./persistent-thumb.js";

export default async function ({ addon, console, msg }) {
  init(console);
  let projectId = location.href.match(/\d+/)?.[0];
  if (projectId) blockOverwriting(isOverwritingEnabled(projectId));
  const createModal = () => {
    // User Interface
    let ignoreClickOutside = false;
    const {
      backdrop,
      container,
      content,
      closeButton: headerCloseButton,
      remove,
    } = addon.tab.createModal(msg("set-thumbnail"), {
      isOpen: true,
    });
    container.classList.add("sa-animated-thumb-popup");
    content.classList.add("sa-animated-thumb-popup-content");
    content.appendChild(
      Object.assign(document.createElement("p"), {
        textContent: msg("description"),
        className: "sa-animated-thumb-text",
      })
    );
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
    content.appendChild(modalButtons);
    const stopOverwritingRow = Object.assign(document.createElement("p"), {
      className: "sa-animated-thumb-text",
    });
    const stopOverwritingCheckbox = Object.assign(document.createElement("input"), {
      type: "checkbox",
      checked: true,
      id: "sa-animated-thumb-stop-overwrite",
    });
    const stopOverwritingLabel = Object.assign(document.createElement("label"), {
      textContent: msg("keep-thumb"),
      htmlFor: "sa-animated-thumb-stop-overwrite",
    });
    stopOverwritingRow.appendChild(stopOverwritingCheckbox);
    stopOverwritingRow.appendChild(stopOverwritingLabel);
    content.appendChild(stopOverwritingRow);
    content.appendChild(
      Object.assign(document.createElement("p"), {
        textContent: msg("keep-thumb-desc"),
        className: "sa-animated-thumb-text",
      })
    );
    const modalResultArea = Object.assign(document.createElement("div"), {
      className: "sa-animated-thumb-popup-result",
      hidden: true,
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
            saveConfig(projectId, stopOverwritingCheckbox.checked);
          },
          (status) => {
            modalResultArea.hidden = false;
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
          }
        )
        .finally(() => {
          ignoreClickOutside = false;
          uploadFromFileButton.removeAttribute("disabled");
          uploadFromStageButton.removeAttribute("disabled");
        });

    const upload = () => {
      modalResultArea.className = "sa-animated-thumb-popup-result sa-animated-thumb-popup-result-none";
      uploadFromFileButton.setAttribute("disabled", "true");
      uploadFromStageButton.setAttribute("disabled", "true");
    };

    uploadFromFileButton.addEventListener("click", () => {
      upload();
      setter.addFileInput();
      ignoreClickOutside = true; // To stop modal from being closed
      setter.showInput();
    });
    uploadFromStageButton.addEventListener("click", () => {
      upload();
      addon.tab.traps.vm.postIOData("video", { forceTransparentPreview: true });
      addon.tab.traps.vm.renderer.requestSnapshot((dataURL) => {
        addon.tab.traps.vm.postIOData("video", { forceTransparentPreview: false });
        setter.upload(dataURLToBlob(dataURL));
      });
      addon.tab.traps.vm.renderer.draw();
    });
  };

  addon.tab.addEventListener("urlChange", () => {
    projectId = location.href.match(/\d+/)?.[0] || projectId;
    if (projectId) blockOverwriting(isOverwritingEnabled(projectId));
  });

  localStorage.removeItem("saAnimatedThumbShowTooltip");

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
