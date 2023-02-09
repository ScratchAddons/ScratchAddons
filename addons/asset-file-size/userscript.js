export default async function ({ addon, msg, global, console }) {
  const vm = addon.tab.traps.vm;

  const KB = 1000;
  const MB = 1000 * KB;
  const ASSET_SIZE_LIMIT = 10 * MB;

  // source: https://scratch.mit.edu/discuss/post/6084224
  // apparently the project.json size limit is in mebibytes
  // instead of megabytes for some reason
  const KiB = 1024;
  const MiB = 1024 * KiB;
  const PROJECT_SIZE_LIMIT = 5 * MiB;

  const fileSizesModal = addon.tab.createModal("Project File Sizes", { useEditorClasses: true });
  fileSizesModal.closeButton.addEventListener("click", fileSizesModal.close);

  fileSizesModal.container.classList.add("sa-file-size-popup");
  fileSizesModal.content.classList.add("sa-file-size-popup-content");

  function initFileSizesModal() {
    const modal = fileSizesModal;

    // if we already have content, throw it out of the window
    if (modal.content.children[0]) modal.content.children[0].remove();

    const c = modal.content.appendChild(document.createElement("div"));

    // project.json size
    {
      const heading = c.appendChild(document.createElement("h3"));
      heading.textContent = "project.json";
      const info = c.appendChild(document.createElement("p"));
      info.classList.add("sa-file-size-info");
      info.textContent = `This is the file that stores the project's code, variables, lists and most costume, sound, backdrop and sprite info. If it exceeds 5MiB, the project will not save.`;

      const bytes = vm.toJSON().length;
      const sizeText = `${getSizeString(bytes, true)}/${getSizeString(PROJECT_SIZE_LIMIT, true)}`;

      const advice =
        bytes > PROJECT_SIZE_LIMIT
          ? `Try clearing large lists and decreasing the number of blocks in the project.`
          : "";

      const text = c.appendChild(document.createElement("p"));
      text.textContent = `The size of the project.json file is ${sizeText}. ${advice}`;
    }

    // large assets list
    {
      const { largestAsset, largeAssets } = getLargeAssetList();

      const heading = c.appendChild(document.createElement("h3"));
      heading.textContent = "Large Assets";
      const info = c.appendChild(document.createElement("p"));
      info.classList.add("sa-file-size-info");
      info.textContent = `Costumes, backdrops and sounds that exceed 10MB. If any asset exceeds this limit, the project will not save.`;

      if (largeAssets.length < 1) {
        const noLargeAssets = c.appendChild(document.createElement("p"));

        const asset = largestAsset;

        const whichAsset = `"${asset.asset.name}" (${getSizeString(asset.size)}/${getSizeString(ASSET_SIZE_LIMIT)})`;
        const whichSprite = ` in ${asset.target.sprite.name}`;

        const costumeString = `There are no large assets. The currently largest asset is the costume ${whichAsset}${whichSprite}.`;
        const backdropString = `There are no large assets. The currently largest asset is the backdrop ${whichAsset}.`;
        const soundString = `There are no large assets. The currently largest asset is the sound ${whichAsset}${whichSprite}.`;

        noLargeAssets.textContent =
          asset.type === "sound" ? soundString : asset.type === "backdrop" ? backdropString : costumeString;
      } else {
        const largeAssetsList = c.appendChild(document.createElement("ul"));
        for (const asset of largeAssets) {
          const li = largeAssetsList.appendChild(document.createElement("li"));

          const whichAsset = `"${asset.asset.name}" (${getSizeString(asset.size)})`;
          const whichSprite = ` in ${asset.target.sprite.name}`;

          const costumeString = `Costume ${whichAsset}${whichSprite}`;
          const backdropString = `Backdrop ${whichAsset}.`;
          const soundString = `Sound ${whichAsset}${whichSprite}`;

          li.textContent =
            asset.type === "sound" ? soundString : asset.type === "backdrop" ? backdropString : costumeString;
        }
        const advice = c.appendChild(document.createElement("p"));
        advice.textContent =
          "For large sounds, try splitting them up into smaller pieces or converting them to MP3 using other tools and not editing them in Scratch.";
      }
    }

    modal.content.appendChild(c);
  }

  function getLargeAssetList() {
    let largestAsset = null;
    let largeAssets = [];

    for (const target of vm.runtime.targets) {
      for (const costume of target.sprite.costumes) {
        const assetObj = {
          target,
          asset: costume,
          size: costume.asset.data.byteLength,
          type: target.isStage ? "backdrop" : "costume",
        };
        if (!largestAsset || assetObj.size > largestAsset.size) {
          largestAsset = assetObj;
        }
        if (assetObj.size > ASSET_SIZE_LIMIT) {
          largeAssets.push(assetObj);
        }
      }
      for (const sound of target.sprite.sounds) {
        const assetObj = {
          target,
          asset: sound,
          size: sound.asset.data.byteLength,
          type: "sound",
        };
        if (!largestAsset || assetObj.size > largestAsset.size) {
          largestAsset = assetObj;
        }
        if (assetObj.size > ASSET_SIZE_LIMIT) {
          largeAssets.push(assetObj);
        }
      }
    }

    largeAssets = largeAssets.sort((a, b) => a.size - b.size);

    return { largestAsset, largeAssets };
  }

  function updateAssetSizes() {
    if (!vm.editingTarget) return;

    const assetList = document.querySelector("[class*='selector_list-area']");
    if (!assetList) return;

    const isSounds = addon.tab.redux.state.scratchGui.editorTab.activeTabIndex === 2;

    const assets = isSounds ? vm.editingTarget.sprite.sounds : vm.editingTarget.sprite.costumes;

    for (const index in assets) {
      const card = assetList.children[index];
      if (!card) return;

      const spriteImage = card.querySelector("[class*='sprite-selector-item_sprite-image-outer']");

      let sizeText = spriteImage.querySelector(".sa-size-text");
      if (!sizeText) {
        sizeText = spriteImage.appendChild(document.createElement("span"));
        sizeText.className = "sa-size-text";
      }

      const assetSize = assets[index].asset.data.byteLength;
      sizeText.textContent = getSizeString(assetSize);

      if (assetSize > ASSET_SIZE_LIMIT) {
        sizeText.classList.add("sa-size-limit-warn");
      } else {
        sizeText.classList.remove("sa-size-limit-warn");
      }
    }
  }

  // converts a number of bytes into a human-friendly display string
  function getSizeString(bytes, isMebi = false) {
    let number, measurement;

    if (isMebi) {
      if (bytes < KiB) {
        number = bytes;
        measurement = "B";
      } else if (bytes < MiB) {
        number = Math.floor((bytes / KiB) * 100) / 100;
        measurement = "KiB";
      } else {
        number = Math.floor((bytes / MiB) * 100) / 100;
        measurement = "MiB";
      }
    } else {
      if (bytes < KB) {
        number = bytes;
        measurement = "B";
      } else if (bytes < MB) {
        number = Math.floor((bytes / KB) * 100) / 100;
        measurement = "KB";
      } else {
        number = Math.floor((bytes / MB) * 100) / 100;
        measurement = "MB";
      }
    }

    return `${number}${measurement}`;
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/targets/UPDATE_TARGET_LIST") {
      updateAssetSizes();
    }
  });

  async function listenForAssetCards() {
    while (true) {
      await addon.tab.waitForElement("[class*='selector_list-area']", {
        markAsSeen: true,
      });
      queueMicrotask(updateAssetSizes);
    }
  }
  async function listenForFileMenu() {
    while (true) {
      const fileMenu = await addon.tab.waitForElement(
        "[class*='menu-bar_file-group'] > div:nth-child(3) > div > [class*='menu_menu_']",
        { markAsSeen: true }
      );

      const menuItem = fileMenu.appendChild(document.createElement("li"));
      menuItem.className = addon.tab.scratchClass("menu_menu-item", "menu_hoverable", "menu_menu-section");

      menuItem.textContent = "Project file size";

      menuItem.addEventListener("click", (e) => {
        addon.tab.redux.dispatch({
          type: "scratch-gui/menus/CLOSE_MENU",
          menu: "fileMenu",
        });
        initFileSizesModal();
        fileSizesModal.open();
      });
    }
  }

  listenForAssetCards();
  listenForFileMenu();
}
