export default async function ({ addon, global, console, msg }) {
  let placeHolderDiv = null;
  let lockDisplay = null;
  let lockIcon = null;
  let flyOut = null;
  let scrollBar = null;
  let toggle = false;
  let toggleSetting = addon.settings.get("toggle");
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
    closeOnMouseUp = false; // only close if the mouseup event happens outside the flyout
  }
  function onmouseleave(e, speed = getSpeedValue()) {
    if (flyoutLock) return;
    if (e && e.buttons) {
      // dragging a block or scrollbar
      closeOnMouseUp = true;
      return;
    }
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
          if (e.detail.action.activeTabIndex === 0 && (toggleSetting === "hover" || toggleSetting === "cathover")) {
            onmouseleave(null, 0);
            toggle = false;
          }
          break;
      }
    });
    if (toggleSetting === "category") {
      const oldSetSelectedItem = Blockly.Toolbox.prototype.setSelectedItem;
      Blockly.Toolbox.prototype.setSelectedItem = function (item, shouldScroll) {
        if (shouldScroll === undefined) shouldScroll = true;
        if (!shouldScroll) {
          // ignore initial selection when updating the toolbox
          item = this.selectedItem_;
        } else if (this.selectedItem_ === item) {
          toggle = !toggle;
          if (toggle) onmouseenter();
          else {
            onmouseleave();
            // unselect the category
            item = null;
          }
        } else if (!toggle) {
          scrollAnimation = false;
          toggle = true;
          onmouseenter();
        }
        oldSetSelectedItem.call(this, item, shouldScroll);
      };
      const oldGetSelectedCategoryId = Blockly.Toolbox.prototype.getSelectedCategoryId;
      Blockly.Toolbox.prototype.getSelectedCategoryId = function () {
        // the selected category can now be null
        if (!this.selectedItem_) return null;
        return oldGetSelectedCategoryId.call(this);
      };
      const oldStepScrollAnimation = Blockly.Flyout.prototype.stepScrollAnimation;
      Blockly.Flyout.prototype.stepScrollAnimation = function () {
        // scrolling should not be animated when opening the flyout
        if (!scrollAnimation) {
          this.scrollbar_.set(this.scrollTarget);
          this.scrollTarget = null;
          scrollAnimation = true;
          return;
        }
        oldStepScrollAnimation.call(this);
      };
    }
    if (toggleSetting !== "hover") {
      // add flyout size to the workspace dimensions
      const oldGetMetrics = Blockly.WorkspaceSvg.getTopLevelWorkspaceMetrics_;
      Blockly.WorkspaceSvg.getTopLevelWorkspaceMetrics_ = function () {
        const metrics = oldGetMetrics.call(this);
        if (this.RTL) return metrics;
        if (this.getToolbox().flyout_?.getWidth() === 310) {
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
    if (toggleSetting === "hover") blocksWrapper.appendChild(placeHolderDiv);
    placeHolderDiv.className = "sa-flyout-placeHolder";

    // Lock Img
    if (lockDisplay) lockDisplay.remove();
    lockDisplay = document.createElement("button");
    lockDisplay.className = "sa-lock-image";
    if (flyoutLock) lockDisplay.classList.add("locked");
    lockDisplay.title = flyoutLock ? msg("unlock") : msg("lock");
    lockIcon = document.createElement("img");
    lockIcon.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
    lockIcon.alt = "";
    lockDisplay.appendChild(lockIcon);
    lockDisplay.onclick = () => {
      flyoutLock = !flyoutLock;
      lockDisplay.title = flyoutLock ? msg("unlock") : msg("lock");
      lockIcon.src = addon.self.dir + `/${flyoutLock ? "" : "un"}lock.svg`;
      if (flyoutLock) lockDisplay.classList.add("locked");
      else lockDisplay.classList.remove("locked");
    };

    onmouseleave(null, 0);
    toggle = false;

    if (toggleSetting === "hover" || toggleSetting === "cathover") {
      // Only append if we don't have "categoryclick" on
      blocksWrapper.appendChild(lockDisplay);

      const toolbox = document.querySelector(".blocklyToolboxDiv");
      const addExtensionButton = document.querySelector("[class^=gui_extension-button-container_]");

      for (let element of [toolbox, addExtensionButton, flyOut, scrollBar, lockDisplay]) {
        element.onmouseenter = onmouseenter;
        element.onmouseleave = onmouseleave;
      }

      if (toggleSetting === "hover") {
        placeHolderDiv.onmouseenter = onmouseenter;
        placeHolderDiv.onmouseleave = onmouseleave;
      }

      document.body.addEventListener("mouseup", () => {
        if (closeOnMouseUp) {
          onmouseleave();
          closeOnMouseUp = false;
        }
      });
    }

    doOneTimeSetup();
    if (toggleSetting !== "hover") {
      // update workspace dimensions
      Blockly.svgResize(Blockly.getMainWorkspace());
    }
  }
}
