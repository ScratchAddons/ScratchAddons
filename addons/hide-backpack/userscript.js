export default async function ({ addon, global }) {

  // Fix automatic enable bug
  window.dispatchEvent(new Event("resize"));
  
  addon.settings.addEventListener("change", function() { 
    let backpackEl = document.querySelector(".sa-backpack-button")
    if (addon.settings.get("showButton")) {
      if (backpackEl) {
        backpackEl.style.display = "inline-block";
        moveResizeButtons();
      } else {
        createBackpackButton();
      }
    } else {
      document.querySelector(".sa-backpack-button").style.display = "none";
    }
  });
  createBackpackButton(addon);
}

let open = true;

function createBackpackButton(addon) {
  if (!addon.settings.get("showButton")) return;
  
  let backpackButton = document.createElement("div");  
  backpackButton.style.backgroundImage = `url('${addon.self.dir}/backpack.svg')`; 
  backpackButton.classList.add("sa-backpack-button");
  backpackButton.addEventListener("click", toggleBackpack);
  
  moveResizeButtons();
  
  document.querySelector(".injectionDiv").appendChild(backpackButton);
  
  addSoundEditorButton(addon, backpackButton);
  addCostumeEditorButton(addon, backpackButton);
}

async function addSoundEditorButton(addon, backpackButton) {
  while (true) {
    const container = await addon.tab.waitForElement("[class^=sound-editor_editor-container]", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 2 && !state.scratchGui.mode.isPlayerOnly,
    });
    let soundBackpackButton = backpackButton.cloneNode();
    container.querySelector("[class^='sound-editor_row_']").appendChild(soundBackpackButton);
    soundBackpackButton.addEventListener("click", toggleBackpack);
  }
}

async function addCostumeEditorButton(addon, backpackButton) {
  while (true) {
    const container = await addon.tab.waitForElement("[class^=paint-editor_editor-container]", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    let costumeBackpackButton = backpackButton.cloneNode();
    container.querySelector("[class^='paint-editor_row_']").appendChild(costumeBackpackButton);
    costumeBackpackButton.addEventListener("click", toggleBackpack);
  }
}

function toggleBackpack() {
  open = !open;
  if (open) {
    document.querySelector("[class^='backpack_backpack-container']").style.display = "none";
  } else {
    document.querySelector("[class^='backpack_backpack-container']").style.display = "block";
  }
  window.dispatchEvent(new Event("resize"));
} 

function moveResizeButtons() {
  // Move resize buttons to top
  var resizeElements = document.querySelectorAll(".blocklyZoom > image");
  resizeElements[0].setAttribute("y", "5")
  resizeElements[1].setAttribute("y", "-39")
  resizeElements[2].setAttribute("y", "49")
}
