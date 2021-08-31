var addonGlobal;

import {insertAfter, queryByText, removeClassContainingText, getAncestorWithClass} from "./utils.js";

function deleteOtherCostumes(contextMenu){
    console.log("delete others event called")
    const currentCostumeSelector = contextMenu.parentNode.parentNode
    const costumeSelectorsContainer = currentCostumeSelector.parentNode
    const costumeSelectors = Array.from(costumeSelectorsContainer.children)
    for(var i = costumeSelectors.length-1;i>=0;i--){
        const costumeSelector = costumeSelectors[i]
        if(costumeSelector !== currentCostumeSelector){
            contextMenu = costumeSelector.querySelector(".react-contextmenu")
            //const deleteBtn = queryByText(contextMenu,"delete")
            //console.log(i, deleteBtn.outerHTML)
            //deleteBtn.click();
            const restoreCostumeFun = addonGlobal.tab.traps.vm.deleteCostume(i);
            addonGlobal.tab.redux.dispatch({ 
                type: 'scratch-gui/restore-deletion/RESTORE_UPDATE',
                state: { restoreFun: restoreCostumeFun, deletedItem: 'Costume' }
            });
        }
       
    }
}

function addDeleteOthersOption(contextMenu){
    const deleteNode = queryByText(contextMenu, "delete");
    if (deleteNode) {
        const deleteOthersNode = deleteNode.cloneNode();
        deleteOthersNode.textContent = "delete others";
        removeClassContainingText(deleteOthersNode.classList, "border")
        deleteOthersNode.addEventListener("click", (e)=>{
            deleteOtherCostumes(contextMenu)
        })

        insertAfter(deleteOthersNode, deleteNode);
        console.log("added delete option")
    }
}

export default async ({ addon, console }) => {
    addonGlobal = addon
    document.addEventListener("contextmenu", (e)=>{ 
        const contextMenuWrapper = getAncestorWithClass(e.target, "react-contextmenu-wrapper");
        if(contextMenuWrapper){
            addDeleteOthersOption(contextMenuWrapper.querySelector(".react-contextmenu"))
        }
    })
};