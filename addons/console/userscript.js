export default async function ({ addon, global, console, msg }) {
  let workspace;
  const img = document.createElement("img");
  img.className = `debug-btn ${addon.tab.scratchClass("button_outlined-button")}`;
  img.src = addon.self.dir + "/debug.svg";
  img.draggable = false;
  img.title = msg("debug");
  img.addEventListener("click", () => showConsole());

  const vm = addon.tab.traps.vm;
  addon.tab.addBlock("log %s", ["content"], ({ content }, targetId, blockId) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, blockId);
  });

  let injected;
  let debug;
  const goToBlock = (blockId) => {
    const offsetX = 32,
      offsetY = 32;
    const block = workspace.getBlockById(blockId);
    if (!block) return;

    // Copied from devtools. If it's code get's improved for this function, bring those changes here too.
    let root = block.getRootBlock();

    let base = block;
    while (base.getOutputShape() && base.getSurroundParent()) {
      base = base.getSurroundParent();
    }

    let ePos = base.getRelativeToSurfaceXY(), // Align with the top of the block
      rPos = root.getRelativeToSurfaceXY(), // Align with the left of the block 'stack'
      eSiz = block.getHeightWidth(),
      scale = workspace.scale,
      // x = (ePos.x + (workspace.RTL ? -1 : 1) * eSiz.width / 2) * scale,
      x = rPos.x * scale,
      y = ePos.y * scale,
      xx = block.width + x, // Turns out they have their x & y stored locally, and they are the actual size rather than scaled or including children...
      yy = block.height + y,
      // xx = eSiz.width * scale + x,
      // yy = eSiz.height * scale + y,

      s = workspace.getMetrics();
    if (
      x < s.viewLeft + offsetX - 4 ||
      xx > s.viewLeft + s.viewWidth ||
      y < s.viewTop + offsetY - 4 ||
      yy > s.viewTop + s.viewHeight
    ) {
      // sx = s.contentLeft + s.viewWidth / 2 - x,
      let sx = x - s.contentLeft - offsetX,
        // sy = s.contentTop - y + Math.max(Math.min(32, 32 * scale), (s.viewHeight - yh) / 2);
        sy = y - s.contentTop - offsetY;

      // workspace.hideChaff(),
      workspace.scrollbar.set(sx, sy);
    }
    // Flashing
    const myFlash = { block: null, timerID: null, colour: null };
    if (myFlash.timerID > 0) {
      clearTimeout(myFlash.timerID);
      myFlash.block.setColour(myFlash.colour);
    }

    let count = 4;
    let flashOn = true;
    myFlash.colour = block.getColour();
    myFlash.block = block;

    function _flash() {
      myFlash.block.svgPath_.style.fill = flashOn ? "#ffff80" : myFlash.colour;
      flashOn = !flashOn;
      count--;
      if (count > 0) {
        myFlash.timerID = setTimeout(_flash, 200);
      } else {
        myFlash.timerID = 0;
      }
    }

    _flash();
  };
  const addItem = (content, blockId) => {
    let logs = document.querySelector(".debug > .logs");
    let div = document.createElement("div");
    div.innerText = content;
    div.classList = `log ${addon.tab.scratchClass("sprite-info_sprite-info")}`;
    logs.appendChild(div);

    const block = workspace.getBlockById(blockId);
    const inputBlock = block.getChildren().find((b) => b.parentBlock_.id === blockId);
    console.log(inputBlock);
    if (inputBlock.type === "data_variable") {
      let varBlock;
      for (const variable of workspace.getAllVariables()) {
        const block = workspace.getVariableUsesById(variable.id_).find((vari) => vari.id === inputBlock.id);
        if (block) varBlock = variable;
      }
      const varSpan = document.createElement("span");
      varSpan.innerText = varBlock.name;
      varSpan.className = "console-variable";
      div.prepend(varSpan);
    }
    let link = document.createElement("a");
    link.innerText = "Go to";

    link.addEventListener("click", () => goToBlock(blockId));
    div.appendChild(link);
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

  while (true) {
    const button = await addon.tab.waitForElement("[class^='stage-header_stage-size-row']", { markAsSeen: true });
    button.insertAdjacentElement("afterBegin", img);
  }
}
