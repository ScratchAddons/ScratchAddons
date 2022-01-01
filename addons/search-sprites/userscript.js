export default async function ({ addon, global, console, msg }) {
  let spritesContainer;
  let spriteSelectorContainer;

  const searchBox = document.createElement("input");
  searchBox.className = 'sa-search-sprites-box';
  searchBox.placeholder = msg('placeholder');
  searchBox.autocomplete = 'off';
  // search might make more sense, but browsers treat them special in ways that this addon does not handle,
  // so just leave it as a text input. Also note that Scratch uses type=text for its own search inputs in
  // the libraries, so this fits right in.
  searchBox.type = 'text';

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

  searchBox.addEventListener("input", (e) => {
    search(e.target.value);
  });

  addon.tab.displayNoneWhileDisabled(searchBox, {
    display: "block"
  });
  addon.self.addEventListener("disabled", () => {
    search("");
    searchBox.value = "";
  });

  while (true) {
    await addon.tab.waitForElement("div[class^='sprite-selector_items-wrapper']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    spritesContainer = document.querySelector('[class^="sprite-selector_items-wrapper"]');
    spriteSelectorContainer = document.querySelector('[class^="sprite-selector_scroll-wrapper"]');
    spriteSelectorContainer.insertBefore(searchBox, spritesContainer);
  }
}
