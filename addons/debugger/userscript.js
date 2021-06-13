import downloadBlob from "../../libraries/common/cs/download-blob.js";
import { paused, setPaused, onPauseChanged } from "./../pause/module.js";

export default async function ({ addon, global, console, msg }) {
  let workspace, showingConsole;
  const vm = addon.tab.traps.vm;

  const container = document.createElement("div");
  container.className = "sa-debugger-container";
  const buttonContainer = document.createElement("div");
  buttonContainer.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const buttonContent = document.createElement("div");
  buttonContent.className = addon.tab.scratchClass("button_content");
  const buttonImage = document.createElement("img");
  buttonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  buttonImage.draggable = false;
  buttonImage.src = addon.self.dir + "/debug.svg";
  buttonContent.appendChild(buttonImage);
  buttonContainer.appendChild(buttonContent);
  container.appendChild(buttonContainer);
  buttonContainer.addEventListener("click", () => toggleConsole(true));

  const pause = () => {
    setPaused(!paused);
    const pauseAddonButton = document.querySelector(".pause-btn");
    if (!pauseAddonButton || getComputedStyle(pauseAddonButton).display === "none") toggleConsole(true);
  };
  addon.tab.addBlock("sa-pause", [], pause, true);
  addon.tab.addBlock("\u200B\u200Bbreakpoint\u200B\u200B", [], pause);
  addon.tab.addBlock("\u200B\u200Blog\u200B\u200B %s", ["content"], ({ content }, thread) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, thread, "log");
  });
  addon.tab.addBlock("\u200B\u200Bwarn\u200B\u200B %s", ["content"], ({ content }, thread) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, thread, "warn");
  });
  addon.tab.addBlock("\u200B\u200Berror\u200B\u200B %s", ["content"], ({ content }, thread) => {
    workspace = Blockly.getMainWorkspace();
    addItem(content, thread, "error");
  });

  const consoleWrapper = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_card", { others: "debug" }),
  });
  const consoleTitle = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons"),
  });
  const consoleText = Object.assign(document.createElement("h1"), {
    innerText: msg("console"),
  });
  const extraContainer = Object.assign(document.createElement("div"), {
    className: `extra-log-container`,
  });

  const goToBlock = (targetId, blockId) => {
    const offsetX = 32,
      offsetY = 32;
    if (targetId !== vm.editingTarget.id) {
      // note: this is O(n) so don't call it if unnecessary!
      if (vm.runtime.getTargetById(targetId)) {
        vm.setEditingTarget(targetId);
        // Should not cause recursion
        setTimeout(() => goToBlock(targetId, blockId), 300);
      }
      return;
    }
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
      if (!myFlash.block.svgPath_) {
        myFlash.timerID = count = 0;
        flashOn = true;
        return;
      }
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
  extraContainer.addEventListener("click", (e) => {
    const elem = e.target;
    if (elem.classList.contains("deletedTarget")) return;
    const targetId = elem.dataset.targetId;
    const blockId = elem.dataset.blockId;
    if (targetId && blockId) goToBlock(targetId, blockId);
  });
  const consoleList = Object.assign(document.createElement("div"), {
    className: "logs",
  });
  const buttons = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons-right"),
  });

  const unpauseButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_shrink-expand-button", { others: "sa-debugger-unpause" }),
    draggable: false,
  });
  const unpauseImg = Object.assign(document.createElement("img"), {
    src: addon.self.dir + "/play.svg",
  });
  const unpauseText = Object.assign(document.createElement("span"), {
    innerText: msg("unpause"),
  });

  const exportButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_shrink-expand-button"),
    title: msg("export-desc"),
    draggable: false,
  });
  const exportImg = Object.assign(document.createElement("img"), {
    src: addon.self.dir + "/download-white.svg",
  });
  const exportText = Object.assign(document.createElement("span"), {
    innerText: msg("export"),
  });

  const trashButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_shrink-expand-button"),
    draggable: false,
  });
  const trashImg = Object.assign(document.createElement("img"), {
    src: addon.self.dir + "/delete.svg",
  });
  const trashText = Object.assign(document.createElement("span"), {
    innerText: msg("clear"),
  });

  const closeButton = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_remove-button"),
    draggable: false,
  });
  const closeImg = Object.assign(document.createElement("img"), {
    className: addon.tab.scratchClass("close-button_close-icon"),
    src: addon.self.dir + "/add.svg",
  });
  const closeText = Object.assign(document.createElement("span"), {
    innerText: msg("close"),
  });

  consoleTitle.append(consoleText, buttons);
  buttons.append(unpauseButton, exportButton, trashButton, closeButton);
  trashButton.append(trashImg, trashText);
  closeButton.append(closeImg, closeText);
  exportButton.append(exportImg, exportText);
  unpauseButton.append(unpauseImg, unpauseText);
  extraContainer.append(consoleList);
  consoleWrapper.append(consoleTitle, extraContainer);
  document.body.append(consoleWrapper);

  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0,
    maxX,
    maxY;
  consoleTitle.addEventListener("mousedown", dragMouseDown);

  const getTargetInfo = (id, cache = null) => {
    if (cache && cache[id]) return cache[id];
    const target = vm.runtime.getTargetById(id);
    let item;
    if (target) {
      item = { name: target.getName(), isDeleted: false };
    } else {
      item = { name: msg("deleted-sprite"), isDeleted: true };
    }
    if (cache) cache[id] = item;
    return item;
  };

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    var winW = document.documentElement.clientWidth || document.body.clientWidth,
      winH = document.documentElement.clientHeight || document.body.clientHeight;
    (maxX = winW - consoleWrapper.offsetWidth - 1), (maxY = winH - consoleWrapper.offsetHeight - 1);
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    if (consoleWrapper.offsetTop - pos2 <= maxY && consoleWrapper.offsetTop - pos2 >= 0) {
      consoleWrapper.style.top = consoleWrapper.offsetTop - pos2 + "px";
    }
    if (consoleWrapper.offsetLeft - pos1 <= maxX && consoleWrapper.offsetLeft - pos1 >= 0) {
      consoleWrapper.style.left = consoleWrapper.offsetLeft - pos1 + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }

  trashButton.addEventListener("click", () => {
    document.querySelectorAll(".log").forEach((log, i) => log.remove());
    closeDragElement();
    logs = [];
  });
  trashButton.addEventListener("mouseup", () => {
    closeDragElement();
  });
  closeButton.addEventListener("click", () => toggleConsole(false));
  closeButton.addEventListener("mouseup", () => closeDragElement());
  let download = (filename, text) => downloadBlob(filename, new Blob([text], { type: "text/plain" }));

  unpauseButton.addEventListener("click", () => setPaused(false));
  if (!paused) unpauseButton.style.display = "none";
  onPauseChanged((newPauseValue) => (unpauseButton.style.display = newPauseValue ? "" : "none"));

  exportButton.addEventListener("click", (e) => {
    const defaultFormat = "{sprite}: {content} ({type})";
    const exportFormat = e.shiftKey ? prompt(msg("enter-format"), defaultFormat) : defaultFormat;
    if (!exportFormat) return;
    closeDragElement();
    const targetInfoCache = Object.create(null);
    let file = logs
      .map(({ targetId, type, content }) =>
        exportFormat.replace(
          /\{(sprite|type|content)\}/g,
          (_, match) =>
            ({
              sprite: getTargetInfo(targetId, targetInfoCache).name,
              type,
              content,
            }[match])
        )
      )
      .join("\n");
    download("logs.txt", file);
  });
  let logs = [];
  const addItem = (content, thread, type) => {
    workspace = Blockly.getMainWorkspace();
    const wrapper = document.createElement("div");
    const span = (text, cl = "") => {
      let s = document.createElement("span");
      s.innerText = text;
      s.className = cl;
      return s;
    };

    const scrolledDown = extraContainer.scrollTop + 5 > extraContainer.scrollHeight - extraContainer.clientHeight;

    const target = thread.target;
    const parentTarget = target.isOriginal ? target : target.sprite.clones[0];
    const targetId = parentTarget.id;
    wrapper.className = "log";
    wrapper.classList.add(type);
    consoleList.append(wrapper);
    if (type !== "log") {
      const imageURL = addon.self.dir + (type === "error" ? "/error.svg" : "/warning.svg");
      const icon = document.createElement("img");
      icon.src = imageURL;
      icon.alt = icon.title = msg("icon-" + type);
      icon.className = "logIcon";
      wrapper.appendChild(icon);
    }

    const blockId = thread.peekStack();
    const block = workspace.getBlockById(blockId);
    const inputBlock = block.getChildren().find((b) => b.parentBlock_.id === blockId);
    if (inputBlock.type !== "text") {
      if (inputBlock.inputList.filter((i) => i.name).length === 0) {
        const inputSpan = document.createElement("span");
        const svgPathStyle = getComputedStyle(inputBlock.svgPath_);
        const inputBlockFill = svgPathStyle.fill;
        const inputBlockStroke = svgPathStyle.stroke;
        // for compatibility with custom block colors
        const inputBlockColor =
          inputBlockFill === "rgb(40, 40, 40)" || inputBlockFill === "rgb(255, 255, 255)"
            ? inputBlockStroke
            : inputBlockFill;
        inputSpan.innerText = inputBlock.toString();
        inputSpan.className = "console-variable";
        inputSpan.style.background = inputBlockColor;
        wrapper.append(inputSpan);
      }
    }
    logs.push({
      targetId,
      type,
      content,
    });
    wrapper.append(span(content));

    let link = document.createElement("a");
    link.textContent = target.isOriginal
      ? target.getName()
      : msg("clone-of", {
          spriteName: parentTarget.getName(),
        });
    link.className = "logLink";
    link.dataset.blockId = blockId;
    link.dataset.targetId = targetId;
    if (!target.isOriginal) {
      link.dataset.isClone = "true";
    }

    wrapper.appendChild(link);

    if (scrolledDown) extraContainer.scrollTop = extraContainer.scrollHeight;
    if (!showingConsole) buttonImage.src = addon.self.dir + "/debug-unread.svg";
  };
  const toggleConsole = (show = !showingConsole) => {
    if (show) {
      buttonImage.src = addon.self.dir + "/debug.svg";
      const cacheObj = Object.create(null);
      for (const logLinkElem of document.getElementsByClassName("logLink")) {
        const targetId = logLinkElem.dataset.targetId;
        if (!targetId) return;
        const tInfo = getTargetInfo(targetId, cacheObj);
        logLinkElem.textContent = tInfo.name;
        if (tInfo.isDeleted) {
          logLinkElem.classList.add("deletedTarget");
        } else if (logLinkElem.dataset.isClone) {
          logLinkElem.textContent = msg("clone-of", { spriteName: tInfo.name });
        }
      }
    }
    consoleWrapper.style.display = show ? "flex" : "";
    showingConsole = show;
  };

  while (true) {
    const stageHeaderSizeControls = await addon.tab.waitForElement('[class*="stage-header_stage-size-row"]', {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    if (addon.tab.editorMode === "editor") {
      stageHeaderSizeControls.insertBefore(container, stageHeaderSizeControls.firstChild);
    } else {
      toggleConsole(false);
    }
  }
}
