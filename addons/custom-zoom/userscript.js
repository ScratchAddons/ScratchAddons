export default async function ({ addon, global, console }) {
  function setZoom(e) {
    //Function to set the custom zoom parameters
    if (!window.Blockly) {
      //Fallback to prevent errors, if Blockly is not defined a temporary object is created
      ///Use var instead of let to allow the variable to be used outside of this code block
      var Blockly = {
        getMainWorkspace: function() {
          return {
            options: {
              zoomOptions: {}
            }
          }; //Return fake options object
        },
      };
    };
    if (e.detail.newUrl.includes("/projects/") {
      //Set the zoom parameters
      Blockly.getMainWorkspace().options.zoomOptions.maxScale = addon.settings.get("maxZoom") / 100;
      Blockly.getMainWorkspace().options.zoomOptions.minScale = addon.settings.get("minZoom") / 100;
      Blockly.getMainWorkspace().options.zoomOptions.startScale = addon.settings.get("startZoom") / 100;
      Blockly.getMainWorkspace().options.zoomOptions.scaleSpeed = 1.2 * (addon.settings.get("zoomSpeed") / 100);
    }
  }
  setZoom({ detail: { newUrl: window.location.href } })
  addon.tab.addEventListener("urlChange", setZoom)
}
