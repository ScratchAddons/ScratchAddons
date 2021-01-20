let wrap, vm, addon, safeMsg, msg;
let a11yObjects = {};
let getTabNav = function getTabNav() {
  return false;
};
let blockColorOverrides = {};
blockColorOverrides["set sprite aria role to %s"] = blockColorOverrides["set sprite label to %s"] = {
  color: "#43cfca",
  secondaryColor: "#3aa8a4",
  tertiaryColor: "#3aa8a4",
};

function makeWrap() {
  wrap = document.createElement("div");
  wrap.id = "aria-container";
  let canvas = document.querySelector(
    '[class*="stage_stage-wrapper_"] [class*="stage_stage_"][class*="box_box_"] canvas'
  );
  canvas.insertAdjacentElement("beforeBegin", wrap);
  function pass2canvas(e) {
    let o = {
      touches: e.touches,
      clientX: e.clientX,
      clientY: e.clientY,
      changedTouches: e.changedTouches,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    };
    canvas.dispatchEvent(new e.constructor(e.type, o));
  }
  wrap.addEventListener("mousedown", pass2canvas);
  wrap.addEventListener("touchstart", pass2canvas);
  wrap.addEventListener("wheel", pass2canvas);
}

function cleanUp() {
  let targets = vm.runtime.targets.map((e) => e.id);
  targets.forEach((e) => {
    a11yObjects[e] = a11yObjects[e] || {};
  });
  Object.keys(a11yObjects)
    .filter((e) => !targets.includes(e))
    .forEach((e) => {
      a11yObjects[e].ele.remove();
      delete a11yObjects[e];
    });
}

let injected;

const injectWorkspace = () => {
  if (window.ENABLE_A11Y_BLOCKS) {
    if (injected) {
      return;
    }
    injected = true;

    const workspace = Blockly.getMainWorkspace();
    if (!workspace) throw new Error("expected workspace");

    let BlockSvg = Object.values(Blockly.getMainWorkspace().getFlyout().checkboxes_)[0].block.constructor;
    let oldUpdateColor = BlockSvg.prototype.updateColour;
    BlockSvg.prototype.updateColour = function (...a) {
      if (this.procCode_) {
        let p = this.procCode_;
        if (blockColorOverrides[p.trim().toLowerCase()]) {
          let c = blockColorOverrides[p.trim().toLowerCase()];
          this.colour_ = c.color;
          this.colourSecondary_ = c.secondaryColor;
          this.colourTertiary_ = c.tertiaryColor;
          let updateChildColors = function updateChildColors() {
            this.childBlocks_.forEach(
              ((e) => {
                e.setColour(e.getColour(), e.getColourSecondary(), this.getColourTertiary());
              }).bind(this)
            );
          }.bind(this);
          updateChildColors();
          const oldPush = this.childBlocks_.constructor.prototype.push.bind(this.childBlocks_);
          this.childBlocks_.push = function (...a) {
            updateChildColors();
            return oldPush(...a);
          };
        }
      }
      return oldUpdateColor.call(this, ...a);
    };

    const flyout = workspace.getFlyout();
    if (!flyout) throw new Error("expected flyout");

    vm = addon.tab.traps.vm;
    if (!vm) throw new Error("expected vm");

    // Each time a new workspace is made, these callbacks are reset, so re-register whenever a flyout is shown.
    // https://github.com/LLK/scratch-blocks/blob/61f02e4cac0f963abd93013842fe536ef24a0e98/core/flyout_base.js#L469
    const originalShow = flyout.constructor.prototype.show;
    flyout.constructor.prototype.show = function (xml) {
      this.workspace_.registerToolboxCategoryCallback("A11Y", function (e) {
        return [
          ...new DOMParser()
            .parseFromString(
              `<top><block type="procedures_call" gap="16"><mutation generateshadows="true" proccode="set sprite aria role to %s" argumentids="[&quot;czc6,OD@W7qzCng-$6Ut&quot;]" argumentnames="[&quot;role&quot;]" argumentdefaults="[&quot;img&quot;]" warp="false"></mutation></block>
<block type="procedures_call" gap="16"><mutation generateshadows="true" proccode="set sprite label to %s" argumentids="[&quot;E|XlmQQ}1C:3vH-VY2Q_&quot;]" argumentnames="[&quot;text&quot;]" argumentdefaults="[&quot;&quot;]" warp="false"></mutation></block></top>`,
              "text/xml"
            )
            .querySelectorAll("block"),
        ];
      });
      originalShow.call(this, xml);
    };

    // We use Scratch's extension category mechanism to replace the data category with our own.
    // https://github.com/LLK/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
    // https://github.com/LLK/scratch-gui/blob/2ceab00370ad7bd8ecdf5c490e70fd02152b3e2a/src/lib/make-toolbox-xml.js#L763
    // https://github.com/LLK/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
    const originalGetBlocksXML = vm.runtime.getBlocksXML;
    vm.runtime.getBlocksXML = function (target) {
      const result = originalGetBlocksXML.call(this, target);
      result.push({
        id: "a11ycat",
        xml: `
          <category
            name="${safeMsg("a11y-category")}"
            id="a11ycat"
            colour="#43cfca"
            secondaryColour="#3aa8a4"
            custom="A11Y">
          </category>`,
      });
      return result;
    };

    // If editingTarget has not been set yet, we have injected before the editor has loaded and emitWorkspaceUpdate will be called later.
    // Otherwise, it's possible that the editor has already loaded and updated its toolbox, so force a workspace update.
    // Workspace updates are slow, so don't do them unless necessary.
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }
  }
};
export default async function (o) {
  const { global, addon, safeMsg, msg, console } = o;
  async function ensureWrap() {
    while (true) {
      await addon.tab.waitForElement('[class*="stage_stage-wrapper_"] [class*="stage_stage_"][class*="box_box_"]', {
        markAsSeen: true,
      });
      makeWrap();
    }
  }
  function updateAria(target) {
    if (!wrap) return;
    if (!target.visible) {
      if (a11yObjects[target.id]) {
        if (a11yObjects[target.id].ele) a11yObjects[target.id].ele.remove();
      }
      return;
    }
    a11yObjects[target.id] = a11yObjects[target.id] || {};
    if (!a11yObjects[target.id].ele || (a11yObjects[target.id].ele && !a11yObjects[target.id].ele.isConnected)) {
      a11yObjects[target.id].ele = document.createElement("div");
      a11yObjects[target.id].ele.className = "aria-item";
      a11yObjects[target.id].ele.dataset.spriteId = target.id;
      wrap.append(a11yObjects[target.id].ele);
    }
    if (getTabNav()) {
      a11yObjects[target.id].ele.setAttribute("tabindex", "0");
    } else {
      a11yObjects[target.id].ele.removeAttribute("tabindex");
    }
    let bounds = target.renderer.getBounds(target.drawableID);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-width", bounds.width);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-height", bounds.height);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-top", bounds.top);
    a11yObjects[target.id].ele.style.setProperty("--aria-bounds-left", bounds.left);
    if (a11yObjects[target.id].role) {
      a11yObjects[target.id].ele.setAttribute("role", a11yObjects[target.id].role);
    } else {
      a11yObjects[target.id].ele.removeAttribute("role");
    }
    let bubbleMessage = "";
    let state = target.getCustomState("Scratch.looks");
    if (state) {
      if (state.text && state.text.trim()) {
        bubbleMessage = msg(state.type + "Bubble", { text: state.text.trim() });
      }
    }
    if (a11yObjects[target.id].label || bubbleMessage) {
      a11yObjects[target.id].ele.setAttribute(
        "aria-label",
        a11yObjects[target.id].label ? a11yObjects[target.id].label + " " + bubbleMessage : bubbleMessage
      );
    } else {
      a11yObjects[target.id].ele.removeAttribute("aria-label");
    }
  }
  async function renderLoop() {
    while (true) {
      cleanUp();
      for (let e of Object.entries(a11yObjects)) {
        updateAria(vm.runtime.targets.filter((a) => a.id === e[0])[0]);
      }
      vm.runtime.targets.forEach(
        (e) =>
          (e.blocks._cache.procedureParamNames["set sprite aria role to %s"] = [
            ["text"],
            ["czc6,OD@W7qzCng-$6Ut"],
            ["img"],
          ])
      );
      vm.runtime.targets.forEach(
        (e) =>
          (e.blocks._cache.procedureParamNames["set sprite label to %s"] = [["text"], ["E|XlmQQ}1C:3vH-VY2Q_"], [""]])
      );
      await new Promise((cb) => requestAnimationFrame((_) => cb()));
    }
  }

  getTabNav = function getTabNav() {
    return o.addon.settings.get("tabNav");
  };
  console.log("a11y support enabled");
  vm = addon.tab.traps.vm;
  ensureWrap();
  renderLoop();
  const oldStepToProcedure = vm.runtime.sequencer.stepToProcedure;
  vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
    if (proccode.trim().toLowerCase() === "set sprite aria role to %s") {
      a11yObjects[thread.target.id] = a11yObjects[thread.target.id] || {};
      a11yObjects[thread.target.id].role = Object.values(thread.stackFrames[0].params)[0];
    } else if (proccode.trim().toLowerCase() === "set sprite label to %s") {
      a11yObjects[thread.target.id] = a11yObjects[thread.target.id] || {};
      a11yObjects[thread.target.id].label = Object.values(thread.stackFrames[0].params)[0];
    }
    return oldStepToProcedure.call(this, thread, proccode);
  };

  if (addon.tab.editorMode === "editor") {
    const interval = setInterval(() => {
      if (typeof Blockly === "object" && Blockly.getMainWorkspace()) {
        injectWorkspace();
        clearInterval(interval);
      }
    }, 100);
  }
  addon.tab.addEventListener("urlChange", () => addon.tab.editorMode === "editor" && injectWorkspace());
}
