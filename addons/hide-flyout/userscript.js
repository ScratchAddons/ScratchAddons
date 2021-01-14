export default async function ({ addon, global, console }) {
  while (true) {
    let flyOut = await addon.tab.waitForElement(".blocklyFlyout", { markAsSeen: true });
    let state = true;
    function mouseMove(e) {
      let sidePos = document.querySelector(".blocklyToolboxDiv").getBoundingClientRect().x;
      let scrollBar = document.querySelector(".blocklyFlyoutScrollbar");
      if (e.clientX - sidePos < 310) {
        if (!state) {
          flyOut.classList.remove("sa-flyoutClose");
          flyOut.style.animation = "openFlyout 1s 1";
          scrollBar.classList.remove("sa-flyoutClose");
          scrollBar.style.animation = "openScrollbar 1s 1";
        }
      } else {
        flyOut.classList.add("sa-flyoutClose");
        flyOut.style.animation = "closeFlyout 1s 1";
        scrollBar.classList.add("sa-flyoutClose");
        scrollBar.style.animation = "closeScrollbar 1s 1";
      }
      state = e.clientX - sidePos < 310;
    }
    document.removeEventListener("mousemove", mouseMove);
    document.addEventListener("mousemove", mouseMove);
  }
}
