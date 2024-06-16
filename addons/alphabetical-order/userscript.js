export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;

  // Add natural sort method to Array prototype
  Array.prototype.naturalSort = function () {
    return this.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" }));
  };

  // Variables to store asset names and states
  let currentAssetNames = [];
  let sortedAssetNames = [];
  let originalAssetNames = [];
  let isSorted = false;
  let shouldChangeRestoreButtonText = false;

  // Function to get and sort asset names based on the type
  function fetchAndSortAssets(type, applyNaturalSort) {
    if (type === "costumes") {
      currentAssetNames = (vm.editingTarget.getCostumes() || []).map((costume) => costume.name);
    } else if (type === "sounds") {
      currentAssetNames = (vm.editingTarget.getSounds() || []).map((sound) => sound.name);
    } else if (type === "sprites") {
      const spritePane = document.querySelector("[class*=sprite-selector_items-wrapper]");
      const spriteElements = Array.from(spritePane.querySelectorAll("[class*=sprite-selector-item_sprite-info]"));
      currentAssetNames = spriteElements.map((element) => element.textContent);
    }

    if (applyNaturalSort) {
      sortedAssetNames = [...currentAssetNames].naturalSort();
    } else {
      sortedAssetNames = [...originalAssetNames];
    }

    isSorted = JSON.stringify(currentAssetNames) === JSON.stringify(sortedAssetNames);
  }

  // Function to sort assets based on the type
  function sortAssets(type, applyNaturalSort) {
    fetchAndSortAssets(type, applyNaturalSort);
    if (!currentAssetNames.length) return;

    if (applyNaturalSort) originalAssetNames = [...currentAssetNames];

    let maxIterations = 1000;
    let iterations = 0;

    console.log("Current Asset Names:", currentAssetNames);
    console.log("Target Asset Names:", sortedAssetNames);

    while (!isSorted && iterations < maxIterations) {
      for (let i = 0; i < sortedAssetNames.length; i++) {
        const currentIndex = currentAssetNames.indexOf(sortedAssetNames[i]);
        if (currentIndex !== i) {
          console.log(`Reordering ${sortedAssetNames[i]} from ${currentIndex} to ${i}`);
          if (type === "costumes") {
            vm.editingTarget.reorderCostume(currentIndex, i);
          } else if (type === "sounds") {
            vm.editingTarget.reorderSound(currentIndex, i);
          } else if (type === "sprites") {
            vm.reorderTarget(currentIndex + 1, i + 1);
          }
          vm.emitTargetsUpdate();
          fetchAndSortAssets(type, applyNaturalSort);
          break;
        }
      }

      vm.emitTargetsUpdate();
      fetchAndSortAssets(type, applyNaturalSort);
      iterations++;
    }

    if (iterations >= maxIterations) {
      console.error("sortAssets - Possible infinite loop detected at 1000 iterations.");
    }

    console.log("Final Asset Names:", currentAssetNames);
    toggleDisableButton(true);
  }

  // Create and setup the menu item
  const menuItem = document.createElement("li");
  const menuItemLabel = document.createElement("span");

  menuItem.classList = addon.tab.scratchClass("menu_menu-item", "menu_hoverable");
  menuItem.appendChild(menuItemLabel);
  menuItem.onclick = () => handleMenuItemClick();

  function handleMenuItemClick() {
    if (!menuItem.classList.contains(addon.tab.scratchClass("menu-bar_disabled"))) {
      const assetType = menuItem.getAttribute("assetType");
      const selectedAssetName = document.querySelector(
        "[class*=sprite-selector-item_is-selected] [class*=sprite-selector-item_sprite-name]"
      ).innerText;

      sortAssets(assetType, true);

      const assetsWrapper =
        assetType === "sprites"
          ? document.querySelector("[class*=sprite-selector_items-wrapper]")
          : document.querySelector("[class*=selector_list-area]");
      const assets =
        assetType === "sprites"
          ? assetsWrapper.querySelectorAll("[class*=sprite-selector_sprite-wrapper]")
          : assetsWrapper.querySelectorAll("[class*=selector_list-item]");

      assets.forEach((asset) => {
        const assetName = asset.querySelector("[class*=sprite-selector-item_sprite-name]").innerText;
        if (assetName === selectedAssetName) {
          asset.click();
        }
      });

      addon.tab.redux.dispatch({ type: "scratch-gui/menus/CLOSE_MENU", menu: "editMenu" });
      setupRestoreFunction(assetType);
      shouldChangeRestoreButtonText = true;
    }
  }

  function setupRestoreFunction(type) {
    addon.tab.redux.dispatch({
      type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
      state: {
        restoreFun: () => restoreAssets(type),
        type: type,
      },
    });

    queueMicrotask(() => {
      shouldChangeRestoreButtonText = true;
    });
  }

  function restoreAssets(type) {
    if (originalAssetNames.length) {
      currentAssetNames = [...originalAssetNames];
      sortAssets(type, false);
    }
  }

  function toggleDisableButton(disable) {
    if (disable) {
      menuItem.classList.add(addon.tab.scratchClass("menu-bar_disabled"));
    } else {
      menuItem.classList.remove(addon.tab.scratchClass("menu-bar_disabled"));
    }
  }

  const assetTypes = ["sprites", "costumes", "sounds"];
  let editMenu;

  addon.self.addEventListener("disabled", () => (menuItem.style.display = "none"));
  addon.self.addEventListener("reenabled", () => {
    menuItem.style.display = "block";
    if (addon.tab.redux.state.scratchGui.menus.editMenu) {
      editMenu.appendChild(menuItem);
    }
  });

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", handleStateChanged);

  async function handleStateChanged(action) {
    if (action.detail.action.type === "scratch-gui/menus/OPEN_MENU" && action.detail.action.menu === "editMenu") {
      editMenu = await addon.tab.waitForElement("[class*=menu_right]", { markAsSeen: true });

      if (!addon.self.disabled) {
        const assetType = assetTypes[addon.tab.redux.state.scratchGui.editorTab.activeTabIndex];
        menuItemLabel.textContent = msg(assetType);
        menuItem.setAttribute("assetType", assetType);

        fetchAndSortAssets(assetType, true);
        toggleDisableButton(isSorted);

        if (addon.tab.redux.state.scratchGui.menus.editMenu) {
          editMenu.appendChild(menuItem);
        }
      }
    }

    const e = action.detail;
    if (e.action && e.action.type === "scratch-gui/restore-deletion/RESTORE_UPDATE") {
      shouldChangeRestoreButtonText = false;
    }
  }

  while (true) {
    const restoreButton = await addon.tab.waitForElement(
      '[class*="menu-bar_menu-bar-item_"]:nth-child(4) [class*="menu_menu-item_"]:first-child > span',
      {
        markAsSeen: true,
        reduxCondition: (state) => state.scratchGui.menus.editMenu,
        condition: () => shouldChangeRestoreButtonText,
      }
    );

    restoreButton.innerText = "Restore previous order";
  }
}
