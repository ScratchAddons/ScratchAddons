export default async function ({ addon, global, console, msg }) {
  //define turbowarp button elements
  function loadTurboButton() {
    if (document.querySelector("#scratchAddonsTurboBtn")) return;
    //console.log(addon.tab.editorMode);
    //(addon.tab.editorMode == "projectpage" || addon.tab.editorMode == "fullscreen")  //?
    
    if (addon.tab.editorMode == "projectpage") {
      addon.tab.waitForElement(".stage-header_stage-size-row_14N65").then(() => {
        const subactions = document.querySelector(".stage-header_stage-size-row_14N65");

        //const turboDiv = document.createElement("div");
        const turboSpan = document.createElement("span");

        const turbo = document.createElement("img");
        turboSpan.innerText = msg("turbo");
        turbo.className = "button_outlined-button_1bS__ stage-header_stage-button_hkl9B turbo-button";
        turbo.id = "scratchAddonsTurboBtn";
        turbo.src = addon.self.dir + "/turbo-ico.svg";
        turbo.title = "Go to TurboWarp";
        turbo.appendChild(turboSpan);

        var tSettings = "";
//console.log(addon.settings.get("HQPen"));

        if (addon.settings.get("HQPen") == true) {
          tSettings = "?" + "hqpen";
        }
        turbo.addEventListener("click", () => {
          window.location.href = `https://turbowarp.org/${
            window.location.href.split("projects")[1].split("/")[1]
          }` + tSettings;
        });
        if (addon.settings.get("buttonColor")) {
          turbo.style.backgroundColor = addon.settings.get("buttonColor");
        }
        var fullscreen = subactions.firstChild;
        subactions.replaceChild(turbo, fullscreen);
        subactions.appendChild(fullscreen);
      });
    }
  }

  loadTurboButton();
  addon.tab.addEventListener("urlChange", () => {
    loadTurboButton();
  });
}
