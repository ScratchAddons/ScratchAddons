export default async function ({ addon, global, console }) {
  var placeHolderDiv = null,
    lockDisplay = null;
  while (true) {
    let flyOut = await addon.tab.waitForElement(".blocklyFlyout", { markAsSeen: true });
    let blocklySvg = await addon.tab.waitForElement(".blocklySvg", { markAsSeen: true });
    (async () => {
      let scrollBar = document.querySelector(".blocklyFlyoutScrollbar");

      // Placeholder Div
      if (placeHolderDiv) placeHolderDiv.remove();
      placeHolderDiv = document.body.appendChild(document.createElement("div"));
      placeHolderDiv.className = "sa-flyout-placeHolder";

      let flyoutLock = false;

      // Lock Img
      if (lockDisplay) lockDisplay.remove();
      lockDisplay = document.createElement("img");
      lockDisplay.src = addon.self.dir + "/unlock.svg";
      lockDisplay.className = "sa-lock-image";
      lockDisplay.onclick = () => {
        flyoutLock = !flyoutLock;
        lockDisplay.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
      };

      function positionElements() {
        onmouseenter(0);
        setTimeout(() => {
          placeHolderDiv.style.height = `${flyOut.getBoundingClientRect().height - 20}px`;
          placeHolderDiv.style.width = `${flyOut.getBoundingClientRect().width}px`;
          placeHolderDiv.style.left = `${flyOut.getBoundingClientRect().left}px`;
          placeHolderDiv.style.top = `${flyOut.getBoundingClientRect().top}px`;
          lockDisplay.style.top = `${flyOut.getBoundingClientRect().top}px`;
          lockDisplay.style.left = `${flyOut.getBoundingClientRect().right - 32}px`;
          onmouseleave();
        }, 0);
      }

      // Only append if we don't have "categoryclick" on
      if (addon.settings.get("toggle") === "hover") document.body.appendChild(lockDisplay);

      function getSpeedValue() {
        let data = {
          none: "0",
          short: "0.25",
          default: "0.5",
          long: "1",
        };
        return data[addon.settings.get("speed")];
      }

      function onmouseenter(speed = {}) {
        speed = typeof speed == "object" ? getSpeedValue() : speed;
        flyOut.classList.remove("sa-flyoutClose");
        flyOut.style.animation = `openFlyout ${speed}s 1`;
        scrollBar.classList.remove("sa-flyoutClose");
        scrollBar.style.animation = `openScrollbar ${speed}s 1`;
        lockDisplay.classList.remove("sa-flyoutClose");
        lockDisplay.style.animation = `openLock ${speed}s 1`;
        setTimeout(() => Blockly.getMainWorkspace().recordCachedAreas(), speed * 1000);
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
        setTimeout(() => Blockly.getMainWorkspace().recordCachedAreas(), getSpeedValue() * 1000);
      }

      // position elements which closes flyout on load
      positionElements();
      let toggle = false;
      let selectedCat = null;
      if (addon.settings.get("toggle") === "hover") {
        placeHolderDiv.onmouseenter = onmouseenter;
        blocklySvg.onmouseenter = onmouseleave;
      }

      addon.tab.redux.initialize();
      addon.tab.redux.addEventListener("statechanged", (e) => {
        switch (e.detail.action.type) {
          // Event casted when switch to small or normal size stage
          case "scratch-gui/StageSize/SET_STAGE_SIZE":
            positionElements();
            break;

          // Event casted when you switch between tabs
          case "scratch-gui/navigation/ACTIVATE_TAB":
            // always 0, 1, 2
            lockDisplay.style.display = e.detail.action.activeTabIndex == 0 ? "block" : "none";
            break;
          // Event casted when you switch between tabs
          case "scratch-gui/mode/SET_PLAYER":
            // always true or false
            lockDisplay.style.display = e.detail.action.isPlayerOnly ? "none" : "block";
            break;
        }
      });

      while (true) {
        let category = await addon.tab.waitForElement(".scratchCategoryMenuItem", { markAsSeen: true });
        category.onclick = (e) => {
          if (toggle && selectedCat == category && addon.settings.get("toggle") === "category") onmouseleave();
          else if (!toggle) onmouseenter();
          else return (selectedCat = category);
          if (addon.settings.get("toggle") === "category") toggle = !toggle;
        };
      }
    })();
  }
}
