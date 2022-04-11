/* (remove this before commiting!!!)
How i'll go about fixing this:
  - Get the OG list of sprites from the redux store
  - Loop through it to see which sprites belong to which folder
  - When user searches for open folder, current system works fine
  - When user searches for closed folder, bring up the folder
  - user can open the folder without messing up search results
*/

export default async function ({ addon, global, console, msg }) {
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

  // These functions were taken from the search sprites addon
  const getFolderFromName = (name) => {
    const idx = name.indexOf("//");
    if (idx === -1 || idx === 0) {
      return null;
    }
    return name.substr(0, idx);
  };

  const getNameWithoutFolder = (name) => {
    const idx = name.indexOf("//");
    if (idx === -1 || idx === 0) {
      return name;
    }
    return name.substr(idx + DIVIDER.length);
  };

  const search = (query, sprites) => {
    if (!spritesContainer) return;

    query = query.toLowerCase();
    const containsQuery = (str) => str.toLowerCase().includes(query);

    console.log(typeof sprites);
    console.log(sprites);

    const foldersWithMatchingSprites = [];
    for (let sprite of Object.keys(sprites)) {
      if (containsQuery(sprites[sprite].name) && getFolderFromName(sprites[sprite].name)) {
        // matching sprite is in a folder
        // add folder to list of folders to show
        foldersWithMatchingSprites.push(getFolderFromName(sprites[sprite].name));
      }
    }
    console.log("Matching Folders..." + foldersWithMatchingSprites);

    for (const sprite of spritesContainer.children) {
      // check if sprite is in the folder

      const visible =
        !query ||
        containsQuery(sprite.children[0].children[1].innerText) ||
        ((containsQuery(sprite.children[0].children[2].children[0].innerText) ||
          foldersWithMatchingSprites.includes(sprite.children[0].children[2].children[0].innerText)) &&
          sprite.children[0].classList.contains("sa-folders-folder"));
      sprite.style.display = visible ? "" : "none";
    }
  };

  searchBox.addEventListener("input", (e) => {
    const reduxState = addon.tab.redux.state;
    const sprites = reduxState.scratchGui.targets.sprites;
    search(e.target.value, sprites);
  });

  const reset = () => {
    search("", addon.tab.redux.state.scratchGui.targets.sprites);
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
