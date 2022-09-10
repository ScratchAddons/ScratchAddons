export default async function ({ addon }) {
  let originalBackpack = await addon.tab.waitForElement("[class^=backpack_backpack-header_]", {
    markAsSeen: true,
  });

  changeBackpackVisibility(addon);

  // Event listeners that add dynamic enable/disable + setting change
  addon.settings.addEventListener("change", () => changeBackpackVisibility(addon));
  addon.self.addEventListener("reenabled", () => changeBackpackVisibility(addon));
  addon.self.addEventListener("disabled", () => {
    moveResizeButtons(0);
    originalBackpack.style.display = "block";
    window.dispatchEvent(new Event("resize"));
    document.querySelector(".sa-backpack-button").style.display = "none";
  });

  function changeBackpackVisibility(addon) {
    originalBackpack.style.display = "none";
    let backpackEl = document.querySelector(".sa-backpack-button");
    if (addon.settings.get("showButton")) {
      if (backpackEl) {
        moveResizeButtons(36);
      } else {
        createBackpackButton(addon);
      }
    } else {
      if (document.querySelector("[class^=backpack_backpack-list-inner_]"))
        originalBackpack.click();
      moveResizeButtons(0);
    }
    window.dispatchEvent(new Event("resize"));
  }
}

// Create default backpack button
function createBackpackButton(addon) {
  let backpackButton = document.createElement("div");
  backpackButton.classList.add("sa-backpack-button");
  backpackButton.style.display = "none"; // overridden by userstyle if the setting is enabled
  backpackButton.title = addon.tab.scratchMessage("gui.backpack.header");
  backpackButton.addEventListener("click", toggleBackpack);
  backpackButton.appendChild(
    Object.assign(document.createElement("img"), {
      src: `${addon.self.dir}/backpack.svg`,
      alt: "",
    })
  );
  moveResizeButtons(36);

  document.querySelector("[class*='gui_tabs_']").appendChild(backpackButton);
}

// Open backpack (we need to close it to refresh)
function toggleBackpack() {
  if (document.querySelector("[class^=backpack_backpack-list-inner_]")) {
    // Backpack is open and will be closed
    document.body.classList.remove("sa-backpack-open");
  } else {
    // Bacpack is closed and will be opened
    document.body.classList.add("sa-backpack-open");
  }
  document.querySelector("[class^=backpack_backpack-header_]").click();
  window.dispatchEvent(new Event("resize"));
}

// Move resize buttons to top
function moveResizeButtons(distance) {
  const resizeElements = document.querySelectorAll(".blocklyZoom > image");
  resizeElements[0].setAttribute("y", (44 - distance).toString());
  resizeElements[1].setAttribute("y", (0 - distance).toString());
  resizeElements[2].setAttribute("y", (88 - distance).toString());
}
