export default async function ({ addon, global, console, msg }) {
  let placeHolderDiv = null;
  let lockDisplay = null;
  let lockIcon = null;
  let flyOut = null;
  let scrollBar = null;
  let toggle = false;
  let flyoutLock = false;
  let closeOnMouseUp = false;
  let scrollAnimation = true;

  const Blockly = await addon.tab.traps.getBlockly();

  function getSpeedValue() {
    let data = {
      none: "0",
      short: "0.25",
      default: "0.5",
      long: "1",
    };
    return data[addon.settings.get("speed")];
  }

  function getToggleSetting() {
    return addon.settings.get("toggle");
  }

  function setTransition(speed) {
    for (let element of [flyOut, scrollBar, lockDisplay]) {
      element.style.transitionDuration = `${speed}s`;
    }
  }

  function removeTransition() {
    for (let element of [flyOut, scrollBar, lockDisplay]) {
      element.style.removeProperty("transition-duration");
    }
  }

  function updateLockDisplay() {
    lockDisplay.title = flyoutLock ? msg("unlock") : msg("lock");
    lockIcon.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
    if (flyoutLock) lockDisplay.classList.add("locked");
    else lockDisplay.classList.remove("locked");
  }

  function onmouseenter(e, speed = {}) {
    // If a mouse event was passed, only open flyout if the workspace isn't being dragged
    if (
      !e ||
      e.buttons === 0 ||
      document.querySelector(".blocklyToolboxDiv").className.includes("blocklyToolboxDelete")
    ) {
      speed = typeof speed === "object" ? getSpeedValue() : speed;
      setTransition(speed);
      flyOut.classList.remove("sa-flyoutClose");
      scrollBar.classList.remove("sa-flyoutClose");
      lockDisplay.classList.remove("sa-flyoutClose");
      setTimeout(() => {
        Blockly.getMainWorkspace().recordCachedAreas();
        removeTransition();
      }, speed * 1000);
    }
    closeOnMouseUp = false; // only close if the mouseup event happens outside the flyout
  }

  function onmouseleave(e, speed = getSpeedValue()) {
    if (flyoutLock) return;
    if (e && e.buttons) {
      // dragging a block or scrollbar
      closeOnMouseUp = true;
      return;
    }
    setTransition(speed);
    flyOut.classList.add("sa-flyoutClose");
    scrollBar.classList.add("sa-flyoutClose");
    lockDisplay.classList.add("sa-flyoutClose");
    setTimeout(() => {
      Blockly.getMainWorkspace().recordCachedAreas();
      removeTransition();
    }, speed * 1000);
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
          const toggleSetting = getToggleSetting();
          if (
            e.detail.action.activeTabIndex === 0 &&
            !addon.self.disabled &&
            (toggleSetting === "hover" || toggleSetting === "cathover")
          ) {
            onmouseleave(null, 0);
            toggle = false;
          }
          break;
      }
    });

    document.body.addEventListener("mouseup", () => {
      if (closeOnMouseUp) {
        onmouseleave();
        closeOnMouseUp = false;
      }
    });

    if (addon.self.enabledLate && getToggleSetting() === "category") {
      Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(false);
    }
    addon.self.addEventListener("disabled", () => {
      Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(true);
    });
    addon.self.addEventListener("reenabled", () => {
      if (getToggleSetting() === "category") {
        Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(false);
        onmouseleave(null, 0);
        toggle = false;
      }
    });

    addon.settings.addEventListener("change", () => {
      if (addon.self.disabled) return;
      if (getToggleSetting() === "category") {
        // switching to category click mode
        // close the flyout unless it's locked
        if (flyoutLock) {
          toggle = true;
          flyoutLock = false;
          updateLockDisplay();
        } else {
          Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(false);
          onmouseleave(null, 0);
          toggle = false;
        }
      } else {
        onmouseleave();
        Blockly.getMainWorkspace().getToolbox().selectedItem_.setSelected(true);
      }
    });

    // category click mode
    const oldSetSelectedItem = Blockly.Toolbox.prototype.setSelectedItem;
    Blockly.Toolbox.prototype.setSelectedItem = function (item, shouldScroll = true) {
      const previousSelection = this.selectedItem_;
      oldSetSelectedItem.call(this, item, shouldScroll);
      if (addon.self.disabled || getToggleSetting() !== "category") return;
      if (!shouldScroll) {
        // ignore initial selection when updating the toolbox
        item.setSelected(false);
      } else if (item === previousSelection) {
        toggle = !toggle;
        if (toggle) onmouseenter();
        else {
          onmouseleave();
          item.setSelected(false);
        }
      } else if (!toggle) {
        scrollAnimation = false;
        toggle = true;
        onmouseenter();
      }
    };

    const oldSelectCategoryById = Blockly.Toolbox.prototype.selectCategoryById;
    Blockly.Toolbox.prototype.selectCategoryById = function (...args) {
      // called after populating the toolbox
      // ignore if the palette is closed
      if (!addon.self.disabled && getToggleSetting() === "category" && !toggle) return;
      return oldSelectCategoryById.call(this, ...args);
    };

    const oldStepScrollAnimation = Blockly.Flyout.prototype.stepScrollAnimation;
    Blockly.Flyout.prototype.stepScrollAnimation = function () {
      // scrolling should not be animated when opening the flyout in category click mode
      if (!scrollAnimation) {
        this.scrollbar_.set(this.scrollTarget);
        this.scrollTarget = null;
        scrollAnimation = true;
        return;
      }
      oldStepScrollAnimation.call(this);
    };

    // add flyout size to the workspace dimensions
    const oldGetMetrics = Blockly.WorkspaceSvg.getTopLevelWorkspaceMetrics_;
    Blockly.WorkspaceSvg.getTopLevelWorkspaceMetrics_ = function () {
      const metrics = oldGetMetrics.call(this);
      if (addon.self.disabled || getToggleSetting() === "hover" || this.RTL) return metrics;
      if (this.getToolbox()?.flyout_?.getWidth() === 310) {
        // columns is enabled
        return metrics;
      }
      return {
        ...metrics,
        absoluteLeft: metrics.absoluteLeft - 250,
        viewWidth: metrics.viewWidth + 250,
      };
    };
    if (Blockly.getMainWorkspace())
      Blockly.getMainWorkspace().getMetrics = Blockly.WorkspaceSvg.getTopLevelWorkspaceMetrics_;
  }

  while (true) {
    flyOut = await addon.tab.waitForElement(".blocklyFlyout", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    scrollBar = document.querySelector(".blocklyFlyoutScrollbar");
    const blocksWrapper = document.querySelector('[class*="gui_blocks-wrapper_"]');

    // Placeholder Div
    if (placeHolderDiv) placeHolderDiv.remove();
    placeHolderDiv = document.createElement("div");
    blocksWrapper.appendChild(placeHolderDiv);
    placeHolderDiv.className = "sa-flyout-placeHolder";
    placeHolderDiv.style.display = "none"; // overridden by userstyle if the addon is enabled

    // Lock Img
    if (lockDisplay) lockDisplay.remove();
    lockDisplay = document.createElement("button");
    blocksWrapper.appendChild(lockDisplay);
    lockDisplay.className = "sa-lock-image";
    lockDisplay.style.display = "none"; // overridden by userstyle if the addon is enabled
    lockIcon = document.createElement("img");
    lockIcon.alt = "";
    lockDisplay.appendChild(lockIcon);
    updateLockDisplay();
    lockDisplay.onclick = () => {
      flyoutLock = !flyoutLock;
      updateLockDisplay();
    };

    onmouseleave(null, 0);
    toggle = false;

    const toolbox = document.querySelector(".blocklyToolboxDiv");
    const addExtensionButton = document.querySelector("[class^=gui_extension-button-container_]");

    for (let element of [toolbox, addExtensionButton, flyOut, scrollBar, lockDisplay]) {
      element.onmouseenter = (e) => {
        const toggleSetting = getToggleSetting();
        if (!addon.self.disabled && (toggleSetting === "hover" || toggleSetting === "cathover")) onmouseenter(e);
      };
      element.onmouseleave = (e) => {
        const toggleSetting = getToggleSetting();
        if (!addon.self.disabled && (toggleSetting === "hover" || toggleSetting === "cathover")) onmouseleave(e);
      };
    }
    placeHolderDiv.onmouseenter = (e) => {
      if (!addon.self.disabled && getToggleSetting() === "hover") onmouseenter(e);
    };
    placeHolderDiv.onmouseleave = (e) => {
      if (!addon.self.disabled && getToggleSetting() === "hover") onmouseleave(e);
    };

    doOneTimeSetup();
    if (getToggleSetting() !== "hover") {
      // update workspace dimensions
      Blockly.svgResize(Blockly.getMainWorkspace());
    }
  }
}
