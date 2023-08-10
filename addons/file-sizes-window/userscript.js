import * as Sizes from "../asset-file-size/module.js";
export default async function ({ addon, msg }) {
  const vm = addon.tab.traps.vm;

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
      const sizeText = Sizes.getSizeString(bytes, true, 1000)
      const limitText = Sizes.getSizeString(Sizes.PROJECT_SIZE_LIMIT, true);

      const text = c.appendChild(document.createElement("p"));
      text.textContent = msg("project-json-size", { fileSize: sizeText, limit: limitText });
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
        const fileSize = Sizes.getSizeString(asset.size, false, 1000);
        const limit = Sizes.getSizeString(
          Sizes.VISIBLE_ASSET_SIZE_LIMIT
        );
        const sprite = asset.target.sprite.name;

        const costumeString = msg("assets-none-costume", { assetName, fileSize, limit, sprite });
        const backdropString = msg("assets-none-backdrop", { assetName, fileSize, limit });
        const soundString = msg("assets-none-sound", { assetName, fileSize, limit, sprite });

        noLargeAssets.textContent =
          asset.type === "sound" ? soundString : asset.type === "backdrop" ? backdropString : costumeString;
      } else {
        const largeAssetsList = c.appendChild(document.createElement("ul"));
        for (const asset of largeAssets) {
          const li = largeAssetsList.appendChild(document.createElement("li"));

          const assetName = asset.asset.name;
          const fileSize = Sizes.getSizeString(asset.size, false, 1000);
          const sprite = asset.target.sprite.name;

          const costumeString = msg("assets-item-costume", { assetName, fileSize, sprite });
          const backdropString = msg("assets-item-backdrop", { assetName, fileSize });
          const soundString = msg("assets-item-sound", { assetName, fileSize, sprite });

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
        if (assetObj.size > Sizes.ASSET_SIZE_LIMIT) {
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
        if (assetObj.size > Sizes.ASSET_SIZE_LIMIT) {
          largeAssets.push(assetObj);
        }
      }
    }

    largeAssets = largeAssets.sort((a, b) => a.size - b.size);

    return { largestAsset, largeAssets };
  }

  addon.self.addEventListener("disabled", () => fileSizesModal.close());

  while (true) {
    const fileMenu = await addon.tab.waitForElement(
      "[class*='menu-bar_file-group'] > div:nth-child(3) > [class*='menu-bar_menu-bar-menu'] > [class*='menu_menu_']",
      { markAsSeen: true }
    );

    const menuItem = fileMenu.appendChild(document.createElement("li"));
    menuItem.className = addon.tab.scratchClass("menu_menu-item", "menu_hoverable", "menu_menu-section");

    menuItem.textContent = msg("menu-item");
    addon.tab.displayNoneWhileDisabled(menuItem, {display: "block"});

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
