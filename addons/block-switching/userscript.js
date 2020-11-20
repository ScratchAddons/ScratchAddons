import blockToDom from "./blockToDom.js";

export default async function ({ addon, global, console }) {
  const blockSwitches = {};

  if (addon.settings.get("motion")) {
    blockSwitches["motion_turnright"] = [
      {
        opcode: "motion_turnleft",
      },
    ];
    blockSwitches["motion_turnleft"] = [
      {
        opcode: "motion_turnright",
      },
    ];
    blockSwitches["motion_setx"] = [
      {
        opcode: "motion_changexby",
        remap: { X: "DX" },
      },
      {
        opcode: "motion_sety",
        remap: { X: "Y" },
      },
      {
        opcode: "motion_changeyby",
        remap: { X: "DY" },
      },
    ];
    blockSwitches["motion_changexby"] = [
      {
        opcode: "motion_setx",
        remap: { DX: "X" },
      },
      {
        opcode: "motion_sety",
        remap: { DX: "Y" },
      },
      {
        opcode: "motion_changeyby",
        remap: { DX: "DY" },
      },
    ];
    blockSwitches["motion_sety"] = [
      {
        opcode: "motion_setx",
        remap: { Y: "X" },
      },
      {
        opcode: "motion_changexby",
        remap: { Y: "DX" },
      },
      {
        opcode: "motion_changeyby",
        remap: { Y: "DY" },
      },
    ];
    blockSwitches["motion_changeyby"] = [
      {
        opcode: "motion_setx",
        remap: { DY: "X" },
      },
      {
        opcode: "motion_changexby",
        remap: { DY: "DX" },
      },
      {
        opcode: "motion_sety",
        remap: { DY: "Y" },
      },
    ];
    blockSwitches["motion_xposition"] = [
      {
        opcode: "motion_yposition",
      },
    ];
    blockSwitches["motion_yposition"] = [
      {
        opcode: "motion_xposition",
      },
    ];
  }

  if (addon.settings.get("looks")) {
    blockSwitches["looks_changeeffectby"] = [
      {
        opcode: "looks_seteffectto",
        remap: { CHANGE: "VALUE" },
      },
    ];
    blockSwitches["looks_seteffectto"] = [
      {
        opcode: "looks_changeeffectby",
        remap: { VALUE: "CHANGE" },
      },
    ];
    blockSwitches["looks_changesizeby"] = [
      {
        opcode: "looks_setsizeto",
        remap: { CHANGE: "SIZE" },
      },
    ];
    blockSwitches["looks_setsizeto"] = [
      {
        opcode: "looks_changesizeby",
        remap: { SIZE: "CHANGE" },
      },
    ];
    blockSwitches["looks_costumenumbername"] = [
      {
        opcode: "looks_backdropnumbername",
      },
    ];
    blockSwitches["looks_backdropnumbername"] = [
      {
        opcode: "looks_costumenumbername",
      },
    ];
    blockSwitches["looks_show"] = [
      {
        opcode: "looks_hide",
      },
    ];
    blockSwitches["looks_hide"] = [
      {
        opcode: "looks_show",
      },
    ];
    blockSwitches["looks_nextcostume"] = [
      {
        opcode: "looks_nextbackdrop",
      },
    ];
    blockSwitches["looks_nextbackdrop"] = [
      {
        opcode: "looks_nextcostume",
      },
    ];
  }

  if (addon.settings.get("sound")) {
    blockSwitches["sound_play"] = [
      {
        opcode: "sound_playuntildone",
      },
    ];
    blockSwitches["sound_playuntildone"] = [
      {
        opcode: "sound_play",
      },
    ];
    blockSwitches["sound_changeeffectby"] = [
      {
        opcode: "sound_seteffectto",
      },
    ];
    blockSwitches["sound_seteffectto"] = [
      {
        opcode: "sound_changeeffectby",
      },
    ];
    blockSwitches["sound_setvolumeto"] = [
      {
        opcode: "sound_changevolumeby",
      },
    ];
    blockSwitches["sound_changevolumeby"] = [
      {
        opcode: "sound_setvolumeto",
      },
    ];
  }

  if (addon.settings.get("event")) {
    blockSwitches["event_broadcast"] = [
      {
        opcode: "event_broadcastandwait",
      },
    ];
    blockSwitches["event_broadcastandwait"] = [
      {
        opcode: "event_broadcast",
      },
    ];
  }

  if (addon.settings.get("control")) {
    blockSwitches["control_if"] = [
      {
        opcode: "control_if_else",
      },
    ];
    blockSwitches["control_if_else"] = [
      {
        opcode: "control_if",
        remap: { SUBSTACK2: "split" },
      },
    ];
    blockSwitches["control_repeat_until"] = [
      {
        opcode: "control_wait_until",
        remap: { SUBSTACK: "split" },
      },
    ];
    blockSwitches["control_wait_until"] = [
      {
        opcode: "control_repeat_until",
      },
    ];
  }

  if (addon.settings.get("operator")) {
    blockSwitches["operator_equals"] = [
      {
        opcode: "operator_gt",
      },
      {
        opcode: "operator_lt",
      },
    ];
    blockSwitches["operator_gt"] = [
      {
        opcode: "operator_equals",
      },
      {
        opcode: "operator_lt",
      },
    ];
    blockSwitches["operator_lt"] = [
      {
        opcode: "operator_equals",
      },
      {
        opcode: "operator_gt",
      },
    ];
    blockSwitches["operator_add"] = [
      {
        opcode: "operator_subtract",
      },
      {
        opcode: "operator_multiply",
      },
      {
        opcode: "operator_divide",
      },
      {
        opcode: "operator_mod",
      },
    ];
    blockSwitches["operator_subtract"] = [
      {
        opcode: "operator_add",
      },
      {
        opcode: "operator_multiply",
      },
      {
        opcode: "operator_divide",
      },
      {
        opcode: "operator_mod",
      },
    ];
    blockSwitches["operator_multiply"] = [
      {
        opcode: "operator_add",
      },
      {
        opcode: "operator_subtract",
      },
      {
        opcode: "operator_divide",
      },
      {
        opcode: "operator_mod",
      },
    ];
    blockSwitches["operator_divide"] = [
      {
        opcode: "operator_add",
      },
      {
        opcode: "operator_subtract",
      },
      {
        opcode: "operator_multiply",
      },
      {
        opcode: "operator_mod",
      },
    ];
    blockSwitches["operator_mod"] = [
      {
        opcode: "operator_add",
      },
      {
        opcode: "operator_subtract",
      },
      {
        opcode: "operator_multiply",
      },
      {
        opcode: "operator_divide",
      },
    ];
    blockSwitches["operator_and"] = [
      {
        opcode: "operator_or",
      },
    ];
    blockSwitches["operator_or"] = [
      {
        opcode: "operator_and",
      },
    ];
  }

  if (addon.settings.get("sensing")) {
    blockSwitches["sensing_mousex"] = [
      {
        opcode: "sensing_mousey",
      },
    ];
    blockSwitches["sensing_mousey"] = [
      {
        opcode: "sensing_mousex",
      },
    ];
  }

  if (addon.settings.get("data")) {
    blockSwitches["data_changevariableby"] = [
      {
        opcode: "data_setvariableto",
      },
    ];
    blockSwitches["data_setvariableto"] = [
      {
        opcode: "data_changevariableby",
      },
    ];
    blockSwitches["data_showvariable"] = [
      {
        opcode: "data_hidevariable",
      },
    ];
    blockSwitches["data_hidevariable"] = [
      {
        opcode: "data_showvariable",
      },
    ];
  }

  if (addon.settings.get("extension")) {
    blockSwitches["pen_penDown"] = [
      {
        opcode: "pen_penUp",
      },
    ];
    blockSwitches["pen_penUp"] = [
      {
        opcode: "pen_penDown",
      },
    ];
    blockSwitches["pen_setPenColorParamTo"] = [
      {
        opcode: "pen_changePenColorParamBy",
      },
    ];
    blockSwitches["pen_changePenColorParamBy"] = [
      {
        opcode: "pen_setPenColorParamTo",
      },
    ];
    blockSwitches["pen_changePenHueBy"] = [
      {
        opcode: "pen_setPenHueToNumber",
      },
    ];
    blockSwitches["pen_setPenHueToNumber"] = [
      {
        opcode: "pen_changePenHueBy",
      },
    ];
    blockSwitches["pen_changePenShadeBy"] = [
      {
        opcode: "pen_setPenShadeToNumber",
      },
    ];
    blockSwitches["pen_setPenShadeToNumber"] = [
      {
        opcode: "pen_changePenShadeBy",
      },
    ];
    blockSwitches["pen_changePenSizeBy"] = [
      {
        opcode: "pen_setPenSizeTo",
      },
    ];
    blockSwitches["pen_setPenSizeTo"] = [
      {
        opcode: "pen_changePenSizeBy",
      },
    ];
  }

  // temporary until l10n is merged
  const messages = {
    event_broadcast: "broadcast",
    event_broadcastandwait: "broadcast and wait",
    control_if: "if",
    control_if_else: "if... else",
    control_repeat_until: "repeat until",
    control_wait_until: "wait until",
    data_changevariableby: "change variable",
    data_setvariableto: "set variable",
    data_showvariable: "show variable",
    data_hidevariable: "hide variable",
    looks_changeeffectby: "change effect",
    looks_seteffectto: "set effect",
    looks_changesizeby: "change size",
    looks_setsizeto: "set size",
    looks_costumenumbername: "costume number/name",
    looks_backdropnumbername: "backdrop number/name",
    looks_show: "show",
    looks_hide: "hide",
    looks_nextcostume: "next costume",
    looks_nextbackdrop: "next backdrop",
    motion_turnright: "turn right",
    motion_turnleft: "turn left",
    motion_setx: "set x",
    motion_changexby: "change x",
    motion_sety: "set y",
    motion_changeyby: "change y",
    motion_xposition: "x",
    motion_yposition: "y",
    operator_equals: "=",
    operator_gt: ">",
    operator_lt: "<",
    operator_add: "+",
    operator_subtract: "-",
    operator_multiply: "*",
    operator_divide: "/",
    operator_mod: "mod",
    operator_and: "and",
    operator_or: "or",
    pen_penDown: "pen down",
    pen_penUp: "pen up",
    pen_setPenColorParamTo: "set parameter",
    pen_changePenColorParamBy: "change parameter",
    pen_changePenHueBy: "change hue",
    pen_setPenHueToNumber: "set hue",
    pen_changePenShadeBy: "change shade",
    pen_setPenShadeToNumber: "set shade",
    pen_changePenSizeBy: "change size",
    pen_setPenSizeTo: "set size",
    sensing_mousex: "mouse x",
    sensing_mousey: "mouse y",
    sound_play: "play",
    sound_playuntildone: "play until done",
    sound_changeeffectby: "change effect",
    sound_seteffectto: "set effect",
    sound_setvolumeto: "set volume",
    sound_changevolumeby: "change volume",
  };

  let addBorderToContextMenuItem = -1;

  const menuCallbackFactory = (block, opcodeData) => () => {
    const workspace = block.workspace;

    // Make a copy of the block with the proper type set.
    // It doesn't seem to be possible to change a Block's type after it's created, so we'll just make a new block instead.
    const xml = blockToDom(block);
    xml.setAttribute("type", opcodeData.opcode);

    const id = block.id;
    const parent = block.getParent();

    let parentConnection;
    let blockConnectionType;
    if (parent) {
      // If the block has a parent, find the parent -> child connection that will be reattached later.
      const parentConnections = parent.getConnections_();
      parentConnection = parentConnections.find((c) => c.targetConnection && c.targetConnection.sourceBlock_ === block);
      // There's two types of connections from child -> parent. We need to figure out which one is used.
      const blockConnections = block.getConnections_();
      const blockToParentConnection = blockConnections.find(
        (c) => c.targetConnection && c.targetConnection.sourceBlock_ === parent
      );
      blockConnectionType = blockToParentConnection.type;
    }

    const pasteSeparately = [];
    // Apply input remappings.
    if (opcodeData.remap) {
      const childNodes = Array.from(xml.children);
      for (const child of childNodes) {
        const oldName = child.getAttribute("name");
        const newName = opcodeData.remap[oldName];
        if (newName) {
          if (newName === "split") {
            // This input will be split off into its own script.
            const inputXml = child.firstChild;
            const inputId = inputXml.id;
            const inputBlock = workspace.getBlockById(inputId);

            const position = inputBlock.getRelativeToSurfaceXY();
            inputXml.setAttribute("x", Math.round(workspace.RTL ? -position.x : position.x));
            inputXml.setAttribute("y", Math.round(position.y));

            pasteSeparately.push(inputXml);
            xml.removeChild(child);
          } else {
            child.setAttribute("name", newName);
          }
        }
      }
    }

    // Mark the latest event in the undo stack.
    // This will be used later to group all of our events.
    const undoStack = workspace.undoStack_;
    if (undoStack.length) {
      undoStack[undoStack.length - 1]._blockswitchingLastUndo = true;
    }

    // Remove the old block and insert the new one.
    block.dispose();
    workspace.paste(xml);
    for (const separateBlock of pasteSeparately) {
      workspace.paste(separateBlock);
    }

    // The new block will have the same ID as the old one.
    const newBlock = workspace.getBlockById(id);

    if (parentConnection) {
      // Search for the same type of connection on the new block as on the old block.
      const newBlockConnections = newBlock.getConnections_();
      const newBlockConnection = newBlockConnections.find((c) => c.type === blockConnectionType);
      newBlockConnection.connect(parentConnection);
    }

    // Events are delayed with a setTimeout(f, 0):
    // https://github.com/LLK/scratch-blocks/blob/f159a1779e5391b502d374fb2fdd0cb5ca43d6a2/core/events.js#L182
    setTimeout(() => {
      const group = Symbol();
      for (let i = undoStack.length - 1; i >= 0 && !undoStack[i]._blockswitchingLastUndo; i--) {
        undoStack[i].group = group;
      }
    }, 0);
  };

  const customContextMenuHandler = function (options) {
    addBorderToContextMenuItem = options.length;
    const switches = blockSwitches[this.type];
    for (const opcodeData of switches) {
      // TODO: use l10n api when its merged
      const translation = messages[opcodeData.opcode] || opcodeData.opcode;
      options.push({
        enabled: true,
        text: translation,
        callback: menuCallbackFactory(this, opcodeData),
      });
    }
  };

  const injectCustomContextMenu = (block) => {
    const type = block.type;
    if (!blockSwitches.hasOwnProperty(type)) {
      return;
    }

    if (block.customContextMenu) {
      return;
    }

    block.customContextMenu = customContextMenuHandler;
  };

  const changeListener = (change) => {
    if (change.type !== "create") {
      return;
    }

    for (const id of change.ids) {
      const block = Blockly.getMainWorkspace().getBlockById(id);
      if (!block) continue;
      injectCustomContextMenu(block);
    }
  };

  const mutationObserverCallback = (mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.classList.contains("blocklyContextMenu")) {
          if (addBorderToContextMenuItem === -1) {
            continue;
          }
          const children = node.children;
          const item = children[addBorderToContextMenuItem];
          item.style.paddingTop = "2px";
          item.style.borderTop = "1px solid hsla(0, 0%, 0%, 0.15)";
          addBorderToContextMenuItem = -1;
        }
      }
    }
  };

  const inject = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace._blockswitchingInjected) {
      return;
    }
    mutationObserver.observe(document.querySelector(".blocklyWidgetDiv"), {
      childList: true,
    });
    workspace._blockswitchingInjected = true;
    workspace.getAllBlocks().forEach(injectCustomContextMenu);
    workspace.addChangeListener(changeListener);
  };

  const mutationObserver = new MutationObserver(mutationObserverCallback);

  if (addon.tab.editorMode === "editor") {
    const interval = setInterval(() => {
      if (Blockly.getMainWorkspace()) {
        inject();
        clearInterval(interval);
      }
    }, 100);
  }
  addon.tab.addEventListener("urlChange", () => addon.tab.editorMode === "editor" && inject());
}
