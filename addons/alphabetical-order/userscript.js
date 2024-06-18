import { assetSelect} from "../asset-conflict-dialog/utils.js";

export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;

  function getAssetName(asset) {
    return asset.hasOwnProperty("sprite") ? asset.sprite.name : asset.name;
  }

  function compareAssetsByName(a, b) {
    return String(getAssetName(a)).localeCompare(String(getAssetName(b)), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  function isSortedAscending(arr, compare) {
    return arr.every((v, i) => i === 0 || compare(arr[i - 1], v) <= 0);
  }

  function getTargetAssetsByType(target, type) {
    return type === "costumes" ? target.sprite.costumes : type === "sounds" ? target.sprite.sounds : vm.runtime.targets;
  }

  function setTargetAssetsByType(target, type, assets) {
    return type === "costumes"
      ? (target.sprite.costumes = assets)
      : type === "sounds"
      ? (target.sprite.sounds = assets)
      : (vm.runtime.targets = assets);
  }

  function getSelectedAssetName(){
    return document.querySelector(
      "[class*=sprite-selector-item_is-selected] [class*=sprite-selector-item_sprite-name]"
    ).innerText;
  }

  function selectAssetByName(assets, assetName, assetType){
    if (assetType !== 'sprites') assetSelect(
      addon,
      assets.findIndex((e) => getAssetName(e) === assetName),
      assetType === 'costumes' ? 'costume' : 'sound'
    )
  }

  function wrapReplaceNameWithNameToIdUpdate(originalFunc, type){
    return function(...args) {
      // we only perform an update if the target and type match up with the target and type from when the user did the reorder operation
      if (vm.editingTarget !== targetAndType[0] || type !== targetAndType[1]) return originalFunc.apply(this, args);

      const [idxOrId, newName] = args;
      const asset =
        type === "sprites" ? vm.runtime.getTargetById(idxOrId) : getTargetAssetsByType(vm.editingTarget, type)[idxOrId];
      const oldName = getAssetName(asset);

      if (nameToOriginalIdx.has(oldName)) {
        const value = nameToOriginalIdx.get(oldName);
        nameToOriginalIdx.set(newName, value);
        nameToOriginalIdx.delete(oldName);
      }

      return originalFunc.apply(this, args);
    };
  }

  function restoreAssetsOrder(assetType) {
    // This will still work even if assets are renamed or new assets are added
    // however if assets are deleted it will break. So we assume that asset deletion, deactivates the restore function
    const selectedAssetName = getSelectedAssetName();
    let assetArray = getTargetAssetsByType(vm.editingTarget, assetType);
    let newAssets = new Array (nameToOriginalIdx.size);
    const leftovers = [];
    assetArray.forEach((asset) => {
      const newIdx = nameToOriginalIdx.get(getAssetName(asset));
      if (newIdx === undefined) {
        leftovers.push(asset);
      } else {
        newAssets[newIdx] = asset;
      }
    });
    newAssets = newAssets.concat(leftovers);
    setTargetAssetsByType(vm.editingTarget, assetType, newAssets);

    // reselect the asset that was selected before the sort
    selectAssetByName(newAssets, selectedAssetName, assetType);

    // update to make sure what we see on screen correctly matches the array
    vm.emitTargetsUpdate()
  }

  function sortAssetsAlphabetically() {
    const assetType = menuItem.getAttribute("assetType");
    const selectedAssetName = getSelectedAssetName();
    const assets = getTargetAssetsByType(vm.editingTarget, assetType);

    // get the id to original index map for use when restoring the order
    nameToOriginalIdx = new Map();
    assets.forEach((asset, idx) => nameToOriginalIdx.set(getAssetName(asset), idx));
    targetAndType = [vm.editingTarget, assetType];

    // sort assets alphabetically
    if (assetType === "sprites") {
      // in the case ordering sprites we must ensure that the stage remains untouched
      assets.splice(1, assets.length - 1, ...assets.slice(1).sort(compareAssetsByName));
    } else {
      assets.sort(compareAssetsByName);
    }

    // reselect the asset that was selected before the sort
    selectAssetByName(assets, selectedAssetName, assetType);

    // update to make sure what we see on screen correctly matches the array
    vm.emitTargetsUpdate()

    // dispatch the redux event to close the menu and create the restore order button
    addon.tab.redux.dispatch({ type: "scratch-gui/menus/CLOSE_MENU", menu: "editMenu" });

    addon.tab.redux.dispatch({
      type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
      state: {
        restoreFun: () => restoreAssetsOrder(assetType),
        deletedItem: assetType,
        isRestoreOrder: true,
      },
    });

    restoreOrderFunctionIsActive = true;
  }

  async function handleEditMenuOpened() {
    editMenu = await addon.tab.waitForElement("[class*=menu_right]", { markAsSeen: true });
    if (!addon.self.disabled) {
      // if the restorOrder function is active then we hijack the restore button to use as it's action button
      if (restoreOrderFunctionIsActive) {
        const restoreButton = await addon.tab.waitForElement(
          '[class*="menu-bar_menu-bar-item_"]:nth-child(4) [class*="menu_menu-item_"]:first-child > span'
        );
        restoreButton.innerText = "Restore previous order";
      }

      // handle adding the sortAlphabetical button to the edit menu
      const tabIndex = addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
      const assetType = ["sprites", "costumes", "sounds"][tabIndex];
      const assetArray = getTargetAssetsByType(vm.editingTarget, assetType);
      const slicedAssetArray = assetType === "sprites" ? assetArray.slice(1) : assetArray;
      const isSorted = isSortedAscending(slicedAssetArray, compareAssetsByName);
      menuItem.classList.toggle(addon.tab.scratchClass("menu-bar_disabled"), isSorted);

      if (addon.tab.redux.state.scratchGui.menus.editMenu) {
        menuItemLabel.textContent = msg(assetType);
        menuItem.setAttribute("assetType", assetType);
        editMenu.appendChild(menuItem);
      }
    }
  }

  function handleStateChangedEvents(action) {
    const isEditMenuOpenedUpdate =
      action.detail.action.type === "scratch-gui/menus/OPEN_MENU" && action.detail.action.menu === "editMenu";
    const isRestoreUpdate =
      action.detail.action && action.detail.action.type === "scratch-gui/restore-deletion/RESTORE_UPDATE";

    if (isEditMenuOpenedUpdate) handleEditMenuOpened();
    if (isRestoreUpdate && !action.detail.action.hasOwnProperty("isRestoreOrder")) restoreOrderFunctionIsActive = false;
  }

  // initialize module level variables to handle async changes
  let editMenu;
  let restoreOrderFunctionIsActive = false;
  let nameToOriginalIdx = new Map();
  let targetAndType = [null, null]; // used so we can know when we should update the nameToOriginalIdx map

  // Create the menu item in the 'Edit' menu that when clicked triggers the alphabetical sort
  const menuItem = document.createElement("li");
  const menuItemLabel = document.createElement("span");
  menuItem.classList = addon.tab.scratchClass("menu_menu-item", "menu_hoverable");
  menuItem.appendChild(menuItemLabel);
  menuItem.onclick = () => {
    if (menuItem.classList.contains(addon.tab.scratchClass("menu-bar_disabled"))) return;
    sortAssetsAlphabetically();
  };

  // handle the menu already being opened, and the addon being disabled/enabled
  addon.self.addEventListener("disabled", () => (menuItem.style.display = "none"));
  addon.self.addEventListener("reenabled", () => {
    menuItem.style.display = "block";
    if (addon.tab.redux.state.scratchGui.menus.editMenu) {
      editMenu.appendChild(menuItem);
    }
  });

  // add an event listener for state changes, that will handle the edit menu opening and setting our restore function to inactive
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", handleStateChangedEvents);

  // pollute asset renaming functions to make sure `originalNameToId` stays accurate despite name changes
  vm.renameCostume = wrapReplaceNameWithNameToIdUpdate(vm.renameCostume, "costumes");
  vm.renameSound = wrapReplaceNameWithNameToIdUpdate(vm.renameSound, "sounds");
  vm.renameSprite = wrapReplaceNameWithNameToIdUpdate(vm.renameSprite, "sprites");
}
