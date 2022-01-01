import downloadBlob from "../../libraries/common/cs/download-blob.js";
import { isPaused, setPaused, onPauseChanged, onSingleStepped, getRunningBlock, singleStep } from "./module.js";

export default async function ({ addon, global, console, msg }) {
  // TODO: move much later
  const debuggerButtonOuter = document.createElement("div");
  debuggerButtonOuter.className = "sa-debugger-container";
  const debuggerButton = document.createElement("div");
  debuggerButton.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const debuggerButtonContent = document.createElement("div");
  debuggerButtonContent.className = addon.tab.scratchClass("button_content");
  const debuggerButtonImage = document.createElement("img");
  debuggerButtonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  debuggerButtonImage.draggable = false;
  debuggerButtonImage.src = addon.self.dir + "/icons/debug.svg";
  debuggerButtonContent.appendChild(debuggerButtonImage);
  debuggerButton.appendChild(debuggerButtonContent);
  debuggerButtonOuter.appendChild(debuggerButton);
  debuggerButton.addEventListener("click", () => toggleInterface(true));

  let hasLoggedPauseError = false;
  const pause = (_, thread) => {
    if (addon.tab.redux.state.scratchGui.mode.isPlayerOnly) {
      if (!hasLoggedPauseError) {
        addLog(msg("cannot-pause-player"), thread, "error");
        hasLoggedPauseError = true;
      }
      return;
    }
    setPaused(!isPaused());
    const pauseAddonButton = document.querySelector(".pause-btn");
    if (!pauseAddonButton || getComputedStyle(pauseAddonButton).display === "none") toggleInterface(true);
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

  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });

  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/chart.min.js");
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/chartjs-plugin-annotation.min.js");

  const toggleInterface = (show) => {
    interfaceContainer.style.display = show ? "flex" : "";
    if (show) {
      debuggerButtonImage.src = addon.self.dir + "/icons/debug.svg";
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
  const interfaceContainer = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_card", { others: "debug" }),
  });
  const interfaceHeader = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons"),
  });
  const tabListElement = Object.assign(document.createElement("ul"), {
    className: addon.tab.scratchClass("react-tabs_react-tabs__tab-list", "gui_tab-list") + " debugger-tabs",
  });
  const buttonContainerElement = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons-right"),
  });
  const tabContentContainer = Object.assign(document.createElement("div"), {
    className: 'extra-log-container',
  });
  interfaceHeader.append(tabListElement, buttonContainerElement);
  interfaceContainer.append(interfaceHeader, tabContentContainer);
  document.body.append(interfaceContainer);

  // TODO Move this into an API?
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

  tabContentContainer.addEventListener("click", (e) => {
    const elem = e.target;
    if (elem.classList.contains("deletedTarget")) return;
    const targetId = elem.dataset.targetId;
    const blockId = elem.dataset.blockId;
    if (targetId && blockId) goToBlock(targetId, blockId);
  });

  const makeHeaderButton = ({text, icon, description}) => {
    const button = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("card_shrink-expand-button"),
      draggable: false,
    });
    if (description) {
      button.title = description;
    }
    const imageElement = Object.assign(document.createElement("img"), {
      src: icon
    });
    const textElement = Object.assign(document.createElement("span"), {
      textContent: text
    });
    button.appendChild(imageElement);
    button.appendChild(textElement);
    return {
      button,
      image: imageElement,
      text: textElement
    };
  };

  const makeHeaderTab = ({text, icon}) => {
    const tab = Object.assign(document.createElement("li"), {
      className: addon.tab.scratchClass("react-tabs_react-tabs__tab", "gui_tab"),
    });
    const imageElement = Object.assign(document.createElement("img"), {
      src: icon
    });
    const textElement = Object.assign(document.createElement("span"), {
      textContent: text
    });
    tab.appendChild(imageElement);
    tab.appendChild(textElement);
    return {
      tab,
      image: imageElement,
      text: textElement
    };
  };

  const unpauseButton = makeHeaderButton({
    text: msg('unpause'),
    icon: addon.self.dir + "/icons/play.svg"
  });
  unpauseButton.button.classList.add('sa-debugger-unpause');
  unpauseButton.button.addEventListener("click", () => setPaused(false));

  const closeButton = makeHeaderButton({
    text: msg('close'),
    icon: addon.self.dir + "/icons/add.svg"
  });
  closeButton.image.classList.add(addon.tab.scratchClass("close-button_close-icon"));
  closeButton.button.addEventListener("click", () => toggleInterface(false));

  // ##### Logs Tab ##### //

  const logsTabElement = makeHeaderTab({
    text: msg('tab-logs'),
    icon: addon.self.dir + "/icons/logs.svg"
  });

  const logsList = Object.assign(document.createElement("div"), {
    className: "logs",
  });

  const exportButton = makeHeaderButton({
    text: msg('export'),
    icon: addon.self.dir + "/icons/download-white.svg",
    description: msg('export-desc')
  });
  const downloadTextAs = (filename, text) => downloadBlob(filename, new Blob([text], { type: "text/plain" }));
  exportButton.button.addEventListener("click", (e) => {
    const defaultFormat = "{sprite}: {content} ({type})";
    const exportFormat = e.shiftKey ? prompt(msg("enter-format"), defaultFormat) : defaultFormat;
    if (!exportFormat) return;
    closeDragElement();
    const targetInfoCache = Object.create(null);
    // TODO refactor
    let file = logs
      .map(({ targetId, type, content, count }) =>
        (exportFormat.replace(
          /\{(sprite|type|content)\}/g,
          (_, match) =>
          ({
            sprite: getTargetInfo(targetId, targetInfoCache).name,
            type,
            content,
          }[match])
        ) + "\n").repeat(count)
      ).join("");
    downloadTextAs("logs.txt", file);
  });

  const trashButton = makeHeaderButton({
    text: msg('clear'),
    icon: addon.self.dir + "/icons/delete.svg"
  });
  trashButton.button.addEventListener("click", () => {
    clearLogs();
    closeDragElement();
  });

  // ##### Threads Tab ##### //

  const threadsTabElement = makeHeaderTab({
    text: msg("tab-threads"),
    icon: addon.self.dir + "/icons/threads.svg"
  });

  const threadsList = Object.assign(document.createElement("div"), {
    className: "logs",
  });

  function threadsRefresh(scrollToRunning = false) {
    threadsList.innerHTML = "";
    if (isPaused()) {
      var addedThreads = [];
      const runningBlockId = getRunningBlock();
      var runningBlockElement;

      function createThreadElement(thread, idx, iconUrl) {
        const element = document.createElement("div");
        const subelements = Object.assign(document.createElement("div"), {
          className: "subthread",
        });

        const threadInfo = Object.assign(document.createElement("div"), {
          className: "log",
        });
        if (iconUrl) {
          const icon = document.createElement("img");
          icon.src = addon.self.dir + iconUrl;
          icon.className = "logIcon";
          threadInfo.append(icon);
        }
        const threadTitle = document.createElement("span");
        threadTitle.append(Object.assign(document.createElement("b"), { innerText: thread.target.getName() }));
        threadTitle.append(
          Object.assign(document.createElement("span"), { innerText: " " + msg("thread", { threadNum: idx }) })
        );
        threadInfo.append(threadTitle);
        element.append(threadInfo);

        function createThreadBlockElement(blockId, stackFrame, iconUrl) {
          const block = thread.target.blocks.getBlock(blockId);

          var name, colour;
          if (block)
            if (block.opcode == "procedures_call") {
              colour = ScratchBlocks.Colours.more.primary;
              if (block.mutation) {
                name = block.mutation.proccode.replaceAll("%s", "()").replaceAll("%b", "()");
                const customBlock = addon.tab.getCustomBlock(block.mutation.proccode);
                if (customBlock) {
                  colour = customBlock.color;
                }
              }
            } else {
              // This quickly creates a Blockly block so we can get its name, than removes it again.
              const workspace = Blockly.getMainWorkspace();

              ScratchBlocks.Events.disabled_ = 1; // We disable events to the block isn't added to the DOM

              // https://github.com/LLK/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/core/block.js#L52
              var blocklyBlock = new ScratchBlocks.Block(workspace, block.opcode, "debugger-temp");

              name = blocklyBlock.toLocaleString().replaceAll("?", "()");

              var category = blocklyBlock.getCategory();
              if (category == "data-lists") category = "data_lists";
              if (category == "events") category = "event"; // ST why?
              if (category) {
                colour = ScratchBlocks.Colours[category];
                if (!colour) {
                  colour = ScratchBlocks.Colours.pen;
                }
              } else {
                colour = { primary: "#979797" }
              }
              if (colour) colour = colour.primary;

              // Calling `new Block` above adds it to two lists in the workspace.
              // So we remove it from them again.
              delete workspace.blockDB_["debugger-temp"];
              workspace.topBlocks_.pop();

              ScratchBlocks.Events.disabled_ = 0; // Re-enable events
            }

          if (!name) {
            name = "?";
          }

          const blockContainer = document.createElement("div");
          const blockDiv = Object.assign(document.createElement("div"), {
            className: "log",
          });

          const blockTitle = Object.assign(document.createElement("span"), {
            innerText: name,
          });

          if (colour) {
            blockTitle.style.backgroundColor = colour;
            blockDiv.className += " block-log";
            blockTitle.className = "console-block";
          }

          if (runningBlockId && runningBlockId === blockId) {
            blockDiv.className += " block-log-running";
            runningBlockElement = blockContainer;
          }

          if (iconUrl) {
            const icon = document.createElement("img");
            icon.src = addon.self.dir + iconUrl;
            icon.className = "logIcon";
            blockContainer.append(icon);
          }
          const blockLink = document.createElement("a");
          blockLink.textContent = thread.target.isOriginal
            ? thread.target.getName()
            : msg("clone-of", {
              spriteName: thread.target.getName(),
            });
          blockLink.className = "logLink";
          blockLink.dataset.blockId = blockId;
          blockLink.dataset.targetId = thread.target.id;
          if (!thread.target.isOriginal) {
            blockLink.dataset.isClone = "true";
          }
          blockDiv.append(blockTitle, blockLink);
          blockContainer.append(blockDiv);

          if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.startedThreads) {
            for (const thread of stackFrame.executionContext.startedThreads) {
              addedThreads.push(thread);
              blockContainer.append(
                createThreadElement(
                  thread,
                  idx + "." + (stackFrame.executionContext.startedThreads.indexOf(thread) + 1),
                  "/icons/subthread.svg"
                )
              );
            }
          }
          return blockContainer;
        }

        subelements.append(createThreadBlockElement(thread.topBlock));
        for (var i = 0; i < thread.stack.length; i++) {
          if (!(thread.stack[i] == thread.topBlock && i == 0))
            subelements.append(createThreadBlockElement(thread.stack[i], thread.stackFrames[i]));
        }

        element.append(subelements);

        return element;
      }

      for (const thread of vm.runtime.threads) {
        // thread.updateMonitor is for threads that update monitors. We don't want to show these.
        // https://github.com/LLK/scratch-vm/blob/b3afd407f12630b1d27c4edadfa5ec4b5e1c820d/src/engine/runtime.js#L1717
        if (!thread.updateMonitor && !addedThreads.includes(thread)) {
          addedThreads.push(thread);
          threadsList.append(createThreadElement(thread, vm.runtime.threads.indexOf(thread) + 1));
        }
      }

      if (runningBlockElement && scrollToRunning) {
        runningBlockElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      if (vm.runtime.threads.length === 0) {
        threadsList.append(Object.assign(document.createElement("span"), {
          className: "thread-info",
          innerText: msg("threads-none-running"),
        }));
      }
    } else {
      threadsList.append(Object.assign(document.createElement("span"), {
        className: "thread-info",
        innerText: msg("threads-pause"),
      }));
    }
  }

  const stepButton = makeHeaderButton({
    text: msg("step"),
    icon: addon.self.dir + "/icons/step.svg",
    description: msg("step-desc")
  });
  stepButton.button.addEventListener("click", () => {
    singleStep();
    threadsRefresh();
  });
  threadsRefresh();

  // ##### Performance Tab ##### //

  const performanceTabElement = makeHeaderTab({
    text: msg('tab-performance'),
    icon: addon.self.dir + "/icons/performance.svg"
  });

  const performancePanel = document.createElement("div");
  const performanceFpsTitle = Object.assign(document.createElement("h1"), { innerText: msg("performance-framerate-title") });
  const performanceFpsChartCanvas = Object.assign(document.createElement("canvas"), {
    id: "debug-fps-chart",
    className: "logs",
  });
  const performanceCharNumPoints = 20;
  function getMaxFps() {
    return Math.round(1000 / vm.runtime.currentStepTime);
  }
  const performanceFpsChart = new Chart(performanceFpsChartCanvas.getContext("2d"), {
    type: "line",
    data: {
      // An array like [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      labels: Array.from(Array(performanceCharNumPoints).keys()).reverse(),
      datasets: [
        {
          data: Array(performanceCharNumPoints).fill(-1),
          borderWidth: 1,
          fill: true,
          backgroundColor: "hsla(163, 85%, 40%, 0.5)",
        },
      ],
    },
    options: {
      scales: {
        y: {
          max: getMaxFps(),
          min: 0,
        },
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (context) => msg("performance-framerate-graph-tooltip", { fps: context.parsed.y }),
          },
        },
      },
    },
  });
  const performanceClonesTitle = Object.assign(document.createElement("h1"), { innerText: msg("performance-clonecount-title") });
  const performanceClonesChartCanvas = Object.assign(document.createElement("canvas"), {
    id: "debug-fps-chart",
    className: "logs",
  });
  const performanceClonesChart = new Chart(performanceClonesChartCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels: Array.from(Array(performanceCharNumPoints).keys()).reverse(),
      datasets: [
        {
          data: Array(performanceCharNumPoints).fill(-1),
          borderWidth: 1,
          fill: true,
          backgroundColor: "hsla(163, 85%, 40%, 0.5)",
        },
      ],
    },
    options: {
      scales: {
        y: {
          max: 300,
          min: 0,
        },
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          callbacks: {
            label: (context) => msg("performance-clonecount-graph-tooltip", { clones: context.parsed.y }),
          },
        },
      },
    },
  });

  // Holds the times of each frame drawn in the last second.
  // The length of this list is effectively the FPS.
  const renderTimes = [];
  // The last time we pushed a new datapoint to the graph
  var lastFpsTime = Date.now() + 3000;

  const ogDraw = vm.runtime.renderer.draw;
  vm.runtime.renderer.draw = function (...args) {
    if (!isPaused()) {
      const now = Date.now();
      const maxFps = getMaxFps();
      // Remove all frame times older than 1 second in renderTimes
      while (renderTimes.length > 0 && renderTimes[0] <= now - 1000) renderTimes.shift();
      renderTimes.push(now);

      if (now - lastFpsTime > 1000) {
        lastFpsTime = now;

        // Update the graphs

        const fpsData = performanceFpsChart.data.datasets[0].data;
        fpsData.shift();
        fpsData.push(Math.min(renderTimes.length, maxFps));
        // Incase we switch between 30FPS and 60FPS, update the max height of the chart.
        performanceFpsChart.options.scales.y.max = maxFps;
        performanceFpsChart.update();

        const clonesData = performanceClonesChart.data.datasets[0].data;
        clonesData.shift();
        clonesData.push(vm.runtime._cloneCounter);
        performanceClonesChart.update();
      }
    }

    ogDraw.call(this, ...args)
  };

  performancePanel.append(performanceFpsTitle, performanceFpsChartCanvas, performanceClonesTitle, performanceClonesChartCanvas);

  const logsTab = {
    tab: logsTabElement,
    buttons: [unpauseButton, exportButton, trashButton, closeButton],
    content: logsList
  };
  const threadsTab = {
    tab: threadsTabElement,
    buttons: [unpauseButton, stepButton, closeButton],
    content: threadsList
  };
  const performanceTab = {
    tab: performanceTabElement,
    buttons: [unpauseButton, closeButton],
    content: performancePanel
  };
  const allTabs = [
    logsTab,
    threadsTab,
    performanceTab
  ];

  const removeAllChildren = (element) => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  };

  let activeTab;
  const setActiveTab = (tab) => {
    if (tab === activeTab) return;
    if (activeTab) {
      activeTab.tab.tab.classList.remove(addon.tab.scratchClass('gui_is-selected'));
    }
    tab.tab.tab.classList.add(addon.tab.scratchClass('gui_is-selected'));
    activeTab = tab;

    removeAllChildren(tabContentContainer);
    tabContentContainer.appendChild(tab.content);

    removeAllChildren(buttonContainerElement);
    for (const button of tab.buttons) {
      buttonContainerElement.appendChild(button.button);
    }
  };

  for (const tab of allTabs) {
    tab.tab.tab.addEventListener('click', () => {
      setActiveTab(tab);
    });
    tabListElement.appendChild(tab.tab.tab);
  }
  setActiveTab(logsTab);

  interfaceHeader.addEventListener("mousedown", dragMouseDown);

  let isScrolledToEnd = true;
  tabContentContainer.addEventListener(
    "wheel",
    (e) => {
      // When user scrolls up, stop automatically scrolling down
      if (e.deltaY < 0) {
        isScrolledToEnd = false;
      }
    },
    { passive: true }
  );
  tabContentContainer.addEventListener(
    "scroll",
    () => {
      isScrolledToEnd = tabContentContainer.scrollTop + 5 >= tabContentContainer.scrollHeight - tabContentContainer.clientHeight;
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
      item = { name: msg("unknown-sprite"), isDeleted: true };
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
    mouseOffsetX = e.clientX - interfaceContainer.offsetLeft;
    mouseOffsetY = e.clientY - interfaceContainer.offsetTop;
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
    const clampedX = Math.max(0, Math.min(x - mouseOffsetX, width - interfaceContainer.offsetWidth));
    const clampedY = Math.max(0, Math.min(y - mouseOffsetY, height - interfaceContainer.offsetHeight));
    interfaceContainer.style.left = clampedX + "px";
    interfaceContainer.style.top = clampedY + "px";
  }

  function elementDrag(e) {
    e.preventDefault();
    dragConsole(e.clientX, e.clientY);
  }

  window.addEventListener("resize", () => {
    dragConsole(lastX, lastY);
  });

  function closeDragElement() {
    // stop moving when mouse button is released
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDrag);
  }

  if (!isPaused()) {
    unpauseButton.button.style.display = "none";
    stepButton.button.style.display = "none";
  }
  onPauseChanged((newPauseValue) => {
    if (newPauseValue) {
      unpauseButton.button.style.display = "";
      stepButton.button.style.display = "";
      pauseTime = Date.now();
    } else {
      unpauseButton.button.style.display = "none";
      stepButton.button.style.display = "none";

      const dt = Date.now() - pauseTime;
      lastFpsTime += dt;
      for (var i = 0; i < renderTimes.length; i++)
        renderTimes[i] += dt;
    }
    threadsRefresh();
  });

  onSingleStepped((sequencer) => {
    threadsRefresh(true);
  });

  let showingConsole = false;
  let logs = [];
  let scrollQueued = false;

  const createLogWrapper = (type) => {
    const wrapper = document.createElement("div");
    wrapper.className = "log";
    wrapper.classList.add(type);
    return wrapper;
  };

  const createLogText = (text, count) => {
    const s = document.createElement("span");
    s.innerText = text;
    if (count !== 1) {
      const c = document.createElement("span");
      c.innerText = count;
      c.className = "log-count";
      s.appendChild(c);
    }
    return s;
  };

  // TODO this is way too low???
  const MAX_LOGS = 10;
  const addLog = (content, thread, type, internalLog = false) => {
    const wrapper = createLogWrapper(type);

    if (internalLog) {
      wrapper.className += " internal-log";
    }

    if (logs.length >= MAX_LOGS) {
      logs.shift(1);
      logsList.children[0].remove();
    }

    logsList.append(wrapper);
    if (type !== "log") {
      const imageURL = addon.self.dir + (type === "error" ? "/icons/error.svg" : "/icons/warning.svg");
      const icon = document.createElement("img");
      icon.src = imageURL;
      icon.alt = icon.title = msg("icon-" + type);
      icon.className = "logIcon";
      wrapper.appendChild(icon);
    }

    var targetId;

    if (thread) {
      const target = thread.target;
      const blockId = thread.peekStack();
      const parentTarget = target.isOriginal ? target : target.sprite.clones[0];
      targetId = parentTarget.id;
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
    }

    var count = 1;

    const lastLog = logs[logs.length - 1];
    if (lastLog) {
      if (lastLog.targetId === targetId && lastLog.type === type && lastLog.content === content) {
        logs.pop();
        logsList.children[logsList.children.length - 2].remove();
        count += lastLog.count;
        console.log("Compressing messages! " + count);
      }
    }

    logs.push({
      targetId,
      type,
      content,
      count
    });
    wrapper.append(createLogText(content, count));

    if (thread) {
      const target = thread.target;
      const parentTarget = target.isOriginal ? target : target.sprite.clones[0];
      const blockId = thread.peekStack();
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
    }

    if (!scrollQueued && isScrolledToEnd) {
      scrollQueued = true;
      queueMicrotask(scrollToEnd);
    }
    if (!showingConsole) {
      const unreadImage = addon.self.dir + "/icons/debug-unread.svg";
      if (debuggerButton.src !== unreadImage) debuggerButton.src = unreadImage;
    }
  };

  const clearLogs = () => {
    document.querySelectorAll(".log").forEach((log, i) => log.remove());
    logs = [];
    isScrolledToEnd = true;
  };

  const scrollToEnd = () => {
    scrollQueued = false;
    tabContentContainer.scrollTop = tabContentContainer.scrollHeight;
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

  // Events that we could need to log

  const ogGreenFlag = vm.runtime.greenFlag;
  vm.runtime.greenFlag = function (...args) {
    if (addon.settings.get("log_clear_greenflag")) {
      clearLogs();
    }
    if (addon.settings.get("log_greenflag")) {
      addLog(msg("log-msg-flag-clicked"), null, "log", true);
    }
    return ogGreenFlag.call(this, ...args);
  };

  const ogMakeClone = vm.runtime.targets[0].constructor.prototype.makeClone;
  vm.runtime.targets[0].constructor.prototype.makeClone = function (...args) {
    if (addon.settings.get("log_failed_clone_creation") && !vm.runtime.clonesAvailable()) {
      addLog(msg("log-msg-clone-cap", { sprite: this.getName() }), vm.runtime.sequencer.activeThread, "warn", true);
    }
    var clone = ogMakeClone.call(this, ...args);
    if (addon.settings.get("log_clone_create") && clone) {
      addLog(msg("log-msg-clone-created", { sprite: this.getName() }), vm.runtime.sequencer.activeThread, "log", true);
    }
    return clone;
  }

  const ogStartHats = vm.runtime.startHats;
  vm.runtime.startHats = function (hat, optMatchFields, ...args) {
    if (addon.settings.get("log_broadcasts") && hat === "event_whenbroadcastreceived") {
      addLog(msg("log-msg-broadcasted", { broadcast: optMatchFields.BROADCAST_OPTION }), vm.runtime.sequencer.activeThread, "log", true);
    }
    return ogStartHats.call(this, hat, optMatchFields, ...args);
  }

  const ogAddToList = vm.runtime._primitives.data_addtolist;
  vm.runtime._primitives.data_addtolist = function (args, util) {
    if (addon.settings.get("log_max_list_length")) {
      const list = util.target.lookupOrCreateList(
        args.LIST.id, args.LIST.name);
      if (list.value.length >= 200000) {
        addLog(msg("log-msg-list-append-too-long", { list: list.name }), util.thread, "warn", true);
      }
    }
    ogAddToList.call(this, args, util);
  }

  const ogInertAtList = vm.runtime._primitives.data_insertatlist;
  vm.runtime._primitives.data_insertatlist = function (args, util) {
    if (addon.settings.get("log_max_list_length")) {
      const list = util.target.lookupOrCreateList(
        args.LIST.id, args.LIST.name);
      if (list.value.length >= 200000) {
        addLog(msg("log-msg-list-insert-too-long", { list: list.name }), util.thread, "warn", true);
      }
    }
    ogInertAtList.call(this, args, util);
  }

  const ogSetVariableTo = vm.runtime._primitives.data_setvariableto;
  vm.runtime._primitives.data_setvariableto = function (args, util) {
    if (addon.settings.get("log_invalid_cloud_data")) {
      const variable = util.target.lookupOrCreateVariable(
        args.VARIABLE.id, args.VARIABLE.name);
      if (variable.isCloud) {
        const value = args.VALUE.toString();
        if (isNaN(value)) {
          addLog(msg("log-cloud-data-nan", { var: variable.name }), util.thread, "warn", true);
        } else if (value.length > 256) {
          addLog(msg("log-cloud-data-too-long", { var: variable.name }), util.thread, "warn", true);
        }
      }
    }
    ogSetVariableTo.call(this, args, util);
  }

  ////////////

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
      addon.tab.appendToSharedSpace({ space: "stageHeader", element: debuggerButtonOuter, order: 0 });
    } else {
      toggleInterface(false);
    }
  }
}
