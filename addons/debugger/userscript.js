import downloadBlob from "../../libraries/common/cs/download-blob.js";
import { paused, setPaused, onPauseChanged } from "./../pause/module.js";

export default async function ({ addon, global, console, msg, safeMsg }) {
  let showingConsole, ScratchBlocks;
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
  addon.tab.addBlock("sa-pause", {
    args: [],
    callback: pause,
    hidden: true,
  });
  addon.tab.addBlock("\u200B\u200Bbreakpoint\u200B\u200B", {
    args: [],
    displayName: msg("block-breakpoint"),
    callback: pause,
  });
  addon.tab.addBlock("\u200B\u200Blog\u200B\u200B %s", {
    args: ["content"],
    displayName: msg("block-log"),
    callback: ({ content }, thread) => {
      addLog(content, thread, "log");
    },
  });
  addon.tab.addBlock("\u200B\u200Bwarn\u200B\u200B %s", {
    args: ["content"],
    displayName: msg("block-warn"),
    callback: ({ content }, thread) => {
      addLog(content, thread, "warn");
    },
  });
  addon.tab.addBlock("\u200B\u200Berror\u200B\u200B %s", {
    args: ["content"],
    displayName: msg("block-error"),
    callback: ({ content }, thread) => {
      addLog(content, thread, "error");
    },
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
    const workspace = Blockly.getMainWorkspace();

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

    // Don't scroll to blocks in the flyout
    if (block.workspace.isFlyout) return;

    // Make sure the code tab is active
    if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex !== 0) {
      addon.tab.redux.dispatch({
        type: "scratch-gui/navigation/ACTIVATE_TAB",
        activeTabIndex: 0,
      });
      setTimeout(() => goToBlock(targetId, blockId), 0);
      return;
    }

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

  consoleTitle.addEventListener("mousedown", dragMouseDown);

  let isScrolledToEnd = true;
  extraContainer.addEventListener(
    "wheel",
    (e) => {
      // When user scrolls up, stop automatically scrolling down
      if (e.deltaY < 0) {
        isScrolledToEnd = false;
      }
    },
    { passive: true }
  );
  extraContainer.addEventListener(
    "scroll",
    () => {
      isScrolledToEnd = extraContainer.scrollTop + 5 >= extraContainer.scrollHeight - extraContainer.clientHeight;
    },
    { passive: true }
  );

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

  let mouseOffsetX = 0;
  let mouseOffsetY = 0;
  let lastX = 0;
  let lastY = 0;

  function dragMouseDown(e) {
    e.preventDefault();
    mouseOffsetX = e.clientX - consoleWrapper.offsetLeft;
    mouseOffsetY = e.clientY - consoleWrapper.offsetTop;
    lastX = e.clientX;
    lastY = e.clientY;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("mousemove", elementDrag);
  }

  function dragConsole(x, y) {
    lastX = x;
    lastY = y;
    const width = (document.documentElement.clientWidth || document.body.clientWidth) - 1;
    const height = (document.documentElement.clientHeight || document.body.clientHeight) - 1;
    const clampedX = Math.max(0, Math.min(x - mouseOffsetX, width - consoleWrapper.offsetWidth));
    const clampedY = Math.max(0, Math.min(y - mouseOffsetY, height - consoleWrapper.offsetHeight));
    consoleWrapper.style.left = clampedX + "px";
    consoleWrapper.style.top = clampedY + "px";
  }

  function elementDrag(e) {
    e.preventDefault();
    dragConsole(e.clientX, e.clientY);
  }

  window.addEventListener("resize", () => {
    dragConsole(lastX, lastY);
  });

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }

  trashButton.addEventListener("click", () => {
    document.querySelectorAll(".log").forEach((log, i) => log.remove());
    closeDragElement();
    logs = [];
    isScrolledToEnd = true;
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
  let scrollQueued = false;
  const createLogWrapper = (type) => {
    const wrapper = document.createElement("div");
    wrapper.className = "log";
    wrapper.classList.add(type);
    return wrapper;
  };
  const createLogText = (text) => {
    const s = document.createElement("span");
    s.innerText = text;
    return s;
  };

  // Feedback
  if (localStorage.getItem("saDebuggerFeedbackRemove") !== "1") {
    const wrapper = createLogWrapper("log");
    const s = document.createElement("span");
    s.innerHTML = safeMsg("feedback-log", {
      logLink: Object.assign(document.createElement("a"), {
        href: "https://scratchaddons.com/feedback?version=1.18-debugger",
        className: "sa-debugger-feedback",
        target: "_blank",
        textContent: msg("feedback-log-link"),
      }).outerHTML,
    });
    s.appendChild(document.createElement("br"));
    s.appendChild(
      Object.assign(document.createElement("a"), {
        className: "sa-debugger-feedback",
        textContent: msg("feedback-remove"),
        onclick: () => {
          localStorage.setItem("saDebuggerFeedbackRemove", "1");
          wrapper.remove();
        },
      })
    );
    wrapper.appendChild(s);
    consoleList.append(wrapper);
  }

  const addLog = (content, thread, type) => {
    const wrapper = createLogWrapper(type);

    const target = thread.target;
    const parentTarget = target.isOriginal ? target : target.sprite.clones[0];
    const targetId = parentTarget.id;
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
    const block = target.blocks.getBlock(blockId);
    if (block && ScratchBlocks) {
      const inputId = Object.values(block.inputs)[0]?.block;
      const inputBlock = target.blocks.getBlock(inputId);
      if (inputBlock && inputBlock.opcode !== "text") {
        let text, category;
        if (
          inputBlock.opcode === "data_variable" ||
          inputBlock.opcode === "data_listcontents" ||
          inputBlock.opcode === "argument_reporter_string_number" ||
          inputBlock.opcode === "argument_reporter_boolean"
        ) {
          text = Object.values(inputBlock.fields)[0].value;
          if (inputBlock.opcode === "data_variable") {
            category = "data";
          } else if (inputBlock.opcode === "data_listcontents") {
            category = "list";
          } else {
            category = "more";
          }
        } else {
          // Try to call things like https://github.com/LLK/scratch-blocks/blob/develop/blocks_vertical/operators.js
          let jsonData;
          const fakeBlock = {
            jsonInit(data) {
              jsonData = data;
            },
          };
          const blockConstructor = ScratchBlocks.Blocks[inputBlock.opcode];
          if (blockConstructor) {
            try {
              blockConstructor.init.call(fakeBlock);
            } catch (e) {
              // ignore
            }
          }
          // If the block has a simple message with no arguments, display it
          if (jsonData && jsonData.message0 && !jsonData.args0) {
            text = jsonData.message0;
            category = jsonData.category;
          }
        }
        if (text && category) {
          const blocklyColor = ScratchBlocks.Colours[category === "list" ? "data_lists" : category];
          if (blocklyColor) {
            const inputSpan = document.createElement("span");
            inputSpan.textContent = text;
            inputSpan.className = "console-variable";
            const colorCategoryMap = {
              list: "data-lists",
              more: "custom",
            };
            inputSpan.dataset.category = colorCategoryMap[category] || category;
            inputSpan.style.backgroundColor = blocklyColor.primary;
            wrapper.append(inputSpan);
          }
        }
      }
    }
    logs.push({
      targetId,
      type,
      content,
    });
    wrapper.append(createLogText(content));

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

    if (!scrollQueued && isScrolledToEnd) {
      scrollQueued = true;
      queueMicrotask(scrollToEnd);
    }
    if (!showingConsole) {
      const unreadImage = addon.self.dir + "/debug-unread.svg";
      if (buttonImage.src !== unreadImage) buttonImage.src = unreadImage;
    }
  };
  const scrollToEnd = () => {
    scrollQueued = false;
    extraContainer.scrollTop = extraContainer.scrollHeight;
  };
  const toggleConsole = (show = !showingConsole) => {
    showingConsole = show;
    consoleWrapper.style.display = show ? "flex" : "";
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
      if (isScrolledToEnd) {
        scrollToEnd();
      }
    }
  };

  if (addon.tab.redux.state && addon.tab.redux.state.scratchGui.stageSize.stageSize === "small") {
    document.body.classList.add("sa-debugger-small");
  }
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("[class*='stage-header_stage-button-first']")) {
        document.body.classList.add("sa-debugger-small");
      } else if (e.target.closest("[class*='stage-header_stage-button-last']")) {
        document.body.classList.remove("sa-debugger-small");
      }
    },
    { capture: true }
  );

  while (true) {
    await addon.tab.waitForElement('[class*="stage-header_stage-size-row"]', {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "scratch-gui/mode/SET_FULL_SCREEN",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
      ],
    });
    if (addon.tab.editorMode === "editor") {
      ScratchBlocks = await addon.tab.traps.getBlockly();
      addon.tab.appendToSharedSpace({ space: "stageHeader", element: container, order: 0 });
    } else {
      toggleConsole(false);
    }
  }
}
