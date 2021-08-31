var addonGlobal;

import { insertAfter, removeClassContainingText, getAncestorWithClass, getAncestorWithId } from "./utils.js";

function deleteOtherCostumes(contextMenu) {
  // this works for both costumes and backdrops since backdrops use costumes under the hood.
  const currentCostumeSelector = contextMenu.parentNode.parentNode;
  const costumeSelectorsContainer = currentCostumeSelector.parentNode;
  const costumeSelectors = Array.from(costumeSelectorsContainer.children);
  for (var i = costumeSelectors.length - 1; i >= 0; i--) {
    const costumeSelector = costumeSelectors[i];
    if (costumeSelector !== currentCostumeSelector) {
      contextMenu = costumeSelector.querySelector(".react-contextmenu");
      const restoreCostumeFun = addonGlobal.tab.traps.vm.deleteCostume(i);
      addonGlobal.tab.redux.dispatch({
        type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
        state: { restoreFun: restoreCostumeFun, deletedItem: "Costume" },
      });
    }
  }
}

function addDeleteOthersOption(contextMenu) {
  const existingDeleteOthers = contextMenu.querySelector(".delete-others");
  if (existingDeleteOthers) {
    return;
  }

  const deleteNode = contextMenu.querySelectorAll(".react-contextmenu-item")[2];
  if (deleteNode) {
    const deleteOthersNode = deleteNode.cloneNode();
    deleteOthersNode.textContent = "delete others";
    deleteOthersNode.classList.add("delete-others");
    removeClassContainingText(deleteOthersNode.classList, "border");
    deleteOthersNode.addEventListener("click", (e) => {
      deleteOtherCostumes(contextMenu);
    });

    insertAfter(deleteOthersNode, deleteNode);
  }
}

export default async ({ addon, console }) => {
  addonGlobal = addon;
  document.addEventListener("contextmenu", (e) => {
    // check user right clicked on a context menu inside react tab 3
    const contextMenuWrapper = getAncestorWithClass(e.target, "react-contextmenu-wrapper");
    const tab = getAncestorWithId(e.target, "react-tabs-3");
    if (!contextMenuWrapper || !tab) {
      return;
    }

    //Check more than one costumeSelector exists
    const costumeSelectors = contextMenuWrapper.parentNode.parentNode.children;
    if (costumeSelectors.length < 2) {
      return;
    }

    addDeleteOthersOption(contextMenuWrapper.querySelector(".react-contextmenu"));
  });
};
