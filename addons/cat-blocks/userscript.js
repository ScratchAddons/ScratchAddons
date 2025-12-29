/**
 * Based on https://github.com/scratchfoundation/scratch-blocks/compare/hotfix/totally-normal-2021 (Apache 2.0)
 * It has been modified to work properly in our environment and fix some bugs.
 */

import { updateAllBlocks } from "../../libraries/common/cs/update-all-blocks.js";
import { managedBySa } from "../../libraries/common/cs/setting-managed-by-sa.js";

export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();

  let createSvgElement;
  if (Blockly.registry) createSvgElement = Blockly.utils.dom.createSvgElement;
  else createSvgElement = Blockly.utils.createSvgElement;

  const CAT_PATH =
    "c2.6,-2.3 5.5,-4.3 8.5,-6.2" +
    "c-1,-12.5 5.3,-23.3 8.4,-24.8c3.7,-1.8 16.5,13.1 18.4,15.4" +
    "c8.4,-1.3 17,-1.3 25.4,0c1.9,-2.3 14.7,-17.2 18.4,-15.4" +
    "c3.1,1.5 9.4,12.3 8.4,24.8c3,1.8 5.9,3.9 8.5,6.1";
  const TOP_LEFT_CORNER_DEFINE_CAT =
    "c0,-7.1 3.7,-13.3 9.3,-16.9c1.7,-7.5 5.4,-13.2 7.6,-14.2" +
    "c2.6,-1.3 10,6 14.6,11.1h33c4.6,-5.1 11.9,-12.4 14.6,-11.1" +
    "c1.9,0.9 4.9,5.2 6.8,11.1c2.6,0,5.2,0,7.8,0";

  const renderCatFace = (block) => {
    block.catPath_.svgFace.setAttribute("fill", "#000000");

    var closedEye = createSvgElement("path", {}, block.svgFace_);
    closedEye.setAttribute(
      "d",
      "M25.2-1.1c0.1,0,0.2,0,0.2,0l8.3-2.1l-7-4.8" +
        "c-0.5-0.3-1.1-0.2-1.4,0.3s-0.2,1.1,0.3,1.4L29-4.1l-4,1" +
        "c-0.5,0.1-0.9,0.7-0.7,1.2C24.3-1.4,24.7-1.1,25.2-1.1z"
    );
    closedEye.setAttribute("fill-opacity", "0");
    block.catPath_.svgFace.closedEye = closedEye;

    var closedEye2 = createSvgElement("path", {}, block.svgFace_);
    closedEye2.setAttribute(
      "d",
      "M62.4-1.1c-0.1,0-0.2,0-0.2,0l-8.3-2.1l7-4.8" +
        "c0.5-0.3,1.1-0.2,1.4,0.3s0.2,1.1-0.3,1.4l-3.4,2.3l4,1" +
        "c0.5,0.1,0.9,0.7,0.7,1.2C63.2-1.4,62.8-1.1,62.4-1.1z"
    );
    closedEye2.setAttribute("fill-opacity", "0");
    block.catPath_.svgFace.closedEye2 = closedEye2;

    var eye = createSvgElement("circle", {}, block.svgFace_);
    eye.setAttribute("cx", "59.2");
    eye.setAttribute("cy", "-3.3");
    eye.setAttribute("r", "3.4");
    eye.setAttribute("fill-opacity", "0.6");
    block.catPath_.svgFace.eye = eye;

    var eye2 = createSvgElement("circle", {}, block.svgFace_);
    eye2.setAttribute("cx", "29.1");
    eye2.setAttribute("cy", "-3.3");
    eye2.setAttribute("r", "3.4");
    eye2.setAttribute("fill-opacity", "0.6");
    block.catPath_.svgFace.eye2 = eye2;

    var mouth = createSvgElement("path", {}, block.svgFace_);
    mouth.setAttribute(
      "d",
      "M45.6,0.1c-0.9,0-1.7-0.3-2.3-0.9" +
        "c-0.6,0.6-1.3,0.9-2.2,0.9c-0.9,0-1.8-0.3-2.3-0.9c-1-1.1-1.1-2.6-1.1-2.8" +
        "c0-0.5,0.5-1,1-1l0,0c0.6,0,1,0.5,1,1c0,0.4,0.1,1.7,1.4,1.7" +
        "c0.5,0,0.7-0.2,0.8-0.3c0.3-0.3,0.4-1,0.4-1.3c0-0.1,0-0.1,0-0.2" +
        "c0-0.5,0.5-1,1-1l0,0c0.5,0,1,0.4,1,1c0,0,0,0.1,0,0.2" +
        "c0,0.3,0.1,0.9,0.4,1.2C44.8-2.2,45-2,45.5-2s0.7-0.2,0.8-0.3" +
        "c0.3-0.4,0.4-1.1,0.3-1.3c0-0.5,0.4-1,0.9-1.1c0.5,0,1,0.4,1.1,0.9" +
        "c0,0.2,0.1,1.8-0.8,2.8C47.5-0.4,46.8,0.1,45.6,0.1z"
    );
    mouth.setAttribute("fill-opacity", "0.6");

    block.catPath_.ear.setAttribute(
      "d",
      "M73.1-15.6c1.7-4.2,4.5-9.1,5.8-8.5" +
        "c1.6,0.8,5.4,7.9,5,15.4c0,0.6-0.7,0.7-1.1,0.5c-3-1.6-6.4-2.8-8.6-3.6" +
        "C72.8-12.3,72.4-13.7,73.1-15.6z"
    );
    block.catPath_.ear.setAttribute("fill", "#FFD5E6");

    block.catPath_.ear2.setAttribute(
      "d",
      "M22.4-15.6c-1.7-4.2-4.5-9.1-5.8-8.5" +
        "c-1.6,0.8-5.4,7.9-5,15.4c0,0.6,0.7,0.7,1.1,0.5c3-1.6,6.4-2.8,8.6-3.6" +
        "C22.8-12.3,23.2-13.7,22.4-15.6z"
    );
    block.catPath_.ear2.setAttribute("fill", "#FFD5E6");
  };

  const initCatStuff = (block) => {
    if (block.hasInitCatStuff) return;
    block.hasInitCatStuff = true;

    // Ear part of the SVG path for hat blocks
    var LEFT_EAR_UP = "c-1,-12.5 5.3,-23.3 8.4,-24.8c3.7,-1.8 16.5,13.1 18.4,15.4";
    var LEFT_EAR_DOWN = "c-5.8,-4.8 -8,-18 -4.9,-19.5c3.7,-1.8 24.5,11.1 31.7,10.1";
    var RIGHT_EAR_UP = "c1.9,-2.3 14.7,-17.2 18.4,-15.4c3.1,1.5 9.4,12.3 8.4,24.8";
    var RIGHT_EAR_DOWN = "c7.2,1 28,-11.9 31.7,-10.1c3.1,1.5 0.9,14.7 -4.9,19.5";
    // Ears look slightly different for define hat blocks
    var DEFINE_HAT_LEFT_EAR_UP = "c0,-7.1 3.7,-13.3 9.3,-16.9c1.7,-7.5 5.4,-13.2 7.6,-14.2c2.6,-1.3 10,6 14.6,11.1";
    var DEFINE_HAT_RIGHT_EAR_UP = "h33c4.6,-5.1 11.9,-12.4 14.6,-11.1c1.9,0.9 4.9,5.2 6.8,11.1c2.6,0,5.2,0,7.8,0";
    var DEFINE_HAT_LEFT_EAR_DOWN =
      "c0,-4.6 1.6,-8.9 4.3,-12.3c-2.4,-5.6 -2.9,-12.4 -0.7,-13.4c2.1,-1 9.6,2.6 17,5.8" + "c2.6,0 6.2,0 10.9,0";
    var DEFINE_HAT_RIGHT_EAR_DOWN = "c0,0 25.6,0 44,0c7.4,-3.2 14.8,-6.8 16.9,-5.8c1.2,0.6 1.6,2.9 1.3,5.8";

    if (Blockly.registry) {
      // On new Blockly, the cat is positioned relative to the top of the hat, not the bottom
      const hatHeight = block.hat === "bowler" ? 20 : 31;
      block.catPath_.setAttribute("transform", `translate(0, ${hatHeight})`);
    }

    block.catPath_.ear = createSvgElement("path", {}, block.catPath_);
    block.catPath_.ear2 = createSvgElement("path", {}, block.catPath_);
    if (block.RTL) {
      // Mirror the ears.
      block.catPath_.ear.setAttribute("transform", "scale(-1 1)");
      block.catPath_.ear2.setAttribute("transform", "scale(-1 1)");
    }
    block.catPath_.addEventListener("mouseenter", (event) => {
      clearTimeout(block.blinkFn);
      // blink
      if (event.target.svgFace.eye) {
        event.target.svgFace.eye.setAttribute("fill-opacity", "0");
        event.target.svgFace.eye2.setAttribute("fill-opacity", "0");
        event.target.svgFace.closedEye.setAttribute("fill-opacity", "0.6");
        event.target.svgFace.closedEye2.setAttribute("fill-opacity", "0.6");
      }

      // reset after a short delay
      block.blinkFn = setTimeout(() => {
        if (event.target.svgFace.eye) {
          event.target.svgFace.eye.setAttribute("fill-opacity", "0.6");
          event.target.svgFace.eye2.setAttribute("fill-opacity", "0.6");
          event.target.svgFace.closedEye.setAttribute("fill-opacity", "0");
          event.target.svgFace.closedEye2.setAttribute("fill-opacity", "0");
        }
      }, 100);
    });

    block.catPath_.ear.addEventListener("mouseenter", () => {
      clearTimeout(block.earFn);
      clearTimeout(block.ear2Fn);
      // ear flick
      block.catPath_.ear.setAttribute("fill-opacity", "0");
      block.catPath_.ear2.setAttribute("fill-opacity", "");
      var bodyPath = block.catPath_.svgBody.getAttribute("d");
      bodyPath = bodyPath.replace(RIGHT_EAR_UP, RIGHT_EAR_DOWN);
      bodyPath = bodyPath.replace(DEFINE_HAT_RIGHT_EAR_UP, DEFINE_HAT_RIGHT_EAR_DOWN);
      bodyPath = bodyPath.replace(LEFT_EAR_DOWN, LEFT_EAR_UP);
      bodyPath = bodyPath.replace(DEFINE_HAT_LEFT_EAR_DOWN, DEFINE_HAT_LEFT_EAR_UP);
      block.catPath_.svgBody.setAttribute("d", bodyPath);

      // reset after a short delay
      block.earFn = setTimeout(() => {
        block.catPath_.ear.setAttribute("fill-opacity", "");
        var bodyPath = block.catPath_.svgBody.getAttribute("d");
        bodyPath = bodyPath.replace(RIGHT_EAR_DOWN, RIGHT_EAR_UP);
        bodyPath = bodyPath.replace(DEFINE_HAT_RIGHT_EAR_DOWN, DEFINE_HAT_RIGHT_EAR_UP);
        block.catPath_.svgBody.setAttribute("d", bodyPath);
      }, 50);
    });
    block.catPath_.ear2.addEventListener("mouseenter", () => {
      clearTimeout(block.earFn);
      clearTimeout(block.ear2Fn);
      // ear flick
      block.catPath_.ear2.setAttribute("fill-opacity", "0");
      block.catPath_.ear.setAttribute("fill-opacity", "");
      var bodyPath = block.catPath_.svgBody.getAttribute("d");
      bodyPath = bodyPath.replace(LEFT_EAR_UP, LEFT_EAR_DOWN);
      bodyPath = bodyPath.replace(DEFINE_HAT_LEFT_EAR_UP, DEFINE_HAT_LEFT_EAR_DOWN);
      bodyPath = bodyPath.replace(RIGHT_EAR_DOWN, RIGHT_EAR_UP);
      bodyPath = bodyPath.replace(DEFINE_HAT_RIGHT_EAR_DOWN, DEFINE_HAT_RIGHT_EAR_UP);
      block.catPath_.svgBody.setAttribute("d", bodyPath);

      // reset after a short delay
      block.ear2Fn = setTimeout(() => {
        block.catPath_.ear2.setAttribute("fill-opacity", "");
        var bodyPath = block.catPath_.svgBody.getAttribute("d");
        bodyPath = bodyPath.replace(LEFT_EAR_DOWN, LEFT_EAR_UP);
        bodyPath = bodyPath.replace(DEFINE_HAT_LEFT_EAR_DOWN, DEFINE_HAT_LEFT_EAR_UP);
        block.catPath_.svgBody.setAttribute("d", bodyPath);
      }, 50);
    });
    resetFacePosition(block);
    block.windowListener = (event) => {
      if (!shouldWatchMouse(block)) return;
      var time = Date.now();
      if (time < block.lastCallTime + block.CALL_FREQUENCY_MS) return;
      block.lastCallTime = time;

      // mouse watching
      if (block.workspace) {
        // not disposed
        var xy = getCatFacePosition(block);
        var mouseLocation = {
          x: event.x / block.workspace.scale,
          y: event.y / block.workspace.scale,
        };

        var dx = mouseLocation.x - xy.x;
        var dy = mouseLocation.y - xy.y;
        var theta = Math.atan2(dx, dy);

        // Map the vector from the cat face to the mouse location to a much shorter
        // vector in the same direction, which will be the translation vector for
        // the cat face
        var delta = Math.sqrt(dx * dx + dy * dy);
        var scaleFactor = delta / (delta + 1);

        // Equation for radius of ellipse at theta for axes with length a and b
        var a = 2;
        var b = 5;
        var r = (a * b) / Math.sqrt(Math.pow(b * Math.cos(theta), 2) + Math.pow(a * Math.sin(theta), 2));

        // Convert polar coordinate back to x, y coordinate
        dx = r * scaleFactor * Math.sin(theta);
        dy = r * scaleFactor * Math.cos(theta);

        if (block.RTL) dx -= 87; // Translate face over
        block.svgFace_.style.transform = "translate(" + dx + "px, " + dy + "px)";
      }
    };
    attachMouseMoveListener(block);
  };

  const attachMouseMoveListener = (block) => {
    if (addon.settings.get("watch") === true) {
      document.addEventListener("mousemove", block.windowListener);
    }
  };

  const detachMouseMoveListener = (block) => {
    document.removeEventListener("mousemove", block.windowListener);
  };

  const resetFacePosition = (block) => {
    if (block.RTL) {
      block.svgFace_.style.transform = "translate(-87px, 0px)";
    } else {
      block.svgFace_.style.transform = "";
    }
  };

  let workspacePositionRect = null;
  // Currently this function does not work very well in RTL or when zooming in/out too much of the workspace.
  const getCatFacePosition = (block) => {
    if (!workspacePositionRect) {
      workspacePositionRect = block.workspace.getParentSvg().getBoundingClientRect();
    }
    var offset = { x: workspacePositionRect.x, y: workspacePositionRect.y };

    // flyout category offset
    offset.x += 60;
    if (!block.isInFlyout && block.workspace.getFlyout()) {
      offset.x += block.workspace.getFlyout().getWidth();
    }

    offset.x += block.workspace.scrollX;
    offset.y += block.workspace.scrollY;

    var xy = block.getRelativeToSurfaceXY(block.getSvgRoot());
    if (block.RTL) {
      xy.x = block.workspace.getWidth() - xy.x - block.width;
    }

    // convert to workspace units
    xy.x += offset.x / block.workspace.scale;
    xy.y += offset.y / block.workspace.scale;
    // distance to center of face
    xy.x -= 43.5;
    xy.y -= 4;

    if (block.RTL) {
      // We've been calculating from the right edge. Convert x to from left edge.
      xy.x = screen.width - xy.x;
    }
    return xy;
  };

  const shouldWatchMouse = (block) => {
    if (addon.self.disabled) return false;
    var xy = getCatFacePosition(block);
    const MARGIN = 50;
    var blockXOnScreen = xy.x > -MARGIN && xy.x - MARGIN < screen.width / block.workspace.scale;
    var blockYOnScreen = xy.y > -MARGIN && xy.y - MARGIN < screen.height / block.workspace.scale;
    let isGlowingStack;
    if (Blockly.registry) {
      // new Blockly
      isGlowingStack = block.getSvgRoot().hasAttribute("filter");
    } else {
      isGlowingStack = block.isGlowingStack_;
    }
    return !block.outputConnection && !block.previousConnection && !isGlowingStack && blockXOnScreen && blockYOnScreen;
  };

  const catBlockConstructor = (block) => {
    let svgPath;
    if (block.pathObject)
      svgPath = block.pathObject.svgPath; // new Blockly
    else svgPath = block.svgPath_;

    block.catPath_ = createSvgElement("g", {}, block.getSvgRoot());

    block.svgFace_ = createSvgElement("g", {}, block.catPath_);
    block.catPath_.svgFace = block.svgFace_;
    block.catPath_.svgBody = svgPath;
    block.lastCallTime = 0;
    block.CALL_FREQUENCY_MS = 60;
  };

  if (Blockly.registry) {
    const oldMakeStartHat = Blockly.zelos.ConstantProvider.prototype.makeStartHat;
    Blockly.zelos.ConstantProvider.prototype.makeStartHat = function () {
      const hat = oldMakeStartHat.call(this);
      if (!addon.self.disabled) {
        hat.height = 31;
        hat.path = CAT_PATH;
      }
      return hat;
    };

    const ScratchRenderer = Blockly.registry.getClass(Blockly.registry.Type.RENDERER, "scratch");
    const oldMakeDrawer = ScratchRenderer.prototype.makeDrawer_;
    ScratchRenderer.prototype.makeDrawer_ = function (...args) {
      const drawer = oldMakeDrawer.call(this, ...args);

      const oldDrawTop = drawer.drawTop_;
      drawer.drawTop_ = function () {
        if (addon.self.disabled || !this.info_.isBowlerHatBlock()) {
          return oldDrawTop.call(this);
        }
        // https://github.com/scratchfoundation/scratch-blocks/blob/2884131/src/renderer/drawer.ts#L48-L54
        const realWidth = this.info_.width;
        const catWidth = 73.7;
        this.info_.width = realWidth - catWidth;
        oldDrawTop.call(this);
        this.outlinePath_ = this.outlinePath_.replace("a20,20 0 0,1 20,-20", TOP_LEFT_CORNER_DEFINE_CAT);
        this.info_.width = realWidth;
      };

      return drawer;
    };

    const oldDraw = Blockly.zelos.Drawer.prototype.draw;
    Blockly.zelos.Drawer.prototype.draw = function () {
      if (!addon.self.disabled && !this.block_.svgFace_) {
        catBlockConstructor(this.block_);
      }
      oldDraw.call(this);
      if (!addon.self.disabled && !this.block_.outputConnection && !this.block_.previousConnection) {
        initCatStuff(this.block_);
        if (!this.block_.svgFace_.firstChild) {
          renderCatFace(this.block_);
        }
      }
    };
  } else {
    const patchProperty = (object, name, newValue) => {
      const oldProperty = Object.getOwnPropertyDescriptor(object, name);
      Object.defineProperty(object, name, {
        ...oldProperty,
        get() {
          if (addon.self.disabled) return oldProperty.get();
          return newValue;
        },
      });
    };

    patchProperty(Blockly.BlockSvg, "START_HAT_PATH", CAT_PATH);
    patchProperty(Blockly.BlockSvg, "TOP_LEFT_CORNER_DEFINE_HAT", TOP_LEFT_CORNER_DEFINE_CAT);
    patchProperty(Blockly.BlockSvg, "START_HAT_HEIGHT", 31);

    const originalRenderDraw = Blockly.BlockSvg.prototype.renderDraw_;
    Blockly.BlockSvg.prototype.renderDraw_ = function (...args) {
      if (!addon.self.disabled && !this.svgFace_) {
        catBlockConstructor(this);
      }
      const r = originalRenderDraw.call(this, ...args);
      if (!addon.self.disabled && !this.outputConnection && !this.previousConnection) {
        initCatStuff(this);
      }
      if (!addon.self.disabled && this.startHat_ && !this.svgFace_.firstChild) {
        renderCatFace(this);
      }
      return r;
    };
  }

  const originalDispose = Blockly.BlockSvg.prototype.dispose;
  Blockly.BlockSvg.prototype.dispose = function (...args) {
    clearTimeout(this.blinkFn);
    clearTimeout(this.earFn);
    clearTimeout(this.ear2Fn);
    detachMouseMoveListener(this);
    return originalDispose.call(this, ...args);
  };

  const vm = addon.tab.traps.vm;
  const getBlockById = (id) => {
    const workspace = addon.tab.traps.getWorkspace();
    if (!workspace) return null;
    const flyoutWorkspace = workspace.getFlyout().getWorkspace();
    return workspace.getBlockById(id) || flyoutWorkspace.getBlockById(id);
  };
  vm.on("SCRIPT_GLOW_ON", ({ id }) => {
    if (addon.tab.editorMode !== "editor") return;
    const block = getBlockById(id);
    if (!block) return;
    // For performance, don't follow the mouse when the stack is glowing
    detachMouseMoveListener(block);
    resetFacePosition(block);
    if (block.workspace && block.svgFace_.style) {
      // reset face direction
      if (block.RTL) {
        block.svgFace_.style.transform = "translate(-87px, 0px)";
      } else {
        block.svgFace_.style.transform = "";
      }
    }
  });
  vm.on("SCRIPT_GLOW_OFF", ({ id }) => {
    if (addon.tab.editorMode !== "editor") return;
    const block = getBlockById(id);
    if (!block) return;
    attachMouseMoveListener(block);
  });

  const getTheme = () => (addon.tab.redux.state ? addon.tab.redux.state.scratchGui.settings.theme : "default");
  const setTheme = async (newTheme) => {
    if (!addon.tab.redux.state) return;
    const currentTheme = getTheme();
    if (newTheme != currentTheme) {
      addon.tab.redux.dispatch({
        type: "scratch-gui/settings/SET_THEME",
        theme: newTheme,
      });
      // wait for new workspace to render
      await new Promise((resolve) => {
        const oldInject = Blockly.inject;
        Blockly.inject = function (...args) {
          Blockly.inject = oldInject;
          setTimeout(() => resolve(), 0);
          return oldInject.call(this, ...args);
        };
      });
    }
  };
  let scratchTheme = getTheme();

  const update = async () => {
    if (!addon.self.disabled) {
      // disable Scratch's cat blocks theme to avoid conflicts
      scratchTheme = getTheme();
      await setTheme("default");
    } else {
      await setTheme(scratchTheme);
    }

    if (Blockly.registry) {
      // new Blockly
      const workspace = addon.tab.traps.getWorkspace();
      workspace.renderer.refreshDom(workspace.getSvgGroup(), workspace.getTheme(), workspace.getInjectionDiv());

      const flyout = workspace.getFlyout();
      if (flyout) {
        const flyoutWorkspace = flyout.getWorkspace();
        flyoutWorkspace.renderer.refreshDom(flyoutWorkspace.getSvgGroup(), flyoutWorkspace.getTheme(), null);
      }
    }

    updateAllBlocks(addon.tab);
  };

  update();

  addon.self.addEventListener("disabled", update);
  addon.self.addEventListener("reenabled", update);
  addon.settings.addEventListener("change", () => {
    const workspace = addon.tab.traps.getWorkspace();
    const topBlocks = workspace.getTopBlocks();
    const flyoutWorkspace = workspace.getFlyout().getWorkspace();
    const flyoutBlocks = flyoutWorkspace.getTopBlocks();
    for (const block of [...topBlocks, ...flyoutBlocks]) {
      if (!block.hasInitCatStuff) continue;
      if (addon.settings.get("watch") === true) {
        attachMouseMoveListener(block);
      } else {
        detachMouseMoveListener(block);
        resetFacePosition(block);
      }
    }
  });

  while (true) {
    const themeSubmenu = await addon.tab.waitForElement(
      "[class*=menu-bar_menu-bar-menu_] > ul > li:nth-child(2):not(:last-child) ul",
      {
        markAsSeen: true,
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      }
    );
    themeSubmenu.classList.add("sa-theme-submenu");
    managedBySa(addon, themeSubmenu);
  }
}
