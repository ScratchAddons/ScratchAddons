export default async function ({ addon, global, console }) {
  let spritesContainer = document.querySelector('[class^="sprite-selector_items-wrapper"]');
  let searchBox = document.createElement("input");
  searchBox.setAttribute("type", "search");
  searchBox.setAttribute("placeholder", "Search sprites...");
  searchBox.setAttribute("id", "sa-sprite-search-box");
  searchBox.setAttribute("autocomplete", "off");

  await addon.tab.waitForElement('[class^="sprite-selector_items-wrapper"]');

  let spriteSelectorContainer = document.querySelector('[class^="sprite-selector_scroll-wrapper"]');
  spriteSelectorContainer.insertBefore(searchBox, spritesContainer);

  addon.tab.displayNoneWhileDisabled(searchBox, { display: "block" });
  addon.self.addEventListener("disabled", () => {
    for (let i = 0; i < spritesContainer.children.length; i++) {
      spritesContainer.children[i].style.display = "block";
    }
  });
  addon.self.addEventListener("reenabled", () => {
    searchBox.value = "";
  });

  searchBox.oninput = () => {
    if (searchBox.value) {
      for (let i = 0; i < spritesContainer.children.length; i++) {
        if (
          spritesContainer.children[i].children[0].children[1].innerText
            .toLowerCase()
            .includes(searchBox.value.toLowerCase())
        ) {
          spritesContainer.children[i].style.display = "block";
        } else if (
          spritesContainer.children[i].children[0].children[2].children[0].innerText
            .toLowerCase()
            .includes(searchBox.value.toLowerCase()) &&
          spritesContainer.children[i].children[0].classList.contains("sa-folders-folder")
        ) {
          spritesContainer.children[i].style.display = "block";
        } else {
          spritesContainer.children[i].style.display = "none";
        }
      }
    } else {
      for (let i = 0; i < spritesContainer.children.length; i++) {
        spritesContainer.children[i].style.display = "block";
      }
    }
  };

  while (true) {
    await addon.tab.waitForElement("div[class^='sprite-selector_items-wrapper']", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    spritesContainer = document.querySelector('[class^="sprite-selector_items-wrapper"]');
    spriteSelectorContainer = document.querySelector('[class^="sprite-selector_scroll-wrapper"]');
    spriteSelectorContainer.insertBefore(searchBox, spritesContainer);
  }
}
