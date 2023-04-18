// Initial code was written by Norbiros

export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;

  // look for sprite list
  let spriteList = document.getElementsByClassName("sprite-selector_items-wrapper_4bcOj box_box_2jjDp");
  // add event triggered by mouse click on sprite list
  spriteList[0].addEventListener(
    "click",
    // when the sprite list is clicked
    function (e) {
      // if shift is pressed
      if (e.shiftKey) {
        // get the sprite thumbnail closest to the click
        let parentDiv = event.target.closest(".sprite-selector_sprite-wrapper_1C5Mq");
        // get the name of the sprite
        let name = parentDiv.querySelector(".sprite-selector-item_sprite-name_1PXjh").innerText;
        // move the sprite with that name to front
        vm.runtime.getSpriteTargetByName(name).goToFront();
      }
    },
    false
  );
}
