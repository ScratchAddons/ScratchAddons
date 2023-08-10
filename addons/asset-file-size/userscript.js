import * as Sizes from "module.js"
export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;

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
      sizeText.textContent = `(${Sizes.getSizeString(assetSize, false, isSounds ? 100 : 1)})`;
      sizeText.title = Sizes.getSizeString(assetSize, false, 1000);

      if (assetSize > Sizes.ASSET_SIZE_LIMIT) {
        sizeText.classList.add("sa-size-limit-warn");
      } else {
        sizeText.classList.remove("sa-size-limit-warn");
      }
    }
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/targets/UPDATE_TARGET_LIST") {
      // occasionally this event fires before the DOM updates
      // (for exmaple, when restoring a sprite)
      queueMicrotask(updateAssetSizes);
    }
  });

  while (true) {
    await addon.tab.waitForElement("[class*='selector_list-area']", {
      markAsSeen: true,
    });
    queueMicrotask(updateAssetSizes);
  }
}
