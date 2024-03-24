export default async function ({ addon, console }) {
  let originalBackpack;

  // Event listeners that add dynamic enable/disable
  addon.self.addEventListener("reenabled", () => changeBackpackVisibility());
  addon.self.addEventListener("disabled", () => {
    moveResizeButtons(0);
    originalBackpack.style.display = "block";
    window.dispatchEvent(new Event("resize"));
  });

  while (true) {
    originalBackpack = await addon.tab.waitForElement("[class^=backpack_backpack-header_]", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    if (!addon.self.disabled) changeBackpackVisibility();
  }

  function changeBackpackVisibility() {
    originalBackpack.style.display = "none";
    let backpackEl = document.querySelector(".sa-backpack-button");
    if (backpackEl) {
      moveResizeButtons(36);
    } else {
      createBackpackButton(addon);
    }
    document.body.classList.toggle("sa-backpack-open", isBackpackOpen());
    window.dispatchEvent(new Event("resize"));
  }
}

function isBackpackOpen() {
  return !!document.querySelector("[class^=backpack_backpack-list_]");
}

// Create default backpack button
function createBackpackButton(addon) {
  let backpackButton = document.createElement("div");
  backpackButton.classList.add("sa-backpack-button");
  // Can't use displayNoneWhileDisabled because it updates after the resize event
  backpackButton.style.display = "none"; // overridden by userstyle if the addon is enabled
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
  if (isBackpackOpen()) {
    // Backpack is open and will be closed
    document.body.classList.remove("sa-backpack-open");
  } else {
    // Backpack is closed and will be opened
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
