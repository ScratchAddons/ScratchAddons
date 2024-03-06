export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;

  Array.prototype.naturalSort = function () {
    return this.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }));
  };

  let assets;
  let sortedAssets;
  let isSorted;

  function getAssetOrder(type) {
    if (type === "costumes") {
      assets = vm.editingTarget.getCostumes();
    } else if (type === "sounds") {
      assets = vm.editingTarget.getSounds();
    } else if (type === "sprites") {
      const spritePane = document.querySelector("[class*=sprite-selector_items-wrapper]");
      const spriteInfoElements = Array.from(spritePane.querySelectorAll("[class*=sprite-selector-item_sprite-info]"));
      assets = spriteInfoElements.map((element) => ({ name: element.textContent }));
    }

    // Sort assets by name

    assets = assets.map((asset) => asset.name);
    sortedAssets = assets.map((name) => name).naturalSort();

    isSorted = JSON.stringify(assets) === JSON.stringify(sortedAssets);
  }

  function sortAssets(type) {
    isSorted = false;

    while (!isSorted) {
      getAssetOrder(type);
      sortedAssets.forEach((sortedAsset, index) => {
        if (type === "costumes") {
          vm.editingTarget.reorderCostume(assets.indexOf(sortedAsset), index);
        } else if (type === "sounds") {
          vm.editingTarget.reorderSound(assets.indexOf(sortedAsset), index);
        } else if (type === "sprites") {
          vm.reorderTarget(assets.indexOf(sortedAsset) + 1, index + 1);
        }
        vm.emitTargetsUpdate();
        getAssetOrder(type);
      });
    }

    li.classList.add(addon.tab.scratchClass("menu-bar_disabled"));
  }

  const li = document.createElement("li");
  const span = document.createElement("span");

  li.classList = addon.tab.scratchClass("menu_menu-item", "menu_hoverable");

  li.appendChild(span);

  li.onclick = () => {
    if (li.classList.contains(addon.tab.scratchClass("menu-bar_disabled"))) {
      addon.tab.redux.dispatch({ type: "scratch-gui/menus/CLOSE_MENU", menu: "editMenu" });
    }

    const currentSelectedAssetName = document
      .querySelector("[class*=sprite-selector-item_is-selected]")
      .querySelector("[class*=sprite-selector-item_sprite-name]").innerText;

    sortAssets(li.getAttribute("assetType"));

    const assetsWrapper =
      li.getAttribute("assetType") === "sprites"
        ? document.querySelector("[class*=sprite-selector_items-wrapper]")
        : document.querySelector("[class*=selector_list-area]");
    const assets =
      li.getAttribute("assetType") === "sprites"
        ? assetsWrapper.querySelectorAll("[class*=sprite-selector_sprite-wrapper]")
        : assetsWrapper.querySelectorAll("[class*=selector_list-item]");

    assets.forEach((asset) => {
      const assetName = asset.querySelector("[class*=sprite-selector-item_sprite-name]").innerText;
      if (assetName === currentSelectedAssetName) {
        asset.click();
        return;
      }
    });
  };

  const msgs = ["sprites", "costumes", "sounds", "sprites"];
  let editMenu;

  addon.self.addEventListener("disabled", () => (li.style.display = "none"));
  addon.self.addEventListener("reenabled", () => {
    li.style.display = "block";
    if (addon.tab.redux.state.scratchGui.menus.editMenu) {
      editMenu.appendChild(li);
    }
  });

  addon.tab.redux.initialize();

  addon.tab.redux.addEventListener("statechanged", callback);

  async function callback(action) {
    if (!(action.detail.action.type === "scratch-gui/menus/OPEN_MENU" && action.detail.action.menu === "editMenu"))
      return;

    editMenu = await addon.tab.waitForElement("[class*=menu_right]", {
      markAsSeen: true,
    });

    if (!addon.self.disabled) {
      const assetType = msgs[addon.tab.redux.state.scratchGui.editorTab.activeTabIndex];
      span.textContent = msg(assetType);
      li.setAttribute("assetType", assetType);

      getAssetOrder(assetType);

      if (isSorted) li.classList.add(addon.tab.scratchClass("menu-bar_disabled"));
      else li.classList.remove(addon.tab.scratchClass("menu-bar_disabled"));

      if (addon.tab.redux.state.scratchGui.menus.editMenu) {
        editMenu.appendChild(li);
      }
    }
  }
}
