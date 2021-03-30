export default async function ({ addon, global, console }) {
    async function setZoom(e) {
        //Function to set the custom zoom parameters
        if (!window.Blockly) {
            //Fallback to prevent errors, if Blockly is not defined a temporary object is created
            ///Use var instead of let to allow the variable to be used outside of this code block
            var Blockly = {
                getMainWorkspace: function () {
                    return {
                        options: {
                            zoomOptions: {},
                        },
                    }; //Return fake options object
                },
            };
        }
        if (e.detail.newUrl.includes("/editor")) {
            //Set the zoom parameters
            await Blockly.getMainWorkspace;
            Blockly.getMainWorkspace().options.zoomOptions.maxScale = addon.settings.get("maxZoom") / 100;
            Blockly.getMainWorkspace().options.zoomOptions.minScale = addon.settings.get("minZoom") / 100;
            Blockly.getMainWorkspace().options.zoomOptions.startScale = addon.settings.get("startZoom") / 100;
            Blockly.getMainWorkspace().options.zoomOptions.scaleSpeed = 1.2 * (addon.settings.get("zoomSpeed") / 100);
        }
        if (!defaultTranslate) {
            if (!Blockly.getMainWorkspace().zoomControls_) return;
            defaultTranslate = Blockly.getMainWorkspace().zoomControls_.attributes.transform.value;
        }
        if (!defaultRect) {
            if (!Blockly.getMainWorkspace().zoomControls_) return;
            defaultRect = Blockly.getMainWorkspace().zoomControls_.svgGroup_.getBoundingClientRect();
        }
        try {
            document.removeEventListener("mousemove", onMouseMove);
        } catch {}
        if (e.detail.newUrl.includes("/editor")) document.addEventListener("mousemove", onMouseMove);
    }
    function hideShow(inArea = false, speed = "default") {
        let speeds = {
            none: "0",
            short: "0.25",
            default: "0.5",
            long: "1",
        };
        if (!window.Blockly) return;
        let controls = Blockly.getMainWorkspace().zoomControls_.svgGroup_;
        controls.style.transition = `${speeds[speed]}s ease-in-out`;
        if (inArea) {
            controls.attributes.transform.value = "translate(600,475)";
        } else {
            controls.attributes.transform.value = defaultTranslate || "";
        }
    }
    function onMouseMove(e) {
        hideShow(e.x >= defaultRext.left && e.x <= defaultRext.right && e.y >= defaultRext.top && e.y <= defaultRext.bottom, addon.settings.get("speed"));
    }
    let defaultTranslate, defaultRect;
    setZoom({ detail: { newUrl: window.location.href } });
    addon.tab.addEventListener("urlChange", setZoom);
}
