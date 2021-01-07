export default async ({ addon,console }) => { 
    var manualPress = false;
    // shamelessly stolen from animated-thumb/persistent-thumb.js
    const xhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, path, ...args) {
        if (method === "put" && String(path).startsWith("https://projects.scratch.mit.edu/")){
            if(!manualPress) method = "OPTIONS";
        }
        return xhrOpen.call(this, method, path, ...args);
    };
    //initial adding of the observers and refreshing
    addMutationListeners();
    addon.tab.addEventListener("urlChange", function(event) { addMutationListeners(); });

    async function addMutationListeners(){
        //add a function to the "Save Now" button to disable request interception if it was a manual save
        var saveContainer = await addon.tab.waitForElement("[class^='menu-bar_account-info-group']", {markAsSeen: true,});
        saveContainer = saveContainer.childNodes[0];
        const saveObserver = new MutationObserver(function (mutations) {
            if(saveContainer.childNodes[0]){
                if(saveContainer.childNodes[0].className.startsWith("save-status_save-now")){
                    manualPress = false;
                    saveContainer.childNodes[0].addEventListener("click", function(){manualPress = true;})
                }
            }
        });
        saveObserver.observe(saveContainer, { childList: true, });
        var alertContainer = await addon.tab.waitForElement("[class^='alerts_alerts-inner-container']", {markAsSeen: true,});
        //edgecase: exit editor and enter editor
        if(addon.tab.editorMode == "editor" && alertContainer.childNodes[0] !== undefined){
            alertContainer.childNodes[0].style.visibility = "hidden";
        }
        //hide the "can't save" warnings scratch gives us (don't worry, there won't be any zombie warnings)
        const alertObserver = new MutationObserver(function (mutations) {
            if(alertContainer.childNodes[0]){
                if(manualPress){
                    alertContainer.childNodes[0].style.visibility = "";
                    alertContainer.childNodes[0].childNodes[1].childNodes[0].addEventListener("click", function(){manualPress = true;})
                    manualPress = false;
                }else alertContainer.childNodes[0].style.visibility = "hidden";
            }
        });
        alertObserver.observe(alertContainer, { childList: true, });
    }
};