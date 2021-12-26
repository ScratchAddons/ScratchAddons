export default async function ({ addon, global, console }) {
  let sprites_container = document.querySelector('[class^="sprite-selector_items-wrapper"]');
  let search_box = document.createElement("input");
  search_box.setAttribute("type", "search");
  search_box.setAttribute("placeholder", "Search sprites...");
  search_box.setAttribute("id", "sa-sprite-search-box");
  search_box.setAttribute("autocomplete", "off");

  await addon.tab.waitForElement('[class^="sprite-selector_items-wrapper"]');

  let sprite_selector_container = document.querySelector('[class^="sprite-selector_scroll-wrapper"]');
  sprite_selector_container.insertBefore(search_box, sprites_container);

  addon.tab.displayNoneWhileDisabled(search_box, { display: "block" });
  addon.self.addEventListener("disabled", () => {
    for (let i = 0; i < sprites_container.children.length; i++) {
      sprites_container.children[i].style.display = "block";
    }
  });
  addon.self.addEventListener("reenabled", () => {
    search_box.value = "";
  });

  search_box.oninput = () => {
    if (search_box.value) {
      for (let i = 0; i < sprites_container.children.length; i++) {
        if (
          sprites_container.children[i].children[0].children[1].innerText
            .toLowerCase()
            .includes(search_box.value.toLowerCase())
        ) {
          sprites_container.children[i].style.display = "block";
        } else if (
          sprites_container.children[i].children[0].children[2].children[0].innerText
            .toLowerCase()
            .includes(search_box.value.toLowerCase()) &&
          sprites_container.children[i].children[0].classList.contains("sa-folders-folder")
        ) {
          sprites_container.children[i].style.display = "block";
        } else {
          sprites_container.children[i].style.display = "none";
        }
      }
    } else {
      for (let i = 0; i < sprites_container.children.length; i++) {
        sprites_container.children[i].style.display = "block";
      }
    }
  };

  while (true) {
    await addon.tab.waitForElement("div[class^='sprite-selector_items-wrapper']", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    sprites_container = document.querySelector('[class^="sprite-selector_items-wrapper"]');
    sprite_selector_container = document.querySelector('[class^="sprite-selector_scroll-wrapper"]');
    sprite_selector_container.insertBefore(search_box, sprites_container);
  }
}
