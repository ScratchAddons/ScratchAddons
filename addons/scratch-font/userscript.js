export default async function ({ addon, console }) {
  const paper = await addon.tab.traps.getPaper();
  const updateImage = paper.tool.onUpdateImage.bind("paper.tool");

  function setScratchFont() {
    previewScratchFont();
    document.querySelector("[class*='font-dropdown_mod-unselect']").click();
    paper.tool.onUpdateImage.bind("paper.tool");
  }

  function previewScratchFont() {
    paper.tool.changeFont("Scratch");
    document.querySelector(
      "[class*='font-dropdown_displayed-font-name']"
    ).className =
      "font-dropdown_scratch " +
      addon.tab.scratchClass("font-dropdown_displayed-font-name");
  }

  function addFontButton(fontDropdown) {
    const menuItem = document.createElement("span");
    menuItem.className =
      addon.tab.scratchClass("button_button") +
      " " +
      addon.tab.scratchClass("font-dropdown_mod-menu-item");
    menuItem.role = "button";
    menuItem.addEventListener("click", setScratchFont);
    menuItem.addEventListener("mouseover", previewScratchFont);

    const scratchItem = document.createElement("span");
    scratchItem.textContent = "Scratch";
    scratchItem.className = "font-dropdown_scratch";

    menuItem.appendChild(scratchItem);
    fontDropdown.appendChild(menuItem);
  }

  function observeDisplayedFont(displayedFontName) {
    displayedFontName.style.fontFamily = paper.tool.font;
    let observer = new MutationObserver((mutationRecords) => {
      displayedFontName.style.fontFamily = paper.tool.font;
    });
    observer.observe(displayedFontName, {
      subtree: true,
      characterDataOldValue: true,
    });
  }

  while (true) {
    const elem = await addon.tab.waitForElement(
      "[class*='font-dropdown_mod-context-menu'], [class*='font-dropdown_displayed-font-name']",
      {
        markAsSeen: true,
      }
    );
    if (elem.className.includes("font-dropdown_mod-context-menu"))
      addFontButton(elem);
    else observeDisplayedFont(elem);
  }
}
