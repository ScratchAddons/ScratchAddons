export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;

  Array.prototype.naturalSort = function () {
    var a,
      b,
      a1,
      b1,
      rx = /(\d+)|(\D+)/g,
      rd = /\d+/;
    return this.sort(function (as, bs) {
      a = String(as).toLowerCase().match(rx);
      b = String(bs).toLowerCase().match(rx);
      while (a.length && b.length) {
        a1 = a.shift();
        b1 = b.shift();
        if (rd.test(a1) || rd.test(b1)) {
          if (!rd.test(a1)) return 1;
          if (!rd.test(b1)) return -1;
          if (a1 != b1) return a1 - b1;
        } else if (a1 != b1) return a1 > b1 ? 1 : -1;
      }
      return a.length - b.length;
    });
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
    sortedAssets = assets
      .map((asset) => asset.name)
      .naturalSort()
      .map((sortedName) => assets.find((asset) => asset.name === sortedName));

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
        }
      });

      vm.emitTargetsUpdate();
    }

    li.classList.add(addon.tab.scratchClass("menu-bar_disabled"));
  }

  const li = document.createElement("li");
  const span = document.createElement("span");

  li.classList = addon.tab.scratchClass("menu_menu-item", "menu_hoverable");

  li.appendChild(span);

  li.onclick = () => {
    if (li.classList.contains(addon.tab.scratchClass("menu-bar_disabled"))) {
      // How do I close the menu?
    }
    sortAssets(li.getAttribute("assetType"));
  };

  const msgs = ["sprites", "costumes", "sounds", "sprites"];
  let editMenu;

  addon.self.addEventListener("disabled", () => (li.style.display = "none"));
  addon.self.addEventListener("reenabled", () => (li.style.display = "block"));

  async function running() {
    while (true) {
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

        editMenu.appendChild(li);
      }
    }
  }

  running();
}
