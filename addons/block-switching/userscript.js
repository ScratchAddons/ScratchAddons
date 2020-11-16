export default async function ({ addon, global, console }) {
  const blockSwitches = {
    event_broadcast: [
      {
        opcode: "event_broadcastandwait",
      },
    ],
    event_broadcastandwait: [
      {
        opcode: "event_broadcast",
      },
    ],
    control_if: [
      {
        opcode: "control_if_else",
      },
    ],
    control_if_else: [
      {
        opcode: "control_if",
        remap: { SUBSTACK2: "split" },
      },
    ],
    data_changevariableby: [
      {
        opcode: "data_setvariableto",
      },
    ],
    data_setvariableto: [
      {
        opcode: "data_changevariableby",
      },
    ],
    data_showvariable: [
      {
        opcode: "data_hidevariable",
      },
    ],
    data_hidevariable: [
      {
        opcode: "data_showvariable",
      },
    ],
    looks_changeeffectby: [
      {
        opcode: "looks_seteffectto",
        remap: { CHANGE: "VALUE" },
      },
    ],
    looks_seteffectto: [
      {
        opcode: "looks_changeeffectby",
        remap: { VALUE: "CHANGE" },
      },
    ],
    looks_changesizeby: [
      {
        opcode: "looks_setsizeto",
        remap: { CHANGE: "SIZE" },
      },
    ],
    looks_setsizeto: [
      {
        opcode: "looks_changesizeby",
        remap: { SIZE: "CHANGE" },
      },
    ],
    looks_costumenumbername: [
      {
        opcode: "looks_backdropnumbername",
      },
    ],
    looks_backdropnumbername: [
      {
        opcode: "looks_costumenumbername",
      },
    ],
    looks_show: [
      {
        opcode: "looks_hide",
      },
    ],
    looks_hide: [
      {
        opcode: "looks_show",
      },
    ],
    looks_nextcostume: [
      {
        opcode: "looks_nextbackdrop",
      },
    ],
    looks_nextbackdrop: [
      {
        opcode: "looks_nextcostume",
      },
    ],
    motion_turnright: [
      {
        opcode: "motion_turnleft",
      },
    ],
    motion_turnleft: [
      {
        opcode: "motion_turnright",
      },
    ],
    motion_setx: [
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
    ],
    motion_changexby: [
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
    ],
    motion_sety: [
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
    ],
    motion_changeyby: [
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
    ],
    motion_xposition: [
      {
        opcode: "motion_yposition",
      },
    ],
    motion_yposition: [
      {
        opcode: "motion_xposition",
      },
    ],
    operator_equals: [
      {
        opcode: "operator_gt",
      },
      {
        opcode: "operator_lt",
      },
    ],
    operator_gt: [
      {
        opcode: "operator_equals",
      },
      {
        opcode: "operator_lt",
      },
    ],
    operator_lt: [
      {
        opcode: "operator_equals",
      },
      {
        opcode: "operator_gt",
      },
    ],
    operator_add: [
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
    ],
    operator_subtract: [
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
    ],
    operator_multiply: [
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
    ],
    operator_divide: [
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
    ],
    operator_mod: [
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
    ],
    operator_and: [
      {
        opcode: "operator_or",
      },
    ],
    operator_or: [
      {
        opcode: "operator_and",
      },
    ],
    pen_penDown: [
      {
        opcode: "pen_penUp",
      },
    ],
    pen_penUp: [
      {
        opcode: "pen_penDown",
      },
    ],
    pen_setPenColorParamTo: [
      {
        opcode: "pen_changePenColorParamBy",
      },
    ],
    pen_changePenColorParamBy: [
      {
        opcode: "pen_setPenColorParamTo",
      },
    ],
    pen_changePenHueBy: [
      {
        opcode: "pen_setPenHueToNumber",
      },
    ],
    pen_setPenHueToNumber: [
      {
        opcode: "pen_changePenHueBy",
      },
    ],
    pen_changePenShadeBy: [
      {
        opcode: "pen_setPenShadeToNumber",
      },
    ],
    pen_setPenShadeToNumber: [
      {
        opcode: "pen_changePenShadeBy",
      },
    ],
    pen_changePenSizeBy: [
      {
        opcode: "pen_setPenSizeTo",
      },
    ],
    pen_setPenSizeTo: [
      {
        opcode: "pen_changePenSizeBy",
      },
    ],
    sensing_mousex: [
      {
        opcode: "sensing_mousey",
      },
    ],
    sensing_mousey: [
      {
        opcode: "sensing_mousex",
      },
    ],
    sound_play: [
      {
        opcode: "sound_playuntildone",
      },
    ],
    sound_playuntildone: [
      {
        opcode: "sound_play",
      },
    ],
    sound_changeeffectby: [
      {
        opcode: "sound_seteffectto",
      },
    ],
    sound_seteffectto: [
      {
        opcode: "sound_changeeffectby",
      },
    ],
    sound_setvolumeto: [
      {
        opcode: "sound_changevolumeby",
      },
    ],
    sound_changevolumeby: [
      {
        opcode: "sound_setvolumeto",
      },
    ],
  };

  // temporary until l10n is merged
  const messages = {
    event_broadcast: "Broadcast",
    event_broadcastandwait: "Broadcast and wait",
    control_if: "If",
    control_if_else: "If else",
    data_changevariableby: "Change variable",
    data_setvariableto: "Set variable",
    data_showvariable: "Show variable",
    data_hidevariable: "Hide variable",
    looks_changeeffectby: "Change effect",
    looks_seteffectto: "Set effect",
    looks_changesizeby: "Change size",
    looks_setsizeto: "Set size",
    looks_costumenumbername: "Costume number/name",
    looks_backdropnumbername: "Backdrop number/name",
    looks_show: "Show",
    looks_hide: "Hide",
    looks_nextcostume: "Next costume",
    looks_nextbackdrop: "Next backdrop",
    motion_turnright: "Turn right",
    motion_turnleft: "Turn left",
    motion_setx: "Set X",
    motion_changexby: "Change X",
    motion_sety: "Set Y",
    motion_changeyby: "Change Y",
    motion_xposition: "X",
    motion_yposition: "Y",
    operator_equals: "=",
    operator_gt: ">",
    operator_lt: "<",
    operator_add: "+",
    operator_subtract: "-",
    operator_multiply: "*",
    operator_divide: "/",
    operator_mod: "%",
    operator_and: "and",
    operator_or: "or",
    pen_penDown: "Pen down",
    pen_penUp: "Pen up",
    pen_setPenColorParamTo: "Set parameter",
    pen_changePenColorParamBy: "Change parameter",
    pen_changePenHueBy: "Change hue",
    pen_setPenHueToNumber: "Set hue",
    pen_changePenShadeBy: "Change shade",
    pen_setPenShadeToNumber: "Set shade",
    pen_changePenSizeBy: "Change size",
    pen_setPenSizeTo: "Set size",
    sensing_mousex: "Mouse X",
    sensing_mousey: "Mouse Y",
    sound_play: "Play",
    sound_playuntildone: "Play until done",
    sound_changeeffectby: "Change effect",
    sound_seteffectto: "Set effect",
    sound_setvolumeto: "Set volume",
    sound_changevolumeby: "Change volume",
  };

  const blockToDom = (block) => {
    // Blockly/Scratch has logic to convert individual blocks to XML, but this is not part of the global Blockly object.
    // It does, however, expose a method to convert the entire workspace to XML which we can use.
    // Certainly not ideal. In the future we should bring in our own Blockly.Xml.blockToDom
    const workspaceXml = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
    // TODO: this won't work if the block ID has some very strange and unusual characters.
    // However, IDs generated by Scratch shouldn't have those so it probably isn't a big deal.
    return workspaceXml.querySelector(`[id="${block.id}"]`);
  };

  const menuCallbackFactory = (block, opcodeData) => () => {
    // Make a copy of the block with the proper type set.
    // It doesn't seem to be possible to change a Block's type after it's created, so we'll just make a new block instead.
    const xml = blockToDom(block);
    xml.setAttribute("type", opcodeData.opcode);

    const id = block.id;
    const parent = block.getParent();

    let parentConnection;
    let blockConnectionType;
    if (parent) {
      // If the block has a parent, find out which connection we will have to reattach later.
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
            // As these will be split into their own script, we need to determine their current position.
            const inputId = inputXml.id;
            const inputBlock = Blockly.getMainWorkspace().getBlockById(inputId);
            const position = inputBlock.getRelativeToSurfaceXY();
            inputXml.setAttribute("x", position.x);
            inputXml.setAttribute("y", position.y);
            pasteSeparately.push(inputXml);
            xml.removeChild(child);
          } else {
            child.setAttribute("name", newName);
          }
        }
      }
    }

    // Mark the latest event in the undo stack so that we can group all of our events properly.
    const undoStack = Blockly.getMainWorkspace().undoStack_;
    if (undoStack.length) {
      undoStack[undoStack.length - 1]._blockswitchingLastUndo = true;
    }

    // Remove the old block and insert the new one.
    block.dispose();
    Blockly.getMainWorkspace().paste(xml);
    for (const separateBlock of pasteSeparately) {
      Blockly.getMainWorkspace().paste(separateBlock);
    }

    // The new block will have the same ID as the old one.
    const newBlock = Blockly.getMainWorkspace().getBlockById(id);

    if (parentConnection) {
      // Search for the same type of connection on the new block as on the old block.
      const newBlockConnections = newBlock.getConnections_();
      const newBlockConnection = newBlockConnections.find((c) => c.type === blockConnectionType);
      newBlockConnection.connect(parentConnection);
    }

    // TODO: figure out why undoStack_ takes a bit to update and see if this workaround is good enough
    setTimeout(() => {
      // Give all of our undo events the same group so that they get undone/redone at the same time.
      const group = Symbol();
      for (var i = undoStack.length - 1; i >= 0 && !undoStack[i]._blockswitchingLastUndo; i--) {
        undoStack[i].group = group;
      }
    });
  };

  const customContextMenuHandler = function (options) {
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

  const inject = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace._blockswitchingInjected) {
      return;
    }
    workspace._blockswitchingInjected = true;
    workspace.getAllBlocks().forEach(injectCustomContextMenu);
    workspace.addChangeListener(changeListener);
  };

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
