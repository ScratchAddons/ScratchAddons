export default async function ({ addon, global, console, msg }) {
  let workspace, showingConsole;
  const img = document.createElement("img");
  img.className = `debug-btn ${addon.tab.scratchClass("button_outlined-button")}`;
  img.src = addon.self.dir + "/debug.svg";
  img.draggable = false;
  img.title = msg("debug");
  img.addEventListener("click", () => toggleConsole());

  const vm = addon.tab.traps.vm;
  addon.tab.addBlock("log %s", ["content"], ({ content }, targetId, blockId) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, targetId, blockId, "log");
  });
  addon.tab.addBlock("warn %s", ["content"], ({ content }, targetId, blockId) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, targetId, blockId, "warn");
  });
  addon.tab.addBlock("error %s", ["content"], ({ content }, targetId, blockId) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, targetId, blockId, "error");
  });
  let injected;
  const goToBlock = (blockId) => {
    const offsetX = 32,
      offsetY = 32;
    const block = workspace.getBlockById(blockId);
    if (!block) return;

    // Copied from devtools. If it's code gets improved for this function, bring those changes here too.
    let root = block.getRootBlock();

    let base = block;
    while (base.getOutputShape() && base.getSurroundParent()) {
      base = base.getSurroundParent();
    }

    let ePos = base.getRelativeToSurfaceXY(), // Align with the top of the block
      rPos = root.getRelativeToSurfaceXY(), // Align with the left of the block 'stack'
      eSiz = block.getHeightWidth(),
      scale = workspace.scale,
      x = rPos.x * scale,
      y = ePos.y * scale,
      xx = block.width + x, // Turns out they have their x & y stored locally, and they are the actual size rather than scaled or including children...
      yy = block.height + y,
      s = workspace.getMetrics();
    if (
      x < s.viewLeft + offsetX - 4 ||
      xx > s.viewLeft + s.viewWidth ||
      y < s.viewTop + offsetY - 4 ||
      yy > s.viewTop + s.viewHeight
    ) {
      let sx = x - s.contentLeft - offsetX,
        sy = y - s.contentTop - offsetY;

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

  const consoleWrapper = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_card", { others: "debug" }),
  });
  const consoleTitle = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons"),
  });
  const consoleText = Object.assign(document.createElement("h1"), {
    innerText: msg("console"),
  });
  const consoleList = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("sprite-info_sprite-info", { others: "logs" }),
  });
  const buttons = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons-right"),
  });
  const closeButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_remove-button"),
    draggable: false,
  });
  const closeImg = Object.assign(document.createElement("img"), {
    className: addon.tab.scratchClass("close-button_close-icon"),
    src: "/static/assets/cb666b99d3528f91b52f985dfb102afa.svg",
  });
  const closeText = Object.assign(document.createElement("span"), {
    innerText: msg("clear"),
  });
  const exportButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_shrink-expand-button"),
    draggable: false,
  });
  const exportImg = Object.assign(document.createElement("img"), {
    src: "/svgs/extensions/download-white.svg",
  });
  const exportText = Object.assign(document.createElement("span"), {
    innerText: msg("export"),
  });

  consoleTitle.append(consoleText, buttons);
  buttons.append(exportButton, closeButton);
  closeButton.append(closeImg, closeText);
  exportButton.append(exportImg, exportText);
  consoleWrapper.append(consoleTitle, consoleList);
  document.body.append(consoleWrapper);

  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  consoleTitle.addEventListener("mousedown", dragMouseDown);

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    // set the element's new position:
    consoleWrapper.style.top = `${consoleWrapper.offsetTop - pos2}px`;
    consoleWrapper.style.left = `${consoleWrapper.offsetLeft - pos1}px`;
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }

  closeButton.addEventListener("click", () => {
    document.querySelectorAll(".log").forEach((log, i) => log.remove());
    closeDragElement();
    logs = [];
  });
  closeButton.addEventListener("mouseup", () => {
    closeDragElement();
  });
  let download = (filename, text) => {
    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  exportButton.addEventListener("click", () => {
    closeDragElement();
    let file = logs.join("\n");
    download("logs.txt", file);
  });
  let logs = [];
  const addItem = (content, targetId, blockId, type) => {
    const wrapper = document.createElement("div");
    const span = (text, cl = "") => {
      let s = document.createElement("span");
      s.innerText = text;
      s.className = cl;
      return s;
    };
    const targetName = vm.runtime.targets.find((t) => t.id === targetId).getName();
    const scrolledDown = consoleList.scrollTop === consoleList.scrollHeight - consoleList.clientHeight;
    wrapper.classList = `log ${addon.tab.scratchClass("sprite-info_sprite-info")}`;
    if (type === "warn") wrapper.classList += " warn";
    if (type === "error") wrapper.classList += " error";
    consoleList.appendChild(wrapper);

    const block = workspace.getBlockById(blockId);
    const inputBlock = block.getChildren().find((b) => b.parentBlock_.id === blockId);
    console.log(inputBlock.type);
    if (inputBlock.type != "text") {
      if (inputBlock.inputList.filter((i) => i.name).length === 0) {
        const inputSpan = document.createElement("span");
        inputSpan.innerHTML = inputBlock.svgPath_.parentElement.querySelector("text").innerHTML;
        inputSpan.className = "console-variable";
        inputSpan.style.background = getComputedStyle(inputBlock.svgPath_).fill;
        wrapper.append(inputSpan);
      }
    }
    let string = addon.settings
      .get("exportFormat")
      .replace("${sprite}", targetName)
      .replace("${type}", type)
      .replace("${content}", content);
    logs.push(string);
    console.log(content);
    wrapper.append(span(content));

    let link = document.createElement("a");
    link.innerText = targetName;

    link.addEventListener("click", () => goToBlock(blockId));
    wrapper.appendChild(link);
    if (scrolledDown) consoleList.scrollTop = consoleList.scrollHeight - consoleList.clientHeight;
  };

  const toggleConsole = (show = !showingConsole) => {
    if (show) {
      consoleWrapper.style.display = "flex";
    } else {
      consoleWrapper.style.display = "";
    }
    showingConsole = show;
  };

  while (true) {
    const button = await addon.tab.waitForElement("[class^='stage-header_stage-size-row']", { markAsSeen: true });
    if (addon.tab.editorMode == "editor") {
      button.insertAdjacentElement("afterBegin", img);
    } else {
      toggleConsole(false);
    }
  }
}
