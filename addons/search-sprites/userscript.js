export default async function ({ addon, console, msg }) {
  let spritesContainer;
  let spriteSelectorContainer;

  const container = document.createElement("div");
  container.className = "sa-search-sprites-container";
  addon.tab.displayNoneWhileDisabled(container, {
    display: "flex",
  });

  const searchBox = document.createElement("input");
  searchBox.className = "sa-search-sprites-box";
  searchBox.placeholder = msg("placeholder");
  searchBox.autocomplete = "off";
  // search might make more sense, but browsers treat them special in ways that this addon does not handle,
  // so just leave it as a text input. Also note that Scratch uses type=text for its own search inputs in
  // the libraries, so this fits right in.
  searchBox.type = "text";

  const search = (query) => {
    if (!spritesContainer) return;

    query = query.toLowerCase();
    const containsQuery = (str) => str.toLowerCase().includes(query);

    for (const sprite of spritesContainer.children) {
      const visible =
        !query ||
        containsQuery(sprite.children[0].children[1].innerText) ||
        (containsQuery(sprite.children[0].children[2].children[0].innerText) &&
          sprite.children[0].classList.contains("sa-folders-folder"));
      sprite.style.display = visible ? "" : "none";
    }
  };

  searchBox.addEventListener("input", (e) => {
    search(e.target.value);
  });

  const reset = () => {
    search("");
    searchBox.value = "";
  };

  const resetButton = document.createElement("button");
  resetButton.className = "sa-search-sprites-reset";
  resetButton.addEventListener("click", reset);
  resetButton.textContent = "×";
  addon.self.addEventListener("disabled", reset);

  container.appendChild(searchBox);
  container.appendChild(resetButton);

  while (true) {
    await addon.tab.waitForElement("div[class^='sprite-selector_items-wrapper']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    spritesContainer = document.querySelector('[class^="sprite-selector_items-wrapper"]');
    spriteSelectorContainer = document.querySelector('[class^="sprite-selector_scroll-wrapper"]');
    spriteSelectorContainer.insertBefore(container, spritesContainer);
    reset(); // Clear search box after going outside then inside
  }
}
