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

  const fileSizesModal = addon.tab.createModal(msg("modal-title"), { useEditorClasses: true });
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
      heading.textContent = msg("project-json-title");
      const info = c.appendChild(document.createElement("p"));
      info.classList.add("sa-file-size-info");
      info.textContent = msg("project-json-description");

      const bytes = vm.toJSON().length;
      const sizeText = `${getSizeString(bytes, true, 1000)}/${getSizeString(PROJECT_SIZE_LIMIT, true)}`;

      const text = c.appendChild(document.createElement("p"));
      text.textContent = msg("project-json-size", {fileSize: sizeText});
    }

    // large assets list
    {
      const { largestAsset, largeAssets } = getLargeAssetList();

      const heading = c.appendChild(document.createElement("h3"));
      heading.textContent = msg("assets-title");
      const info = c.appendChild(document.createElement("p"));
      info.classList.add("sa-file-size-info");
      info.textContent = msg("assets-description");

      if (largeAssets.length < 1) {
        const noLargeAssets = c.appendChild(document.createElement("p"));

        const asset = largestAsset;

        const assetName = asset.asset.name;
        const fileSize = `${getSizeString(asset.size, false, 1000)}/${getSizeString(ASSET_SIZE_LIMIT)}`;
        const sprite = asset.target.sprite.name;

        const costumeString = msg("assets-none-costume", {assetName, fileSize, sprite});
        const backdropString = msg("assets-none-backdrop", {assetName, fileSize});
        const soundString = msg("assets-none-sound", {assetName, fileSize, sprite});

        noLargeAssets.textContent =
          asset.type === "sound" ? soundString : asset.type === "backdrop" ? backdropString : costumeString;
      } else {
        const largeAssetsList = c.appendChild(document.createElement("ul"));
        for (const asset of largeAssets) {
          const li = largeAssetsList.appendChild(document.createElement("li"));

          const assetName = asset.asset.name;
          const fileSize = `${getSizeString(asset.size, false, 1000)}`;
          const sprite = asset.target.sprite.name;
  
          const costumeString = msg("assets-item-costume", {assetName, fileSize, sprite});
          const backdropString = msg("assets-item-backdrop", {assetName, fileSize});
          const soundString = msg("assets-item-sound", {assetName, fileSize, sprite});

          li.textContent =
            asset.type === "sound" ? soundString : asset.type === "backdrop" ? backdropString : costumeString;
        }
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
      if (!card) continue;

      const spriteInfo = card.querySelector("[class*='sprite-selector-item_sprite-details']");

      // compact costume image sizes, to make space for the filesize
      if (spriteInfo.textContent.includes(" x ")) {
        spriteInfo.textContent = spriteInfo.textContent.replace(" x ", "x");
      }

      let sizeText = spriteInfo.querySelector(".sa-size-text");
      if (!sizeText) {
        const space = spriteInfo.appendChild(document.createElement("span"));
        space.textContent = " ";

        sizeText = spriteInfo.appendChild(document.createElement("span"));
        sizeText.classList.add("sa-size-text");
      }

      const assetSize = assets[index].asset.data.byteLength;
      // more available space on sound asset cards;
      // and it's more likely you'll run into the asset size limit
      // from sounds rather than costumes
      sizeText.textContent = `(${getSizeString(assetSize, false, isSounds ? 100 : 1)})`;
      sizeText.title = getSizeString(assetSize, false, 1000);

      if (assetSize > ASSET_SIZE_LIMIT) {
        sizeText.classList.add("sa-size-limit-warn");
      } else {
        sizeText.classList.remove("sa-size-limit-warn");
      }
    }
  }

  // converts a number of bytes into a human-friendly display string
  function getSizeString(bytes, isMebi = false, precision = 100) {
    let number, measurement;

    if (isMebi) {
      if (bytes < KiB) {
        number = bytes;
        measurement = "B";
      } else if (bytes < MiB) {
        number = Math.floor((bytes / KiB) * precision) / precision;
        measurement = "KiB";
      } else {
        number = Math.floor((bytes / MiB) * precision) / precision;
        measurement = "MiB";
      }
    } else {
      if (bytes < KB) {
        number = bytes;
        measurement = "B";
      } else if (bytes < MB) {
        number = Math.floor((bytes / KB) * precision) / precision;
        measurement = "KB";
      } else {
        number = Math.floor((bytes / MB) * precision) / precision;
        measurement = "MB";
      }
    }

    return `${number}${measurement}`;
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (
      e.detail.action.type === "scratch-gui/targets/UPDATE_TARGET_LIST"
    ) {
      // occasionally this event fires before the DOM updates
      // (for exmaple, when restoring a sprite)
      queueMicrotask(updateAssetSizes);
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

      menuItem.textContent = msg("menu-item");

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
