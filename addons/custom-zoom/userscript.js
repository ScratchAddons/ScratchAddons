export default async function ({ addon, global, console }) {
  async function setZoom(e) {
    //Function to set the custom zoom parameters
    if (!global.Blockly) return;

    if (e.detail.newUrl.includes("/editor")) {
      //Set the zoom parameters
      global.Blockly.getMainWorkspace().options.zoomOptions.maxScale = addon.settings.get("maxZoom") / 100;
      global.Blockly.getMainWorkspace().options.zoomOptions.minScale = addon.settings.get("minZoom") / 100;
      global.Blockly.getMainWorkspace().options.zoomOptions.startScale = addon.settings.get("startZoom") / 100;
      global.Blockly.getMainWorkspace().options.zoomOptions.scaleSpeed = 1.2 * (addon.settings.get("zoomSpeed") / 100);
    }

    if (!defaultTranslate) {
      //If the default position is not saved, save it
      defaultTranslate = global.Blockly.getMainWorkspace().zoomControls_.svgGroup_.attributes.transform.value;
      if (addon.settings.get("fixheight")) {
        let y = defaultTranslate.substring(defaultTranslate.indexOf(",") + 1, defaultTranslate.length - 1);
        defaultTranslate = defaultTranslate.replace(y + ")", `${y - 35})`);
      }
      global.Blockly.getMainWorkspace().zoomControls_.svgGroup_.attributes.transform.value = defaultTranslate;
    }

    if (!defaultRect) {
      //If the origional position of the zoom controls is not saved, save it
      global.Blockly.getMainWorkspace().zoomControls_.svgGroup_.style.transition = `0s ease-in-out`;
      defaultRect = global.Blockly.getMainWorkspace().zoomControls_.svgGroup_.getBoundingClientRect();
    }

    try {
      document.removeEventListener("mousemove", onMouseMove); //Remove the mousemove listener, if it exists
    } catch {}

    if (e.detail.newUrl.includes("/editor")) document.addEventListener("mousemove", onMouseMove); //If in the editor, add the mousemove listener
  }

  function hideShow(inArea = false, speed = "default") {
    //Function to hide/show the zoom controls
    let speeds = {
      none: "0",
      short: "0.25",
      default: "0.5",
      long: "1",
    };

    if (!addon.settings.get("autohide")) return;

    if (!global.Blockly) return;
    //Get the svg element of the controls
    let controls = global.Blockly.getMainWorkspace().zoomControls_.svgGroup_;

    controls.style.transition = `${speeds[speed]}s ease-in-out`; //Set the animation speed

    if (!inArea) {
      //Mouse is not hovering where the controls normally are
      let val = defaultTranslate;
      let x = val.substring(val.indexOf("(") + 1, val.indexOf(","));
      let y = val.substring(val.indexOf(","));
      x = Number(x) + 80;
      let translateCode = "translate(" + x.toString() + y;

      controls.attributes.transform.value = translateCode;
    } else {
      controls.attributes.transform.value = defaultTranslate || "";
    }
  }
  function onMouseMove(e) {
    //Function for mousemove listener
    let val = defaultTranslate;
    let x = val.substring(val.indexOf("(") + 1, val.indexOf(","));
    let y = val.substring(val.indexOf(","));
    x = Number(x) + 80;
    let translateCode = "translate(" + x.toString() + y;
    let ctrlTrnsfrm = global.Blockly.getMainWorkspace().zoomControls_.svgGroup_.attributes.transform;

    if (ctrlTrnsfrm.value !== defaultTranslate && ctrlTrnsfrm.value !== translateCode) {
      let controls = global.Blockly.getMainWorkspace().zoomControls_.svgGroup_;
      controls.style.transition = `0s ease-in-out`;
      //Window has been resized and the gui has automatically updated the control position
      //We now need to update our default values
      val = ctrlTrnsfrm.value;
      x = val.substring(val.indexOf("(") + 1, val.indexOf(","));
      y = val.substring(val.indexOf(","));
      x = Number(x) + 80;
      defaultTranslate = controls.attributes.transform.value;
      controls.attributes.transform.value = defaultTranslate;
      setTimeout(function () {
        defaultRect = global.Blockly.getMainWorkspace().zoomControls_.svgGroup_.getBoundingClientRect();
      }, 0);
    }

    setZoom({ detail: { newUrl: window.location.href } });
    hideShow(e.x >= defaultRect.left && e.y >= defaultRect.top, addon.settings.get("speed"));
  }

  await addon.tab.waitForElement(".blocklyZoom"); //Wait for controls
  await window.Blockly; //Wait for Blockly
  global.Blockly = window.Blockly;
  let defaultTranslate, defaultRect;
  setZoom({ detail: { newUrl: window.location.href } });
  addon.tab.addEventListener("urlChange", setZoom);
}
