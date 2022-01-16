export default async ({ addon, console, msg }) => {
  //The file input that the next pasted image will be pasted into.
  let currentMenuInput;

  const createItem = (id, right) => {
    const uploadMsg = "Paste Image";
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
      )} sa-better-img-uploads-tooltip`,
      id: `sa-${id}-Paste Image`,
      textContent: uploadMsg,
    });
    tooltip.dataset.id = "tooltip";
    wrapper.append(tooltip);
    return [wrapper, button, tooltip];
  };

  let reader = new FileReader();
  const PNG = "image/png";
  const JPEG = "image/jpeg";
  const BMP = "image/bmp";
  const GIF = "image/gif";

  reader.onload = function (evt) {
    console.log(evt.target.result);
  };

  //Handles clipboard validity checking and uploading the image
  const onPaste = function (event) {
    hidePasteOverlay();

    let clipboardData = event.clipboardData || window.clipboardData || event.originalEvent.clipboardData;
    if (!clipboardData) {
      //I don't think this ever happens but just to be safe
      console.error("Clipboard data not found");
      alert("Error uploading image");
      return;
    }
    const FILES = clipboardData.files;
    const TYPES = clipboardData.types;
    console.log(FILES, TYPES, FILES[0], TYPES[0]);
    if (!FILES) {
      console.error("No files");
      alert("Please paste a PNG, GIF or JPG image.");
      return;
    }

    const filteredFiles = [];

    for (const i in FILES) {
      const FILE = FILES[i];
      if (FILE.type === PNG || FILE.type === JPEG || FILE.type === GIF || FILE.type === BMP) {
        filteredFiles.push(FILE);
      }
    }

    if (filteredFiles.length < 1) {
      console.error("No files of supported types");
      alert("Please paste a PNG, GIF or JPG image.");
      return;
    }

    uploadFiles(currentMenuInput, new FileList(filteredFiles));
    event.preventDefault();
  };

  //Add files to an input, and trigger their change events.
  const uploadFiles = function (input, files) {
    input.files = files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  //Paste overlay
  const pasteOverlay = document.createElement("div");
  const displayNonePasteOverlay = function () {
    pasteOverlay.style.display = "none";
  };
  const hidePasteOverlay = function () {
    displayNonePasteOverlay();
    document.body.removeEventListener("paste", onPaste);
  };
  displayNonePasteOverlay();
  pasteOverlay.className = "ReactModalPortal";
  pasteOverlay.addEventListener("click", hidePasteOverlay);
  document.addEventListener("keydown", function (e) {
    if (!(e.key === "Escape")) return;
    hidePasteOverlay();
  });

  const pasteOverlayInner = document.createElement("div");
  pasteOverlayInner.className = "ReactModal__Overlay ReactModal__Overlay--after-open sa-paste-overlay-inner";
  pasteOverlayInner.classList.add(addon.tab.scratchClass("modal_modal-overlay"));

  const pasteOverlayTextContainer = document.createElement("div");
  pasteOverlayTextContainer.className = "sa-paste-overlay-text";

  const pasteOverlayText = document.createTextNode("Paste an image to upload...");

  const pasteOverlaySubtext = document.createElement("div");
  pasteOverlaySubtext.className = "sa-paste-overlay-subtext";
  pasteOverlaySubtext.textContent = "(Click or press Escape to cancel)";

  pasteOverlay.appendChild(pasteOverlayInner);
  pasteOverlayInner.appendChild(pasteOverlayTextContainer);
  pasteOverlayTextContainer.appendChild(pasteOverlayText);
  pasteOverlayTextContainer.appendChild(pasteOverlaySubtext);

  document.body.appendChild(pasteOverlay);

  while (true) {
    //Catch all upload menus as they are created
    let menu = await addon.tab.waitForElement(
      '[class*="sprite-selector_sprite-selector_"] [class*="action-menu_more-buttons_"], [class*="stage-selector_stage-selector_"] [class*="action-menu_more-buttons_"], #react-tabs-3 [class*="action-menu_more-buttons_"]',
      { markAsSeen: true }
    );
    let button = menu.parentElement.previousElementSibling.previousElementSibling; //The base button that the popup menu is from

    let id = button.getAttribute("aria-label").replace(/\s+/g, "_");

    let isRight = //Is it on the right side of the screen?
      button.parentElement.classList.contains(addon.tab.scratchClass("sprite-selector_add-button")) ||
      button.parentElement.classList.contains(addon.tab.scratchClass("stage-selector_add-button"));

    if (isRight) {
      id += "_right";
    }

    const [menuItem, pasteButton, tooltip] = createItem(id, isRight);
    addon.tab.appendToSharedSpace({ space: "spriteCreationMenu", element: menuItem, order: 0, scope: menu });

    pasteButton.addEventListener("click", (e) => {
      currentMenuInput = e.target.parentElement.parentElement.parentElement.querySelector(
        "input[class*='action-menu_file-input_']:not([class*='sa-'])"
      );
      pasteOverlay.style.display = "block";
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
    //File list constructor. Does not need the `new` keyword, but it is easier to read
    let filelist = new DataTransfer(); //This "creates" a FileList that we can add files to
    for (let file of arr) {
      filelist.items.add(file);
    }
    return filelist.files; //Completed FileList
  }
};
