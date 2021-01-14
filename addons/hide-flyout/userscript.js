export default async function ({ addon, global, console }) {
  while (true) {
    let flyOut = await addon.tab.waitForElement(".blocklyFlyout", { markAsSeen: true });
    let scrollBar = document.querySelector(".blocklyFlyoutScrollbar");

    // Placeholder Div
    let placeHolderDiv = document.body.appendChild(document.createElement("div"));
    placeHolderDiv.className = "sa-flyout-placeHolder";
    placeHolderDiv.style.height = `${flyOut.getBoundingClientRect().height}px`;
    placeHolderDiv.style.width = `${flyOut.getBoundingClientRect().width - 5}px`;
    placeHolderDiv.style.left = `${flyOut.getBoundingClientRect().left}px`;
    placeHolderDiv.style.top = `${flyOut.getBoundingClientRect().top}px`;

    function onmouseenter() {
      console.log("enter");
      flyOut.classList.remove("sa-flyoutClose");
      flyOut.style.animation = "openFlyout 0.5s 1";
      scrollBar.classList.remove("sa-flyoutClose");
      scrollBar.style.animation = "openScrollbar 0.5s 1";
      placeHolderDiv.onmouseenter = "";
      scrollBar.onmouseleave = onmouseleave; // notice this is to flyout
    }
    function onmouseleave(e) {
      // If we go behind the flyout, let's return
      if (e && (e.clientX <= scrollBar.getBoundingClientRect().left)) return;
      console.log("leave");
      flyOut.classList.add("sa-flyoutClose");
      flyOut.style.animation = "closeFlyout 0.5s 1";
      scrollBar.classList.add("sa-flyoutClose");
      scrollBar.style.animation = "closeScrollbar 0.5s 1";
      placeHolderDiv.onmouseenter = onmouseenter;
      scrollBar.onmouseleave = "";
    }
    onmouseleave(); // close flyout on load
    placeHolderDiv.onmouseenter = onmouseenter;
  }
}
