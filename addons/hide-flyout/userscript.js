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
    let flyoutLock = false;
    let lockDisplay = document.body.appendChild(document.createElement("img"));
    lockDisplay.src = addon.self.dir + "/unlock.svg";
    lockDisplay.style.top = `${flyOut.getBoundingClientRect().top}px`;
    lockDisplay.style.left = `${flyOut.getBoundingClientRect().right - 32}px`;
    lockDisplay.className = "sa-lock-image"
    lockDisplay.onclick = function () {
      flyoutLock = !flyoutLock;
      lockDisplay.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
    }

    function onmouseenter() {
      flyOut.classList.remove("sa-flyoutClose");
      flyOut.style.animation = `openFlyout ${addon.settings.get("speed")}s 1`;
      scrollBar.classList.remove("sa-flyoutClose");
      scrollBar.style.animation = `openScrollbar ${addon.settings.get("speed")}s 1`;
      lockDisplay.classList.remove("sa-flyoutClose");
      lockDisplay.style.animation = `openLock ${addon.settings.get("speed")}s 1`;
    }
    function onmouseleave(e) {
      // If we go behind the flyout or the user has locked it, let's return
      if ((e && e.clientX <= scrollBar.getBoundingClientRect().left) || flyoutLock) return;
      flyOut.classList.add("sa-flyoutClose");
      flyOut.style.animation = `closeFlyout ${addon.settings.get("speed")}s 1`;
      scrollBar.classList.add("sa-flyoutClose");
      scrollBar.style.animation = `closeScrollbar ${addon.settings.get("speed")}s 1`;
      lockDisplay.classList.add("sa-flyoutClose");
      lockDisplay.style.animation = `closeLock ${addon.settings.get("speed")}s 1`;
    }
    onmouseleave(); // close flyout on load
    placeHolderDiv.onmouseenter = onmouseenter;
    scrollBar.onmouseleave = onmouseleave;
  }
}
