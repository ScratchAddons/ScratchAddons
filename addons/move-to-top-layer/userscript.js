// Initial code was written by Norbiros

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  while (true) {
    const spriteList = await addon.tab.waitForElement("div[class^='sprite-selector_items-wrapper']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });

    spriteList.addEventListener("click", (e) => {
      if (e.shiftKey && !addon.self.disabled) {
        // get the sprite thumbnail closest to the click
        const parentDiv = e.target.closest("div[class^='sprite-selector_sprite-wrapper']");
        const spriteName = parentDiv.querySelector("div[class^='sprite-selector-item_sprite-name']").innerText;
        // move the sprite with that name to front
        vm.runtime.getSpriteTargetByName(spriteName).goToFront();
      }
    });
  }
}
