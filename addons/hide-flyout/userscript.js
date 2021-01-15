export default async function ({ addon, global, console }) {
  while (true) {
    let flyOut = await addon.tab.waitForElement(".blocklyFlyout", { markAsSeen: true });
    let scrollBar = document.querySelector(".blocklyFlyoutScrollbar");

    // Placeholder Div
    let placeHolderDiv = document.body.appendChild(document.createElement("div"));
    placeHolderDiv.className = "sa-flyout-placeHolder";
    placeHolderDiv.style.height = `${flyOut.getBoundingClientRect().height}px`;
    placeHolderDiv.style.width = `${flyOut.getBoundingClientRect().width}px`;
    placeHolderDiv.style.left = `${flyOut.getBoundingClientRect().left}px`;
    placeHolderDiv.style.top = `${flyOut.getBoundingClientRect().top}px`;
    let flyoutLock = false;
    let lockDisplay = document.body.appendChild(document.createElement("img"));
    let blocklySvg = document.querySelector(".blocklySvg");

    lockDisplay.src = addon.self.dir + "/unlock.svg";
    lockDisplay.style.top = `${flyOut.getBoundingClientRect().top}px`;
    lockDisplay.style.left = `${flyOut.getBoundingClientRect().right - 32}px`;
    lockDisplay.className = "sa-lock-image";
    lockDisplay.onclick = function () {
      flyoutLock = !flyoutLock;
      lockDisplay.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
    };

    function getSpeedValue() {
      let data = {
        none: "0",
        short: "0.25",
        default: "0.5",
        long: "1",
      };
      return data[addon.settings.get("speed")];
    }

    function onmouseenter() {
      flyOut.classList.remove("sa-flyoutClose");
      flyOut.style.animation = `openFlyout ${getSpeedValue()}s 1`;
      scrollBar.classList.remove("sa-flyoutClose");
      scrollBar.style.animation = `openScrollbar ${getSpeedValue()}s 1`;
      lockDisplay.classList.remove("sa-flyoutClose");
      lockDisplay.style.animation = `openLock ${getSpeedValue()}s 1`;
    }
    function onmouseleave(e) {
      // If we go behind the flyout or the user has locked it, let's return
      if ((e && e.clientX <= scrollBar.getBoundingClientRect().left) || flyoutLock) return;
      flyOut.classList.add("sa-flyoutClose");
      flyOut.style.animation = `closeFlyout ${getSpeedValue()}s 1`;
      scrollBar.classList.add("sa-flyoutClose");
      scrollBar.style.animation = `closeScrollbar ${getSpeedValue()}s 1`;
      lockDisplay.classList.add("sa-flyoutClose");
      lockDisplay.style.animation = `closeLock ${getSpeedValue()}s 1`;
    }
    onmouseleave(); // close flyout on load
    placeHolderDiv.onmouseenter = onmouseenter;
    blocklySvg.onmouseenter = onmouseleave;
  }
}
