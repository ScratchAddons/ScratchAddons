export default async function ({ addon, global, console, msg }) {
  const img = document.createElement("img");
  img.className = `debug-btn ${addon.tab.scratchClass('button_outlined-button')}`;
  img.src = addon.self.dir + "/debug.svg";
  img.draggable = false;
  img.title = msg("debug");
  img.addEventListener("click", () => showConsole());

  const vm = addon.tab.traps.vm;
  let blockColorOverrides = {};
  blockColorOverrides["log %s"] = {
    color: "#43cfca",
    secondaryColor: "#3aa8a4",
    tertiaryColor: "#3aa8a4",
  };

  let injected;
  let debug;
  const addItem = (thread) => {
    let logs = document.querySelector(".debug > .logs");
    let div = document.createElement("div");
    div.innerText = thread.stackFrames[0].params.text;
    div.classList = `log ${addon.tab.scratchClass("sprite-info_sprite-info")}`;
    logs.appendChild(div);
    console.log(thread.stackFrames[0].params.text);
  };
  const addConsole = () => {
    document.querySelector("body").insertAdjacentHTML(
      "afterbegin",
      `
    <div class="debug ${addon.tab.scratchClass("card_card")} ">
    <h1 class="${addon.tab.scratchClass("card_header-buttons")}">Debugger</h1>
    <div class="${addon.tab.scratchClass("sprite-info_sprite-info")} logs">
    </div>
    </div>
    `
    );
    let debug = document.querySelector(".debug");

    var pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    document.querySelector(".debug h1").onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      debug.style.top = debug.offsetTop - pos2 + "px";
      debug.style.left = debug.offsetLeft - pos1 + "px";
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = null;
      document.onmousemove = null;
    }
  };
  addConsole();
  const showConsole = () => {
    let debug = document.querySelector(".debug");
    debug.style.display = "block";
  };
  const injectWorkspace = () => {
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

    if (!vm) throw new Error("expected vm");

    // Each time a new workspace is made, these callbacks are reset, so re-register whenever a flyout is shown.
    // https://github.com/LLK/scratch-blocks/blob/61f02e4cac0f963abd93013842fe536ef24a0e98/core/flyout_base.js#L469
    const originalShow = flyout.constructor.prototype.show;
    flyout.constructor.prototype.show = function (xml) {
      this.workspace_.registerToolboxCategoryCallback("console", function (e) {
        return [
          ...new DOMParser()
            .parseFromString(
              `<top>
  <block type="procedures_call" gap="16"><mutation generateshadows="true" proccode="log %s" argumentids="[&quot;E|XlmQQ}1C:3vH-VY2Q_&quot;]" argumentnames="[&quot;text&quot;]" argumentdefaults="[&quot;&quot;]" warp="false"></mutation></block></top>`,
              "text/xml"
            )
            .querySelectorAll("block"),
        ];
      });
      const oldStepToProcedure = vm.runtime.sequencer.stepToProcedure;
      vm.runtime.sequencer.stepToProcedure = function (thread, proccode) {
        if (proccode.trim().toLowerCase() === "log %s") {
          addItem(thread);
        }
        return oldStepToProcedure.call(this, thread, proccode.text);
      };

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
        id: "console",
        xml: `
            <category
              name="Console"
              id="console"
              colour="#43cfca"
              secondaryColour="#3aa8a4"
              custom="console">
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
  };

  while (true) {
    injectWorkspace();
    const button = await addon.tab.waitForElement("[class^='stage-header_stage-size-row']", { markAsSeen: true });
    button.insertAdjacentElement("afterBegin", img);

    while (true) {
      vm.runtime.targets.forEach(
        (e) => (e.blocks._cache.procedureParamNames["log %s"] = [["text"], ["E|XlmQQ}1C:3vH-VY2Q_"], [""]])
      );
      await new Promise((cb) => requestAnimationFrame((_) => cb()));
    }
  }
}
