export default async function ({ addon, global }) {
  document.querySelector("[class^=backpack_backpack-header_]").style.display = "none";
  if (addon.settings.get("showButton")) createBackpackButton(addon);

  // Fix dynamic enable bug
  window.dispatchEvent(new Event("resize"));

  // Event listeners that add dynamic enable/disable + setting change
  addon.settings.addEventListener("change", (e) => changeBackpackVisibility(addon));

  addon.self.addEventListener("reenabled", (e) => changeBackpackVisibility(addon));
  addon.self.addEventListener("disabled", (e) => {
    moveResizeButtons(0);
    window.dispatchEvent(new Event("resize"));
    document.querySelector("[class^=backpack_backpack-header_]").style.display = "block";
    document.querySelector(".sa-backpack-button").style.display = "none";
  });

  function changeBackpackVisibility(addon) {
    document.querySelector("[class^=backpack_backpack-header_]").style.display = "none";
    let backpackEl = document.querySelector(".sa-backpack-button");
    if (addon.settings.get("showButton") === true) {
      if (backpackEl) {
        backpackEl.style.display = "inline-block";
        moveResizeButtons(35);
      } else {
        createBackpackButton(addon);
      }
    } else {
      if (document.querySelector("[class^=backpack_backpack-list-inner_]"))
        document.querySelector("[class^=backpack_backpack-header_]").click();
      moveResizeButtons(0);
      if (backpackEl) backpackEl.style.display = "none";
    }
  }
}

// Create default backpack button
function createBackpackButton(addon) {
  let backpackButton = document.createElement("div");
  backpackButton.style.backgroundImage = `url('${addon.self.dir}/backpack.png')`;
  backpackButton.classList.add("sa-backpack-button");
  backpackButton.addEventListener("click", toggleBackpack);
  document.querySelector(".injectionDiv").appendChild(backpackButton);

  moveResizeButtons(35);

  // Add backpack button to costume and sound editor
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

// Open backpack (we need to close it to refresh)
function toggleBackpack() {
  document.querySelector("[class^=backpack_backpack-header_]").click();
  if (document.querySelector("[class^=backpack_backpack-list-inner_]")) {
    document.querySelector("[class^='backpack_backpack-container']").style.display = "none";
  } else {
    document.querySelector("[class^='backpack_backpack-container']").style.display = "block";
  }
  window.dispatchEvent(new Event("resize"));
}

// Move resize buttons to top
function moveResizeButtons(distance) {
  const resizeElements = document.querySelectorAll(".blocklyZoom > image");
  resizeElements[0].setAttribute("y", (44 - distance).toString());
  resizeElements[1].setAttribute("y", (0 - distance).toString());
  resizeElements[2].setAttribute("y", (88 - distance).toString());
}
