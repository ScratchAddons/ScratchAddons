import { insertAfter, removeClassContainingText, getAncestorWithClass, getAncestorWithId } from "./utils.js";

export default async ({ addon, console }) => {
    const vm = addon.tab.traps.vm;
    function getRestoreCostumeFun(deletedCostumes){

        if (deletedCostumes) {
            vm.runtime.emitProjectChanged();
            return () => {
                for(var i = 0; i <= deletedCostumes.length -1; i++){
                    vm.editingTarget.addCostume(deletedCostumes[i]);
                }
                vm.emitTargetsUpdate();
            };
        }
        return null
    }
    function deleteOtherCostumes(contextMenu) {
        // this works for both costumes and backdrops since backdrops use costumes under the hood.
        const currentCostumeSelector = contextMenu.parentNode.parentNode;
        const costumeSelectorsContainer = currentCostumeSelector.parentNode;
        const costumeSelectors = Array.from(costumeSelectorsContainer.children);
        const deletedCostumes = []
        for (var i = costumeSelectors.length - 1; i >= 0; i--) {
            const costumeSelector = costumeSelectors[i];
            if (costumeSelector !== currentCostumeSelector) {
                const deletedCostume = vm.editingTarget.sprite.deleteCostumeAt(i);
                if(deletedCostume){
                    deletedCostumes.push(deletedCostume);
                }
            }
        }
        vm.editingTarget.setCostume(0);

        // triggers a react re-render, which closes the context menu and removes deleted costumes
        vm.runtime.emitProjectChanged();

        addon.tab.redux.dispatch({
            type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
            state: { restoreFun: getRestoreCostumeFun(deletedCostumes), deletedItem: "Costume" },
        });
    }

    function deleteOthersEvent(contextMenu, deleteOthersNode){
        // prompt user with confirmation dialog
        if (!confirm("Are you sure you want to delete all other costumes?")) {
            return;
        }

        // dispatch contextmenu event to force react to hide the contextmenu
        var ev = document.createEvent('HTMLEvents');
        ev.initEvent('contextmenu', true, false);
        contextMenu.dispatchEvent(ev);
                
        deleteOtherCostumes(contextMenu);

        // remove delete others option
        deleteOthersNode.remove();
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
            insertAfter(deleteOthersNode, deleteNode);
            deleteOthersNode.addEventListener("click", (e) => {
                deleteOthersEvent(contextMenu, deleteOthersNode)
            });
        }
    }
  }

    document.addEventListener("contextmenu", (e) => {
        // check user right clicked on a context menu inside react tab 3
        const contextMenuWrapper = getAncestorWithClass(e.target, "react-contextmenu-wrapper");
        const tab = getAncestorWithId(e.target, "react-tabs-3");
        if (!contextMenuWrapper || !tab) {
            return;
        }

        // check more than one costumeSelector exists
        const costumeSelectors = contextMenuWrapper.parentNode.parentNode.children;
        if (costumeSelectors.length < 2) {
            return;
        }

        addDeleteOthersOption(contextMenuWrapper.querySelector(".react-contextmenu"));
    });
};
