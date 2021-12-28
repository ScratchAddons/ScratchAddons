import ThumbSetter from "../../libraries/common/cs/thumb-setter.js";
import dataURLToBlob from "../../libraries/common/cs/data-url-to-blob.js";
import { init, saveConfig, isOverwritingEnabled, blockOverwriting } from "./persistent-thumb.js";

export default async function ({ addon, global, console, msg }) {
  init(console);
  let projectId = location.href.match(/\d+/)[0];
  blockOverwriting(isOverwritingEnabled(projectId));
  const createModal = () => {
    // User Interface
    let ignoreClickOutside = false;
    const modalOverlay = Object.assign(document.createElement("div"), {
      className: "modal-overlay",
    });
    addon.tab.displayNoneWhileDisabled(modalOverlay);
    const modal = Object.assign(document.createElement("div"), {
      className: "modal-content modal-sizes sa-animated-thumb-popup",
      dir: addon.tab.direction,
    });
    const modalHeader = Object.assign(document.createElement("div"), {
      className: "modal-header sa-animated-thumb-popup-header",
    });
    modalHeader.appendChild(
      Object.assign(document.createElement("div"), {
        className: "modal-title",
        textContent: msg("set-thumbnail"),
      })
    );
    modal.appendChild(modalHeader);
    const modalInner = Object.assign(document.createElement("div"), {
      className: "modal-inner-content sa-animated-thumb-popup-content",
    });
    modalInner.appendChild(
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
    modalInner.appendChild(modalButtons);
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
    modalInner.appendChild(stopOverwritingRow);
    modalInner.appendChild(
      Object.assign(document.createElement("p"), {
        textContent: msg("keep-thumb-desc"),
        className: "sa-animated-thumb-text",
      })
    );
    const modalResultArea = Object.assign(document.createElement("div"), {
      className: "sa-animated-thumb-popup-result",
      hidden: true,
    });
    modalInner.appendChild(modalResultArea);

    modalInner.appendChild(
      Object.assign(document.createElement("p"), {
        textContent: msg("successful"),
        className: "sa-animated-thumb-text sa-animated-thumb-show-on-success",
      })
    );
    const thumbImage = Object.assign(document.createElement("img"), {
      alt: "",
      width: 360,
      height: 240,
    });
    const thumbImageWrapper = Object.assign(document.createElement("p"), {
      className: "sa-animated-thumb-show-on-success sa-animated-thumb-uploaded-thumb",
    });
    thumbImageWrapper.appendChild(thumbImage);
    modalInner.appendChild(thumbImageWrapper);
    modalInner.appendChild(
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
      modalOverlay.remove();
      document.body.removeEventListener("click", handleClickOutside, {
        capture: true,
      });
      document.body.classList.remove("overflow-hidden");
    };
    handleClickOutside = (e) => {
      if (ignoreClickOutside || modal.contains(e.target)) return;
      closePopup();
    };
    document.body.addEventListener("click", handleClickOutside, {
      capture: true,
    });
    document.body.classList.add("overflow-hidden");

    const buttonRow = Object.assign(document.createElement("div"), {
      className: "flex-row action-buttons sa-animated-thumb-popup-buttons",
    });
    const closeButton = Object.assign(document.createElement("button"), {
      textContent: msg("close"),
      className: "button action-button close-button white",
    });
    closeButton.addEventListener("click", closePopup, { once: true });
    buttonRow.appendChild(closeButton);
    modalInner.appendChild(buttonRow);
    modal.appendChild(modalInner);
    modalOverlay.append(modal);

    setter.onFinished = (promise) =>
      promise
        .then(
          (canceled) => {
            if (canceled) return;
            thumbImage.src = `https://cdn2.scratch.mit.edu/get_image/project/${projectId}_480x360.png?nocache=${Date.now()}`;
            modalInner.classList.add("sa-animated-thumb-successful");
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

    document.body.appendChild(modalOverlay);
  };

  addon.tab.addEventListener("urlChange", () => {
    projectId = location.href.match(/\d+/)[0];
    blockOverwriting(isOverwritingEnabled(projectId));
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
