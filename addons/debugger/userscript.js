import { isPaused, setPaused, onPauseChanged, setup } from "./module.js";
import createLogsTab from "./logs.js";
import createThreadsTab from "./threads.js";
import createPerformanceTab from "./performance.js";
import DevtoolsUtils from "../editor-devtools/blockly/Utils.js";

const removeAllChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export default async function ({ addon, global, console, msg }) {
  setup(addon.tab.traps.vm);

  let logsTab;
  const messagesLoggedBeforeLogsTabLoaded = [];
  const logMessage = (...args) => {
    if (logsTab) {
      logsTab.addLog(...args);
    } else {
      messagesLoggedBeforeLogsTabLoaded.push(args);
    }
  };

  let hasLoggedPauseError = false;
  const pause = (_, thread) => {
    if (addon.tab.redux.state.scratchGui.mode.isPlayerOnly) {
      if (!hasLoggedPauseError) {
        logMessage(msg("cannot-pause-player"), thread, "error");
        hasLoggedPauseError = true;
      }
      return;
    }
    setPaused(true);
    setInterfaceVisible(true);
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
      logMessage(content, thread, "log");
    },
  });
  addon.tab.addBlock("\u200B\u200Bwarn\u200B\u200B %s", {
    args: ["content"],
    displayName: msg("block-warn"),
    callback: ({ content }, thread) => {
      logMessage(content, thread, "warn");
    },
  });
  addon.tab.addBlock("\u200B\u200Berror\u200B\u200B %s", {
    args: ["content"],
    displayName: msg("block-error"),
    callback: ({ content }, thread) => {
      logMessage(content, thread, "error");
    },
  });

  const vm = addon.tab.traps.vm;
  await new Promise((resolve, reject) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const ScratchBlocks = await addon.tab.traps.getBlockly();

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
  debuggerButton.addEventListener("click", () => setInterfaceVisible(true));

  const setHasUnreadMessage = (unreadMessage) => {
    // setting image.src is slow, only do it when necessary
    const newImage = addon.self.dir + (unreadMessage ? "/icons/debug-unread.svg" : "/icons/debug.svg");
    if (debuggerButtonImage.src !== newImage) {
      debuggerButtonImage.src = newImage;
    }
  };

  const interfaceContainer = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_card", { others: "sa-debugger-interface" }),
  });
  const interfaceHeader = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons"),
  });
  const tabListElement = Object.assign(document.createElement("ul"), {
    className: "sa-debugger-tabs",
  });
  const buttonContainerElement = Object.assign(document.createElement("div"), {
    className: addon.tab.scratchClass("card_header-buttons-right", { others: "sa-debugger-header-buttons" }),
  });
  const tabContentContainer = Object.assign(document.createElement("div"), {
    className: "sa-debugger-tab-content",
  });

  let isInterfaceVisible = false;
  const setInterfaceVisible = (_isVisible) => {
    isInterfaceVisible = _isVisible;
    interfaceContainer.style.display = isInterfaceVisible ? "flex" : "";
    if (isInterfaceVisible) {
      activeTab.show();
    } else {
      activeTab.hide();
    }
  };

  let mouseOffsetX = 0;
  let mouseOffsetY = 0;
  let lastX = 0;
  let lastY = 0;
  const handleStartDrag = (e) => {
    e.preventDefault();
    mouseOffsetX = e.clientX - interfaceContainer.offsetLeft;
    mouseOffsetY = e.clientY - interfaceContainer.offsetTop;
    lastX = e.clientX;
    lastY = e.clientY;
    document.addEventListener("mouseup", handleStopDrag);
    document.addEventListener("mousemove", handleDragInterface);
  };
  const handleStopDrag = () => {
    document.removeEventListener("mouseup", handleStopDrag);
    document.removeEventListener("mousemove", handleDragInterface);
  };
  const moveInterface = (x, y) => {
    lastX = x;
    lastY = y;
    const width = (document.documentElement.clientWidth || document.body.clientWidth) - 1;
    const height = (document.documentElement.clientHeight || document.body.clientHeight) - 1;
    const clampedX = Math.max(0, Math.min(x - mouseOffsetX, width - interfaceContainer.offsetWidth));
    const clampedY = Math.max(0, Math.min(y - mouseOffsetY, height - interfaceContainer.offsetHeight));
    interfaceContainer.style.left = clampedX + "px";
    interfaceContainer.style.top = clampedY + "px";
  };
  const handleDragInterface = (e) => {
    e.preventDefault();
    moveInterface(e.clientX, e.clientY);
  };
  window.addEventListener("resize", () => {
    moveInterface(lastX, lastY);
  });
  interfaceHeader.addEventListener("mousedown", handleStartDrag);

  interfaceHeader.append(tabListElement, buttonContainerElement);
  interfaceContainer.append(interfaceHeader, tabContentContainer);
  document.body.append(interfaceContainer);

  const createHeaderButton = ({ text, icon, description }) => {
    const button = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("card_shrink-expand-button"),
      draggable: false,
    });
    if (description) {
      button.title = description;
    }
    const imageElement = Object.assign(document.createElement("img"), {
      src: icon,
      draggable: false,
    });
    const textElement = Object.assign(document.createElement("span"), {
      textContent: text,
    });
    button.appendChild(imageElement);
    button.appendChild(textElement);
    return {
      element: button,
      image: imageElement,
      text: textElement,
    };
  };

  const createHeaderTab = ({ text, icon }) => {
    const tab = document.createElement("li");
    const imageElement = Object.assign(document.createElement("img"), {
      src: icon,
      draggable: false,
    });
    const textElement = Object.assign(document.createElement("span"), {
      textContent: text,
    });
    tab.appendChild(imageElement);
    tab.appendChild(textElement);
    return {
      element: tab,
      image: imageElement,
      text: textElement,
    };
  };

  const unpauseButton = createHeaderButton({
    text: msg("unpause"),
    icon: addon.self.dir + "/icons/play.svg",
  });
  unpauseButton.element.classList.add("sa-debugger-unpause");
  unpauseButton.element.addEventListener("click", () => setPaused(false));
  const updateUnpauseVisibility = (paused) => {
    unpauseButton.element.style.display = paused ? "" : "none";
  };
  updateUnpauseVisibility(isPaused());
  onPauseChanged(updateUnpauseVisibility);

  const closeButton = createHeaderButton({
    text: msg("close"),
    icon: addon.self.dir + "/icons/close.svg",
  });
  closeButton.element.addEventListener("click", () => setInterfaceVisible(false));

  const originalStep = vm.runtime._step;
  const afterStepCallbacks = [];
  vm.runtime._step = function (...args) {
    const ret = originalStep.call(this, ...args);
    for (const cb of afterStepCallbacks) {
      cb();
    }
    return ret;
  };
  const addAfterStepCallback = (cb) => {
    afterStepCallbacks.push(cb);
  };

  const getTargetInfoById = (id) => {
    const target = vm.runtime.getTargetById(id);
    if (target) {
      let name = target.getName();
      let original = target;
      if (!target.isOriginal) {
        name = msg("clone-of", {
          sprite: name,
        });
        original = target.sprite.clones[0];
      }
      return {
        exists: true,
        originalId: original.id,
        name,
      };
    }
    return {
      exists: false,
      original: null,
      name: msg("unknown-sprite"),
    };
  };

  const createBlockLink = (targetId, blockId) => {
    const link = document.createElement("a");
    link.className = "sa-debugger-log-link";

    const { exists, name, originalId } = getTargetInfoById(targetId);
    link.textContent = name;
    if (exists) {
      // We use mousedown instead of click so that you can still go to blocks when logs are rapidly scrolling
      link.addEventListener("mousedown", () => {
        switchToSprite(originalId);
        activateCodeTab();
        goToBlock(blockId);
      });
    } else {
      link.classList.add("sa-debugger-log-link-unknown");
    }

    return link;
  };

  const switchToSprite = (targetId) => {
    if (targetId !== vm.editingTarget.id) {
      if (vm.runtime.getTargetById(targetId)) {
        vm.setEditingTarget(targetId);
      }
    }
  };

  const activateCodeTab = () => {
    const redux = addon.tab.redux;
    if (redux.state.scratchGui.editorTab.activeTabIndex !== 0) {
      redux.dispatch({
        type: "scratch-gui/navigation/ACTIVATE_TAB",
        activeTabIndex: 0,
      });
    }
  };

  const goToBlock = (blockId) => {
    const workspace = Blockly.getMainWorkspace();
    const block = workspace.getBlockById(blockId);
    if (!block) return;

    // Don't scroll to blocks in the flyout
    if (block.workspace.isFlyout) return;

    const { scrollBlockIntoView } = new DevtoolsUtils(addon);
    scrollBlockIntoView(blockId);
  };

  // May be slightly incorrect in some edge cases.
  const formatProcedureCode = (proccode) => proccode.replace(/%[nbs]/g, "()");

  // May be slightly incorrect in some edge cases.
  const formatBlocklyBlockData = (jsonData) => {
    // For sample jsonData, see:
    // https://github.com/LLK/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/blocks_vertical/motion.js
    // https://github.com/LLK/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/blocks_vertical/control.js

    const processSegment = (index) => {
      const message = jsonData[`message${index}`];
      const args = jsonData[`args${index}`];
      if (!message) {
        return null;
      }
      const parts = message.split(/%\d+/g);
      let formattedMessage = "";
      for (let i = 0; i < parts.length; i++) {
        formattedMessage += parts[i];
        const argInfo = args && args[i];
        if (argInfo) {
          const type = argInfo.type;
          if (type === "field_vertical_separator") {
            // no-op
          } else if (type === "field_image") {
            const src = argInfo.src;
            if (src.endsWith("rotate-left.svg")) {
              formattedMessage += "↩";
            } else if (src.endsWith("rotate-right.svg")) {
              formattedMessage += "↪";
            }
          } else {
            formattedMessage += "()";
          }
        }
      }
      return formattedMessage;
    };

    const parts = [];
    let i = 0;
    // The jsonData doesn't directly tell us how many segments it has, so we have to
    // just keep looping until one doesn't exist.
    while (true) {
      const nextSegment = processSegment(i);
      if (nextSegment) {
        parts.push(nextSegment);
      } else {
        break;
      }
      i++;
    }
    return parts.join(" ");
  };

  const createBlockPreview = (targetId, blockId) => {
    const target = vm.runtime.getTargetById(targetId);
    if (!target) {
      return null;
    }

    const block = target.blocks.getBlock(blockId);
    if (!block || block.opcode === "text") {
      return null;
    }

    let text;
    let category;
    let shape;
    let color;
    if (
      block.opcode === "data_variable" ||
      block.opcode === "data_listcontents" ||
      block.opcode === "argument_reporter_string_number" ||
      block.opcode === "argument_reporter_boolean"
    ) {
      text = Object.values(block.fields)[0].value;
      if (block.opcode === "data_variable") {
        category = "data";
      } else if (block.opcode === "data_listcontents") {
        category = "list";
      } else {
        category = "more";
      }
      shape = "round";
    } else if (block.opcode === "procedures_call") {
      const proccode = block.mutation.proccode;
      text = formatProcedureCode(proccode);
      const customBlock = addon.tab.getCustomBlock(proccode);
      if (customBlock) {
        category = "addon-custom-block";
        color = customBlock.color;
      } else {
        category = "more";
      }
    } else if (block.opcode === "procedures_definition") {
      const prototypeBlockId = block.inputs.custom_block.block;
      const prototypeBlock = target.blocks.getBlock(prototypeBlockId);
      const proccode = prototypeBlock.mutation.proccode;
      text = ScratchBlocks.ScratchMsgs.translate("PROCEDURES_DEFINITION", "define %1").replace(
        "%1",
        formatProcedureCode(proccode)
      );
      category = "more";
    } else {
      // Try to call things like https://github.com/LLK/scratch-blocks/blob/0bd1a17e66a779ec5d11f4a00c43784e3ac7a7b8/blocks_vertical/operators.js#L36
      var jsonData;
      const fakeBlock = {
        jsonInit(data) {
          jsonData = data;
        },
      };
      const blockConstructor = ScratchBlocks.Blocks[block.opcode];
      if (blockConstructor) {
        try {
          blockConstructor.init.call(fakeBlock);
        } catch (e) {
          // ignore
        }
      }
      if (!jsonData) {
        return null;
      }
      text = formatBlocklyBlockData(jsonData);
      if (!text) {
        return null;
      }
      category = jsonData.category;
      const isStatement =
        (jsonData.extensions &&
          (jsonData.extensions.includes("shape_statement") ||
            jsonData.extensions.includes("shape_hat") ||
            jsonData.extensions.includes("shape_end"))) ||
        "previousStatement" in jsonData ||
        "nextStatement" in jsonData;
      shape = isStatement ? "stacked" : "round";
    }
    if (!text || !category) {
      return null;
    }

    if (!color) {
      const blocklyCategoryMap = {
        "data-lists": "data_lists",
        list: "data_lists",
        events: "event",
      };
      const blocklyColor = ScratchBlocks.Colours[blocklyCategoryMap[category] || category];
      if (blocklyColor) {
        color = blocklyColor.primary;
      } else {
        // block probably belongs to an extension
        color = ScratchBlocks.Colours.pen.primary;
      }
    }

    const element = document.createElement("span");
    element.className = "sa-debugger-block-preview";
    element.textContent = text;
    element.style.backgroundColor = color;
    element.dataset.shape = shape;

    // data-category is used for editor-theme3 compatibility
    const colorCategoryMap = {
      list: "data-lists",
      more: "custom",
    };
    element.dataset.category = colorCategoryMap[category] || category;

    return element;
  };

  const api = {
    debug: {
      createHeaderButton,
      createHeaderTab,
      setHasUnreadMessage,
      addAfterStepCallback,
      getTargetInfoById,
      createBlockLink,
      createBlockPreview,
    },
    addon,
    msg,
    console,
  };
  logsTab = await createLogsTab(api);
  const threadsTab = await createThreadsTab(api);
  const performanceTab = await createPerformanceTab(api);
  const allTabs = [logsTab, threadsTab, performanceTab];

  for (const message of messagesLoggedBeforeLogsTabLoaded) {
    logsTab.addLog(...message);
  }
  messagesLoggedBeforeLogsTabLoaded.length = 0;

  let activeTab;
  const setActiveTab = (tab) => {
    if (tab === activeTab) return;
    const selectedClass = "sa-debugger-tab-selected";
    if (activeTab) {
      activeTab.hide();
      activeTab.tab.element.classList.remove(selectedClass);
    }
    tab.tab.element.classList.add(selectedClass);
    activeTab = tab;

    removeAllChildren(tabContentContainer);
    tabContentContainer.appendChild(tab.content);

    removeAllChildren(buttonContainerElement);
    buttonContainerElement.appendChild(unpauseButton.element);
    for (const button of tab.buttons) {
      buttonContainerElement.appendChild(button.element);
    }
    buttonContainerElement.appendChild(closeButton.element);

    if (isInterfaceVisible) {
      activeTab.show();
    }
  };
  for (const tab of allTabs) {
    tab.tab.element.addEventListener("click", () => {
      setActiveTab(tab);
    });
    tabListElement.appendChild(tab.tab.element);
  }
  setActiveTab(allTabs[0]);

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

  const ogGreenFlag = vm.runtime.greenFlag;
  vm.runtime.greenFlag = function (...args) {
    if (addon.settings.get("log_clear_greenflag")) {
      logsTab.clearLogs();
    }
    if (addon.settings.get("log_greenflag")) {
      logsTab.addLog(msg("log-msg-flag-clicked"), null, "internal");
    }
    return ogGreenFlag.call(this, ...args);
  };

  const ogMakeClone = vm.runtime.targets[0].constructor.prototype.makeClone;
  vm.runtime.targets[0].constructor.prototype.makeClone = function (...args) {
    if (addon.settings.get("log_failed_clone_creation") && !vm.runtime.clonesAvailable()) {
      logsTab.addLog(
        msg("log-msg-clone-cap", { sprite: this.getName() }),
        vm.runtime.sequencer.activeThread,
        "internal-warn"
      );
    }
    var clone = ogMakeClone.call(this, ...args);
    if (addon.settings.get("log_clone_create") && clone) {
      logsTab.addLog(
        msg("log-msg-clone-created", { sprite: this.getName() }),
        vm.runtime.sequencer.activeThread,
        "internal"
      );
    }
    return clone;
  };

  const ogStartHats = vm.runtime.startHats;
  vm.runtime.startHats = function (hat, optMatchFields, ...args) {
    if (addon.settings.get("log_broadcasts") && hat === "event_whenbroadcastreceived") {
      logsTab.addLog(
        msg("log-msg-broadcasted", { broadcast: optMatchFields.BROADCAST_OPTION }),
        vm.runtime.sequencer.activeThread,
        "internal"
      );
    }
    return ogStartHats.call(this, hat, optMatchFields, ...args);
  };

  const ogAddToList = vm.runtime._primitives.data_addtolist;
  vm.runtime._primitives.data_addtolist = function (args, util) {
    if (addon.settings.get("log_max_list_length")) {
      const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
      if (list.value.length >= 200000) {
        logsTab.addLog(msg("log-msg-list-append-too-long", { list: list.name }), util.thread, "internal-warn");
      }
    }
    ogAddToList.call(this, args, util);
  };

  const ogInertAtList = vm.runtime._primitives.data_insertatlist;
  vm.runtime._primitives.data_insertatlist = function (args, util) {
    if (addon.settings.get("log_max_list_length")) {
      const list = util.target.lookupOrCreateList(args.LIST.id, args.LIST.name);
      if (list.value.length >= 200000) {
        logsTab.addLog(msg("log-msg-list-insert-too-long", { list: list.name }), util.thread, "internal-warn");
      }
    }
    ogInertAtList.call(this, args, util);
  };

  const ogSetVariableTo = vm.runtime._primitives.data_setvariableto;
  vm.runtime._primitives.data_setvariableto = function (args, util) {
    if (addon.settings.get("log_invalid_cloud_data")) {
      const variable = util.target.lookupOrCreateVariable(args.VARIABLE.id, args.VARIABLE.name);
      if (variable.isCloud) {
        const value = args.VALUE.toString();
        if (isNaN(value)) {
          logsTab.addLog(msg("log-cloud-data-nan", { var: variable.name }), util.thread, "internal-warn");
        } else if (value.length > 256) {
          logsTab.addLog(msg("log-cloud-data-too-long", { var: variable.name }), util.thread, "internal-warn");
        }
      }
    }
    ogSetVariableTo.call(this, args, util);
  };

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
      setInterfaceVisible(false);
    }
  }
}
