export default async function ({ addon, global, console }) {
  let placeHolderDiv = null;
  let lockDisplay = null;
  let flyOut = null;
  let scrollBar = null;
  let toggle = true;
  let selectedCategory = null;
  let toggleSetting = addon.settings.get("toggle");
  let flyoutLock = false;

  function getSpeedValue() {
    let data = {
      none: "0",
      short: "0.25",
      default: "0.5",
      long: "1",
    };
    return data[addon.settings.get("speed")];
  }
  function onmouseenter(e, speed = {}) {
    // If a mouse event was passed, only open flyout if the workspace isn't being dragged
    if (
      !e ||
      e.buttons === 0 ||
      document.querySelector(".blocklyToolboxDiv").className.includes("blocklyToolboxDelete")
    ) {
      speed = typeof speed === "object" ? getSpeedValue() : speed;
      flyOut.classList.remove("sa-flyoutClose");
      flyOut.style.transitionDuration = `${speed}s`;
      scrollBar.classList.remove("sa-flyoutClose");
      scrollBar.style.transitionDuration = `${speed}s`;
      lockDisplay.classList.remove("sa-flyoutClose");
      lockDisplay.style.transitionDuration = `${speed}s`;
      setTimeout(() => Blockly.getMainWorkspace().recordCachedAreas(), speed * 1000);
    }
  }
  function onmouseleave(e, speed = getSpeedValue()) {
    // If we go behind the flyout or the user has locked it, let's return
    if ((toggleSetting !== "cathover" && e && e.clientX <= scrollBar.getBoundingClientRect().left) || flyoutLock)
      return;
    flyOut.classList.add("sa-flyoutClose");
    flyOut.style.transitionDuration = `${speed}s`;
    scrollBar.classList.add("sa-flyoutClose");
    scrollBar.style.transitionDuration = `${speed}s`;
    lockDisplay.classList.add("sa-flyoutClose");
    lockDisplay.style.transitionDuration = `${speed}s`;
    setTimeout(() => Blockly.getMainWorkspace().recordCachedAreas(), speed * 1000);
  }

  let didOneTimeSetup = false;
  function doOneTimeSetup() {
    if (didOneTimeSetup) {
      return;
    }
    didOneTimeSetup = true;
    addon.tab.redux.initialize();
    addon.tab.redux.addEventListener("statechanged", (e) => {
      switch (e.detail.action.type) {
        // Event casted when you switch between tabs
        case "scratch-gui/navigation/ACTIVATE_TAB":
          // always 0, 1, 2
          lockDisplay.style.display = e.detail.action.activeTabIndex === 0 ? "block" : "none";
          placeHolderDiv.style.display = e.detail.action.activeTabIndex === 0 ? "block" : "none";
          if (e.detail.action.activeTabIndex === 0) {
            onmouseenter(null, 0);
            toggle = true;
          }
          break;
        // Event casted when you switch between tabs
        case "scratch-gui/mode/SET_PLAYER":
          // always true or false
          lockDisplay.style.display = e.detail.action.isPlayerOnly ? "none" : "block";
          placeHolderDiv.style.display = e.detail.action.activeTabIndex === 0 ? "block" : "none";
          break;
      }
    });
    if (toggleSetting === "category" || toggleSetting === "cathover") {
      (async () => {
        while (true) {
          let category = await addon.tab.waitForElement(".scratchCategoryMenuItem", {
            markAsSeen: true,
            condition: () => !addon.tab.redux.state.scratchGui.mode.isPlayerOnly,
          });
          category.onclick = () => {
            if (toggle && selectedCategory === category && toggleSetting === "category") {
              onmouseleave();
              selectedCategory = category;
            } else if (!toggle) {
              onmouseenter();
              selectedCategory = category;
            } else {
              selectedCategory = category;
              return;
            }
            if (toggleSetting === "category") toggle = !toggle;
          };
        }
      })();
    }
  }

  while (true) {
    flyOut = await addon.tab.waitForElement(".blocklyFlyout", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    let blocklySvg = document.querySelector(".blocklySvg");
    scrollBar = document.querySelector(".blocklyFlyoutScrollbar");
    const tabs = document.querySelector('[class^="gui_tabs"]');

    // Placeholder Div
    if (placeHolderDiv) placeHolderDiv.remove();
    placeHolderDiv = document.createElement("div");
    if (toggleSetting === "hover") tabs.appendChild(placeHolderDiv);
    placeHolderDiv.className = "sa-flyout-placeHolder";

    // Lock Img
    if (lockDisplay) lockDisplay.remove();
    lockDisplay = document.createElement("img");
    lockDisplay.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
    lockDisplay.className = "sa-lock-image";
    lockDisplay.onclick = () => {
      flyoutLock = !flyoutLock;
      lockDisplay.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
    };

    // Only append if we don't have "categoryclick" on
    if (toggleSetting === "hover") tabs.appendChild(lockDisplay);

    if (toggleSetting === "hover") {
      placeHolderDiv.onmouseenter = (e) => onmouseenter(e);
      placeHolderDiv.onmouseup = (e) => onmouseenter();
      document.querySelector(".blocklyToolboxDiv").onmouseenter = (e) => onmouseenter(e); // for columns
      blocklySvg.onmouseenter = (e) => onmouseleave(e);
    }

    if (toggleSetting === "cathover") {
      onmouseleave(null, 0);

      const toolbox = document.querySelector(".blocklyToolboxDiv");
      const addExtensionButton = document.querySelector("[class^=gui_extension-button-container_]");

      for (let e of [toolbox, addExtensionButton, flyOut, scrollBar]) {
        e.onmouseenter = onmouseenter;
        e.onmouseleave = onmouseleave;
      }
    }

    doOneTimeSetup();
  }
}
