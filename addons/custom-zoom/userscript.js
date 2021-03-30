export default async function ({ addon, global, console }) {
    function setZoom(e) {
        //Function to set the custom zoom parameters
        console.log("setting zoom", !!global.Blockly)
        if (!global.Blockly) return
        if (e.detail.newUrl.includes("/editor")) {
            //Set the zoom parameters
            global.Blockly.getMainWorkspace().options.zoomOptions.maxScale = addon.settings.get("maxZoom") / 100;
            global.Blockly.getMainWorkspace().options.zoomOptions.minScale = addon.settings.get("minZoom") / 100;
            global.Blockly.getMainWorkspace().options.zoomOptions.startScale = addon.settings.get("startZoom") / 100;
            global.Blockly.getMainWorkspace().options.zoomOptions.scaleSpeed = 1.2 * (addon.settings.get("zoomSpeed") / 100);
        }
        if (!defaultTranslate) {
            if (!global.Blockly.getMainWorkspace().zoomControls_) return;
            defaultTranslate = Blockly.getMainWorkspace().zoomControls_.attributes.transform.value;
            console.log(defaultTranslate)
        }
        if (!defaultRect) {
            if (!global.Blockly.getMainWorkspace().zoomControls_) return;
            defaultRect = global.Blockly.getMainWorkspace().zoomControls_.svgGroup_.getBoundingClientRect();
            console.log(defaultRect)
        }
        try {
            document.removeEventListener("mousemove", onMouseMove);
        } catch {}
        if (e.detail.newUrl.includes("/editor")) document.addEventListener("mousemove", onMouseMove);
        console.log(onMouseMove)
    }
    function hideShow(inArea = false, speed = "default") {
        let speeds = {
            none: "0",
            short: "0.25",
            default: "0.5",
            long: "1",
        };
        console.log(Blockly.getMainWorkspace().zoomControls_)
        if (!global.Blockly) return;
        let controls = global.getMainWorkspace().zoomControls_.svgGroup_;
        controls.style.transition = `${speeds[speed]}s ease-in-out`;
        if (inArea) {
            controls.attributes.transform.value = "translate(600,475)";
        } else {
            controls.attributes.transform.value = defaultTranslate || "";
        }
    }
    function onMouseMove(e) {
        setZoom({ detail: { newUrl: window.location.href } });
        hideShow(e.x >= defaultRext.left && e.x <= defaultRext.right && e.y >= defaultRext.top && e.y <= defaultRext.bottom, addon.settings.get("speed"));
    }
    await addon.tab.waitForElement(".blocklyZoom")
    await window.Blockly;
    global.Blockly = window.Blockly;
    console.log(global.Blockly)
    let defaultTranslate, defaultRect;
    setZoom({ detail: { newUrl: window.location.href } });
    addon.tab.addEventListener("urlChange", setZoom);
}
