// Initial code was written by Norbiros

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  document.body.addEventListener("click", (e) => {
    if (e.shiftKey && !addon.self.disabled) {
      const parentDiv = e.target.closest("div[class^='sprite-selector_sprite-wrapper']");
      if (parentDiv) {
        const spriteName = parentDiv.querySelector("div[class^='sprite-selector-item_sprite-name']").innerText;
        // move the sprite with that name to front
        vm.runtime.getSpriteTargetByName(spriteName).goToFront();
      }
    }
  });
}
