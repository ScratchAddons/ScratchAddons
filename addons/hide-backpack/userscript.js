export default async function ({ addon }) {
  let originalBackpack = await addon.tab.waitForElement("[class^=backpack_backpack-header_]", {
    markAsSeen: true,
  });
  originalBackpack.style.display = "none";

  if (addon.settings.get("showButton")) createBackpackButton(addon);

  // Event listeners that add dynamic enable/disable + setting change
  addon.settings.addEventListener("change", () => changeBackpackVisibility(addon));
  addon.self.addEventListener("reenabled", () => changeBackpackVisibility(addon));
  addon.self.addEventListener("disabled", () => {
    moveResizeButtons(0);
    window.dispatchEvent(new Event("resize"));
    document.querySelector("[class^=backpack_backpack-header_]").style.display = "block";
    document.querySelector(".sa-backpack-button").style.display = "none";
  });

  function changeBackpackVisibility(addon) {
    window.dispatchEvent(new Event("resize"));
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
  moveResizeButtons(35);

  document.querySelector(".injectionDiv").appendChild(backpackButton);
  document.querySelector("[class*='gui_tabs_']").appendChild(backpackButton);
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
