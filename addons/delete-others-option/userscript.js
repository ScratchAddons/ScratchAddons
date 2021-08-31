var addonGlobal;

import {insertAfter, queryByText, removeClassContainingText, getSiblings, getMutationAddedNode} from "./utils.js";

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

function mutationCallback(mutationsList, observer) {
    mutationsList.forEach((mutation) => {
        const addedNode = getMutationAddedNode(mutation)
        if(addedNode && addedNode.nodeType === 1){
            addedNode.querySelectorAll(".react-contextmenu").forEach((contextMenu) => {
               addDeleteOthersOption(contextMenu)
            })
        }
    });
}

export default async ({ addon, console }) => {
    addonGlobal = addon
    const tabs = document.querySelectorAll('[role="tab"]');
    const config = { childList: true, subtree: true };
    var observer = null;

    tabs.forEach((tab) => {
        tab.addEventListener("click", (e) => {
            if (["Costumes", "Backdrops"].includes(tab.textContent)) {
                const tabPanel = document.querySelector("#react-tabs-3")
                console.log("costume/backdrop clicked")
                observer = new MutationObserver(mutationCallback);
                // Start observing the tab panel for configured mutations
                observer.observe(tabPanel, config);
            } else {
                // If the costume/backdrop tab is left then disconnect the observer
                if (observer) {
                    console.log("observer disconnected")
                    observer.disconnect();
                }
            }
        });
    })
};