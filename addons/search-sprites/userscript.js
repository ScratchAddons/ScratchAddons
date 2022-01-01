export default async function ({ addon, global, console }) {
  let spritesContainer;
  let spriteSelectorContainer;

  const searchBox = document.createElement("input");
  searchBox.setAttribute("type", "search");
  searchBox.setAttribute("placeholder", "Search sprites...");
  searchBox.setAttribute("id", "sa-sprite-search-box");
  searchBox.setAttribute("autocomplete", "off");

  const search = (query) => {
    if (!spritesContainer) return;

    query = query.toLowerCase();
    const containsQuery = (str) => str.toLowerCase().includes(query);

    for (const sprite of spritesContainer.children) {
      const visible = (
        !query ||
        containsQuery(sprite.children[0].children[1].innerText) ||
        (
          containsQuery(sprite.children[0].children[2].children[0].innerText) &&
          sprite.children[0].classList.contains("sa-folders-folder")
        )
      );
      sprite.style.display = visible ? "" : "none";
    }
  };

  addon.tab.displayNoneWhileDisabled(searchBox, {
    display: "block"
  });
  addon.self.addEventListener("disabled", () => {
    search("");
    searchBox.value = "";
  });

  searchBox.oninput = () => {
    search(searchBox.value);
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
