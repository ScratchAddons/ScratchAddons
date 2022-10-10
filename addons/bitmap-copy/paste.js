import { update } from "./paint-editor-utils.js";

export default async ({ addon, console, msg }) => {
  // The action-menu_file-input classed input that the next pasted image will be pasted into.
  let currentMenuInput;

  // Paste overlay
  const pasteOverlay = document.createElement("div");
  pasteOverlay.className = "ReactModalPortal sa-paste-overlay-outer";
  const displayNonePasteOverlay = () => {
    pasteOverlay.classList.add("hidden");
  };
  const showPasteOverlay = () => {
    pasteOverlay.classList.remove("hidden");
  };
  const hidePasteOverlay = () => {
    displayNonePasteOverlay();
    document.body.removeEventListener("paste", onPaste);
  };
  displayNonePasteOverlay();
  pasteOverlay.addEventListener("click", hidePasteOverlay);
  addon.self.addEventListener("disabled", hidePasteOverlay);
  document.addEventListener("keydown", (e) => {
    if (!(e.key === "Escape")) return;
    hidePasteOverlay();
  });

  const pasteOverlayInner = document.createElement("div");
  pasteOverlayInner.className = "ReactModal__Overlay ReactModal__Overlay--after-open sa-paste-overlay-inner";
  pasteOverlayInner.classList.add(addon.tab.scratchClass("modal_modal-overlay"));

  const pasteOverlayTextContainer = document.createElement("div");
  pasteOverlayTextContainer.className = "sa-paste-overlay-text";

  const pasteOverlayText = document.createTextNode(msg("paste-overlay-message"));

  const pasteOverlaySubtext = document.createElement("div");
  pasteOverlaySubtext.className = "sa-paste-overlay-subtext";
  pasteOverlaySubtext.textContent = msg("paste-overlay-subtitle");

  pasteOverlay.appendChild(pasteOverlayInner);
  pasteOverlayInner.appendChild(pasteOverlayTextContainer);
  pasteOverlayTextContainer.appendChild(pasteOverlayText);
  pasteOverlayTextContainer.appendChild(pasteOverlaySubtext);

  document.body.appendChild(pasteOverlay);

  // Handles clipboard validity checking and uploading the image
  const onPaste = (e, checkOnly = false) => {
    if (addon.self.disabled) return;

    hidePasteOverlay();

    const PNG = "image/png";
    const JPEG = "image/jpeg";
    const BMP = "image/bmp";
    const GIF = "image/gif";

    let clipboardData = e.clipboardData || window.clipboardData || e.originalEvent.clipboardData;
    if (!clipboardData) {
      // I don't think this ever happens but just to be safe
      console.error("Clipboard data not found");
      if (!checkOnly) {
        alert(msg("paste-error-generic"));
      }
      return;
    }

    const { files } = clipboardData;

    if (!files) {
      console.error("No files");
      if (!checkOnly) {
        alert(msg("paste-error-filetype"));
      }
      return;
    }

    const filteredFiles = [];

    for (const file of files) {
      switch (file.type) {
        case PNG:
        case JPEG:
        case GIF:
        case BMP: {
          filteredFiles.push(file);
        }
      }
    }

    if (filteredFiles.length < 1) {
      console.error("No files of supported types");
      if (!checkOnly) {
        alert(msg("paste-error-filetype"));
      }
      return;
    }

    if (checkOnly) {
      return new FileList(filteredFiles);
    } else {
      e.preventDefault();
      uploadFiles(currentMenuInput, new FileList(filteredFiles));
    }
  };

  // Handles what occurs when simply pressing Ctrl+V in the editor to
  // paste an image as a costume when applicable.
  const passivePaste = async (e) => {
    if (addon.self.disabled) return;
    //If the paste overlay is active, let it do its thing
    if (!pasteOverlay.classList.contains("hidden")) return;

    const COSTUMES_PANE = document.querySelector("[data-tabs] > :nth-child(3) > div > [class*='selector_wrapper_']");
    if (!COSTUMES_PANE) return;

    const files = onPaste(e, true);
    if (!files) return;

    e.preventDefault();

    // As Paper isn't required for all of the addon's functionality,
    // get it here
    const paper = await addon.tab.traps.getPaper();

    for (const file of files) {
      const raster = new paper.Raster({
        source: URL.createObjectURL(file),
        position: paper.view.center,
      });
      raster.selected = true;
      raster.smoothing = "off";
      raster.scale(2);
    }

    update(addon.tab.redux, paper, true);
  };
  document.body.addEventListener("paste", passivePaste);

  // Add files to an input, and trigger their change events.
  const uploadFiles = (input, files) => {
    input.files = files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // A lot of the following code was pasted from the better-img-uploads addon.
  // Credits to the people who made that addon
  const createItem = (id, right) => {
    const uploadMsg = msg("paste-image");
    const wrapper = Object.assign(document.createElement("div"), { id });
    const button = Object.assign(document.createElement("button"), {
      className: `${addon.tab.scratchClass("action-menu_button")} ${addon.tab.scratchClass(
        "action-menu_more-button"
      )} sa-paste-image-btn`,
      currentitem: "false",
    });
    button.dataset.for = `sa-${id}-Paste Image`;
    button.dataset.tip = uploadMsg;
    const img = Object.assign(document.createElement("img"), {
      className: `${addon.tab.scratchClass("action-menu_more-icon")} sa-paste-image`,
      draggable: "false",
      src: `${addon.self.dir}/paste.svg`,
      height: "10",
      width: "10",
    });
    button.append(img);
    wrapper.append(button);
    const tooltip = Object.assign(document.createElement("div"), {
      className: `__react_component_tooltip place-${right ? "left" : "right"} type-dark ${addon.tab.scratchClass(
        "action-menu_tooltip"
      )} sa-paste-image-tooltip`,
      id: `sa-${id}-Paste Image`,
      textContent: uploadMsg,
    });
    tooltip.dataset.id = "tooltip";
    wrapper.append(tooltip);
    return [wrapper, button, tooltip];
  };
  while (true) {
    // Catch all upload menus as they are created
    let menu = await addon.tab.waitForElement(
      '[class*="sprite-selector_sprite-selector_"] [class*="action-menu_more-buttons_"], [class*="stage-selector_stage-selector_"] [class*="action-menu_more-buttons_"], [data-tabs] > :nth-child(3) [class*="action-menu_more-buttons_"]',
      { markAsSeen: true }
    );
    let button = menu.parentElement.previousElementSibling.previousElementSibling; // The base button that the popup menu is from

    let id = button.getAttribute("aria-label").replace(/\s+/g, "_");

    let isRight = // Is it on the right side of the screen?
      button.parentElement.classList.contains(addon.tab.scratchClass("sprite-selector_add-button")) ||
      button.parentElement.classList.contains(addon.tab.scratchClass("stage-selector_add-button"));

    if (isRight) {
      id += "_right";
    }

    const [menuItem, pasteButton, tooltip] = createItem(id, isRight);
    addon.tab.displayNoneWhileDisabled(menuItem, { display: "block" });
    addon.tab.appendToSharedSpace({ space: "spriteCreationMenu", element: menuItem, order: 0, scope: menu });

    pasteButton.addEventListener("click", (e) => {
      currentMenuInput = e.target.parentElement.parentElement.parentElement.querySelector(
        "input[class*='action-menu_file-input_']:not([class*='sa-'])"
      );
      showPasteOverlay();
      document.body.addEventListener("paste", onPaste);
    });

    let observer = new MutationObserver(() => doresize(id, menu, menuItem, isRight));

    observer.observe(menu, { attributes: true, subtree: true });

    function doresize(id, menu, menuItem, isRight) {
      let rect = menuItem.getBoundingClientRect();
      tooltip.style.top = rect.top + 2 + "px";
      tooltip.style[isRight ? "right" : "left"] = isRight
        ? window.innerWidth - rect.right + rect.width + 10 + "px"
        : rect.left + rect.width + "px";
    }
  }

  function FileList(arr = []) {
    // File list constructor. Does not need the `new` keyword, but it is easier to read
    let filelist = new DataTransfer(); // This "creates" a FileList that we can add files to
    for (let file of arr) {
      filelist.items.add(file);
    }
    return filelist.files; // Completed FileList
  }
};
