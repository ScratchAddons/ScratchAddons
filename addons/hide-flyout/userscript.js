import { isScratchAprilFools25 } from "./april-fools.js";

export default async function ({ addon, console, msg }) {
  if (await isScratchAprilFools25(addon.tab.redux)) return;

  let placeHolderDiv = null;
  let lockObject = null;
  let lockButton = null;
  let lockIcon = null;

  let flyOut = null;
  let scrollBar = null;

  let widgetDivOwner = null;

  let toggle = false;
  let flyoutLocked = false;
  let closeOnPointerUp = false;
  let scrollAnimation = true;

  const SVG_NS = "http://www.w3.org/2000/svg";

  const Blockly = await addon.tab.traps.getBlockly();

  function recordDragTargets() {
    const workspace = addon.tab.traps.getWorkspace();
    if (workspace) {
      if (Blockly.registry)
        workspace.recordDragTargets(); // new Blockly
      else workspace.recordCachedAreas();
    }
  }

  function getSpeedValue() {
    let data = {
      none: "0",
      short: "0.2",
      default: "0.3",
      long: "0.5",
    };
    return data[addon.settings.get("speed")];
  }

  function getToggleSetting() {
    return addon.settings.get("toggle");
  }

  function isHoverMode() {
    const toggleSetting = getToggleSetting();
    return toggleSetting === "hover" || toggleSetting === "cathover";
  }

  function setTransition(speed) {
    for (let element of [flyOut, scrollBar]) {
      element.style.transitionDuration = `${speed}s`;
    }
  }

  function removeTransition() {
    for (let element of [flyOut, scrollBar]) {
      element.style.removeProperty("transition-duration");
    }
  }

  function updateLockDisplay() {
    lockObject.classList.toggle("locked", flyoutLocked);
    lockButton.title = flyoutLocked ? msg("unlock") : msg("lock");
    lockIcon.src = addon.self.dir + `/${flyoutLocked ? "" : "un"}lock.svg`;
  }

  function initFlyoutState() {
    const option = addon.settings.get("lockLoad");
    if (option) {
      if (getToggleSetting() === "category") {
        toggle = true;
      } else {
        flyoutLocked = true;
        updateLockDisplay();
      }
      flyOut.classList.remove("sa-flyoutClose");
      scrollBar.classList.remove("sa-flyoutClose");
    }
  }

  function openFlyout(e, speed = {}) {
    // If a mouse event was passed, only open flyout if the workspace isn't being dragged
    const isDragging = e && e.buttons !== 0;
    let isDraggingWorkspace;
    if (isDragging) {
      if (Blockly.registry) {
        // new Blockly
        const workspace = addon.tab.traps.getWorkspace();
        isDraggingWorkspace = !!workspace?.currentGesture_?.workspaceDragger;
      } else {
        isDraggingWorkspace = !document.querySelector(".blocklyToolboxDiv").className.includes("blocklyToolboxDelete");
      }
    }
    if (!isDraggingWorkspace) {
      speed = typeof speed === "object" ? getSpeedValue() : speed;
      setTransition(speed);
      flyOut.classList.remove("sa-flyoutClose");
      scrollBar.classList.remove("sa-flyoutClose");
      setTimeout(() => {
        recordDragTargets();
        removeTransition();
      }, speed * 1000);
    }
    closeOnPointerUp = false; // only close if the pointerup event happens outside the flyout
  }

  function closeFlyout(e, speed = getSpeedValue()) {
    // locked palette, inputting text, and hovering over dropdown menu do not close palette
    let widget;
    let dropdown;
    if (Blockly.registry) {
      // new Blockly
      if (!Blockly.WidgetDiv.isVisible()) widgetDivOwner = null;
      widget = widgetDivOwner;
      dropdown = Blockly.DropDownDiv.getOwner();
    } else {
      widget = Blockly.WidgetDiv.owner_;
      dropdown = Blockly.DropDownDiv.owner_;
    }
    const widgetOpenedFromFlyout =
      widget?.isInFlyout ||
      (widget === Blockly.ContextMenu && widget.currentBlock?.isInFlyout) ||
      (widget instanceof Blockly.Field && widget.sourceBlock_?.isInFlyout);
    const dropdownOpenedFromFlyout =
      dropdown?.isInFlyout || (dropdown instanceof Blockly.Field && dropdown.sourceBlock_?.isInFlyout);
    const widgetOrDropdownOpenedFromFlyout = widgetOpenedFromFlyout || dropdownOpenedFromFlyout;
    // Don't forget to close when the mouse leaves the flyout even when clicking off of a dropdown or input
    if (widgetOrDropdownOpenedFromFlyout) closeOnPointerUp = true;
    if (
      flyoutLocked ||
      ((Blockly.WidgetDiv.isVisible() || Blockly.DropDownDiv.isVisible()) && widgetOrDropdownOpenedFromFlyout) // If the dropdown or input came outside of the flyout, do not keep open the flyout when cursor leaves
    )
      return;
    if (e && e.buttons) {
      // dragging a block or scrollbar
      closeOnPointerUp = true;
      return;
    }
    setTransition(speed);
    flyOut.classList.add("sa-flyoutClose");
    scrollBar.classList.add("sa-flyoutClose");
    setTimeout(() => {
      recordDragTargets();
      removeTransition();
    }, speed * 1000);
  }

  const updateIsFullScreen = () => {
    const isFullScreen = addon.tab.redux.state.scratchGui.mode.isFullScreen;
    document.documentElement.classList.toggle("sa-hide-flyout-not-fullscreen", !isFullScreen);
  };
  updateIsFullScreen();

  let didOneTimeSetup = false;
  function doOneTimeSetup() {
    if (didOneTimeSetup) {
      return;
    }
    didOneTimeSetup = true;

    const workspace = addon.tab.traps.getWorkspace();

    addon.tab.redux.initialize();
    addon.tab.redux.addEventListener("statechanged", (e) => {
      switch (e.detail.action.type) {
        // Event casted when you switch between tabs
        case "scratch-gui/navigation/ACTIVATE_TAB": {
          // always 0, 1, 2
          const toggleSetting = getToggleSetting();
          if (
            e.detail.action.activeTabIndex === 0 &&
            !addon.self.disabled &&
            (toggleSetting === "hover" || toggleSetting === "cathover")
          ) {
            closeFlyout(null, 0);
            toggle = false;
          }
          break;
        }
        case "scratch-gui/mode/SET_FULL_SCREEN":
          updateIsFullScreen();
          break;
      }
    });

    document.body.addEventListener("pointerup", () => {
      if (closeOnPointerUp) {
        closeOnPointerUp = false;
        closeFlyout();
      }
    });

    if (getToggleSetting() === "category" && !addon.settings.get("lockLoad")) {
      addon.tab.traps.getWorkspace().getToolbox().selectedItem_.setSelected(false);
    }
    addon.self.addEventListener("disabled", () => {
      addon.tab.traps.getWorkspace().getToolbox().selectedItem_.setSelected(true);
    });
    addon.self.addEventListener("reenabled", () => {
      if (getToggleSetting() === "category" && !addon.settings.get("lockLoad")) {
        addon.tab.traps.getWorkspace().getToolbox().selectedItem_.setSelected(false);
        closeFlyout(null, 0);
        toggle = false;
      }
    });

    addon.settings.addEventListener("change", () => {
      if (addon.self.disabled) return;
      if (getToggleSetting() === "category") {
        // switching to category click mode
        // close the flyout unless it's locked
        if (flyoutLocked) {
          toggle = true;
          flyoutLocked = false;
          updateLockDisplay();
        } else {
          addon.tab.traps.getWorkspace().getToolbox().selectedItem_.setSelected(false);
          closeFlyout(null, 0);
          toggle = false;
        }
      } else {
        // switching from category click to a different mode
        if (addon.settings.get("lockLoad")) {
          flyoutLocked = true;
          updateLockDisplay();
        } else {
          closeFlyout();
        }
        addon.tab.traps.getWorkspace().getToolbox().selectedItem_.setSelected(true);
      }
    });

    if (Blockly.registry) {
      // new Blockly: we can't access the WidgetDiv owner directly
      const oldShowContextMenu = Blockly.BlockSvg.prototype.showContextMenu;
      Blockly.BlockSvg.prototype.showContextMenu = function (...args) {
        widgetDivOwner = this;
        return oldShowContextMenu.call(this, ...args);
      };

      const oldShowInlineEditor = Blockly.FieldTextInput.prototype.showInlineEditor_;
      Blockly.FieldTextInput.prototype.showInlineEditor_ = function (...args) {
        widgetDivOwner = this;
        return oldShowInlineEditor.call(this, ...args);
      };
    } else {
      const oldShowPositionedByBlock = Blockly.DropDownDiv.showPositionedByBlock;
      Blockly.DropDownDiv.showPositionedByBlock = function (owner, block, ...args) {
        const result = oldShowPositionedByBlock.call(this, owner, block, ...args);
        // Scratch incorrectly sets owner_ to the DropDownDiv itself
        if (owner instanceof Blockly.Field) Blockly.DropDownDiv.owner_ = owner;
        else Blockly.DropDownDiv.owner_ = block;
        return result;
      };
    }

    // category click mode
    const oldSetSelectedItem = Blockly.Toolbox.prototype.setSelectedItem;
    Blockly.Toolbox.prototype.setSelectedItem = function (item, shouldScroll = true) {
      const previousSelection = this.selectedItem_;
      if (Blockly.registry)
        oldSetSelectedItem.call(this, item); // new Blockly: no shouldScroll parameter
      else oldSetSelectedItem.call(this, item, shouldScroll);
      if (addon.self.disabled || getToggleSetting() !== "category") return;
      if (!shouldScroll) {
        // ignore initial selection when updating the toolbox
        item.setSelected(toggle);
      } else if (item === previousSelection) {
        toggle = !toggle;
        if (toggle) openFlyout();
        else closeFlyout();
        item.setSelected(toggle);
      } else if (!toggle) {
        scrollAnimation = false;
        toggle = true;
        openFlyout();
      }
    };

    const newSelectCategory = (oldSelectCategory) =>
      function (...args) {
        // called after populating the toolbox
        // ignore if the palette is closed
        if (!addon.self.disabled && getToggleSetting() === "category" && !toggle) {
          this.selectedItem_.setSelected(false);
          return;
        }
        return oldSelectCategory.call(this, ...args);
      };
    if (Blockly.registry) {
      // new Blockly
      const ContinuousToolbox = workspace.getToolbox().constructor;
      const oldSelectCategoryByName = ContinuousToolbox.prototype.selectCategoryByName;
      ContinuousToolbox.prototype.selectCategoryByName = newSelectCategory(oldSelectCategoryByName);
    } else {
      const oldSelectCategoryById = Blockly.Toolbox.prototype.selectCategoryById;
      Blockly.Toolbox.prototype.selectCategoryById = newSelectCategory(oldSelectCategoryById);
    }

    const newStepScrollAnimation = (oldStepScrollAnimation) =>
      function () {
        // scrolling should not be animated when opening the flyout in category click mode
        if (!scrollAnimation) {
          if (Blockly.registry)
            this.workspace_.scrollbar.setY(this.scrollTarget); // new Blockly
          else this.scrollbar_.set(this.scrollTarget);
          this.scrollTarget = null;
          scrollAnimation = true;
          return;
        }
        oldStepScrollAnimation.call(this);
      };
    if (Blockly.registry) {
      // new Blockly
      const ContinuousFlyout = workspace.getToolbox().getFlyout().constructor;
      const oldStepScrollAnimation = ContinuousFlyout.prototype.stepScrollAnimation_;
      ContinuousFlyout.prototype.stepScrollAnimation_ = newStepScrollAnimation(oldStepScrollAnimation);
    } else {
      const oldStepScrollAnimation = Blockly.Flyout.prototype.stepScrollAnimation;
      Blockly.Flyout.prototype.stepScrollAnimation = newStepScrollAnimation(oldStepScrollAnimation);
    }

    if (Blockly.registry) {
      // new Blockly

      const ContinuousFlyout = workspace.getToolbox().getFlyout().constructor;
      const oldSelectCategoryByScrollPosition = ContinuousFlyout.prototype.selectCategoryByScrollPosition_;
      ContinuousFlyout.prototype.selectCategoryByScrollPosition_ = function (position) {
        // fix rounding errors
        return oldSelectCategoryByScrollPosition.call(this, position + 1);
      };

      // the toolbox won't receive mouse events while a block is being dragged
      // we need to override its onDragEnter and onDragExit methods instead
      const newOnDragEnter = (oldOnDragEnter) =>
        function (...args) {
          if (!addon.self.disabled && isHoverMode()) openFlyout();
          return oldOnDragEnter.call(this, ...args);
        };
      const newOnDragExit = (oldOnDragExit) =>
        function (...args) {
          if (!addon.self.disabled && isHoverMode()) closeOnPointerUp = true;
          return oldOnDragExit.call(this, ...args);
        };
      const oldToolboxOnDragEnter = Blockly.Toolbox.prototype.onDragEnter;
      Blockly.Toolbox.prototype.onDragEnter = newOnDragEnter(oldToolboxOnDragEnter);
      const oldToolboxOnDragExit = Blockly.Toolbox.prototype.onDragExit;
      Blockly.Toolbox.prototype.onDragExit = newOnDragExit(oldToolboxOnDragExit);
      const oldFlyoutOnDragEnter = Blockly.Flyout.prototype.onDragEnter;
      Blockly.Flyout.prototype.onDragEnter = newOnDragEnter(oldFlyoutOnDragEnter);
      const oldFlyoutOnDragExit = Blockly.Flyout.prototype.onDragExit;
      Blockly.Flyout.prototype.onDragExit = newOnDragExit(oldFlyoutOnDragExit);
    }
  }

  while (true) {
    flyOut = await addon.tab.waitForElement(".blocklyFlyout", {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/theme/SET_THEME",
        "fontsLoaded/SET_FONTS_LOADED",
      ],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    scrollBar = document.querySelector(".blocklyFlyoutScrollbar");
    const blocksWrapper = document.querySelector('[class*="gui_blocks-wrapper_"]');
    const injectionDiv = document.querySelector(".injectionDiv");

    // Code editor left border
    const borderElement1 = document.createElement("div");
    borderElement1.className = "sa-flyout-border-1";
    addon.tab.displayNoneWhileDisabled(borderElement1);
    injectionDiv.appendChild(borderElement1);
    const borderElement2 = document.createElement("div");
    borderElement2.className = "sa-flyout-border-2";
    addon.tab.displayNoneWhileDisabled(borderElement2);
    injectionDiv.appendChild(borderElement2);

    // Placeholder Div
    if (placeHolderDiv) placeHolderDiv.remove();
    placeHolderDiv = document.createElement("div");
    blocksWrapper.appendChild(placeHolderDiv);
    placeHolderDiv.className = "sa-flyout-placeHolder";
    placeHolderDiv.style.display = "none"; // overridden by userstyle if the addon is enabled

    // Lock image
    if (lockObject) lockObject.remove();
    lockObject = document.createElementNS(SVG_NS, "foreignObject");
    lockObject.setAttribute("class", "sa-lock-object");
    lockObject.style.display = "none"; // overridden by userstyle if the addon is enabled
    lockButton = document.createElement("button");
    lockButton.className = "sa-lock-button";
    lockIcon = document.createElement("img");
    lockIcon.alt = "";
    updateLockDisplay();
    lockButton.onclick = () => {
      flyoutLocked = !flyoutLocked;
      updateLockDisplay();
    };
    lockButton.appendChild(lockIcon);
    lockObject.appendChild(lockButton);
    flyOut.appendChild(lockObject);

    closeFlyout(null, 0);
    toggle = false;

    let toolbox;
    if (Blockly.registry) toolbox = document.querySelector(".blocklyToolbox");
    else toolbox = document.querySelector(".blocklyToolboxDiv");

    const addExtensionButton = document.querySelector("[class^=gui_extension-button-container_]");

    for (let element of [toolbox, addExtensionButton, flyOut, scrollBar]) {
      element.onmouseenter = (e) => {
        if (!addon.self.disabled && isHoverMode()) openFlyout(e);
      };
      element.onmouseleave = (e) => {
        if (!addon.self.disabled && isHoverMode()) closeFlyout(e);
      };
    }
    placeHolderDiv.onmouseenter = (e) => {
      if (!addon.self.disabled && getToggleSetting() === "hover") openFlyout(e);
    };
    placeHolderDiv.onmouseleave = (e) => {
      if (!addon.self.disabled && getToggleSetting() === "hover") closeFlyout(e);
    };

    if (Blockly.registry) {
      // new Blockly: register the placeHolderDiv as a drag target
      const workspace = addon.tab.traps.getWorkspace();
      const component = new Blockly.DragTarget();
      component.id = "saHideFlyoutPlaceholder";
      component.getClientRect = () => {
        const rect = placeHolderDiv.getBoundingClientRect();
        return new Blockly.utils.Rect(rect.top, rect.bottom, rect.left, rect.right);
      };
      component.onDragEnter = () => {
        if (!addon.self.disabled && getToggleSetting() === "hover") openFlyout();
      };
      component.onDragExit = () => {
        if (!addon.self.disabled && getToggleSetting() === "hover") closeOnPointerUp = true;
      };
      workspace.getComponentManager().addComponent({
        component,
        weight: 1,
        capabilities: [Blockly.ComponentManager.Capability.DRAG_TARGET],
      });
      workspace.recordDragTargets();
    }

    doOneTimeSetup();
    initFlyoutState();
    Blockly.svgResize(addon.tab.traps.getWorkspace());
  }
}
