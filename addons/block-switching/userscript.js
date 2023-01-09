export default async function ({ addon, console, msg }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  let blockSwitches = {};
  let procedureSwitches = {};
  const noopSwitch = {
    isNoop: true,
  };

  const randomColor = () => {
    const num = Math.floor(Math.random() * 256 * 256 * 256);
    return `#${num.toString(16).padStart(6, '0')}`;
  };

  const buildSwitches = () => {
    blockSwitches = {};
    procedureSwitches = {};

    if (addon.settings.get("motion")) {
      blockSwitches["motion_turnright"] = [
        noopSwitch,
        {
          opcode: "motion_turnleft",
        },
      ];
      blockSwitches["motion_turnleft"] = [
        {
          opcode: "motion_turnright",
        },
        noopSwitch,
      ];
      blockSwitches["motion_setx"] = [
        noopSwitch,
        {
          opcode: "motion_changexby",
          remapInputName: { X: "DX" },
        },
        {
          opcode: "motion_sety",
          remapInputName: { X: "Y" },
        },
        {
          opcode: "motion_changeyby",
          remapInputName: { X: "DY" },
        },
      ];
      blockSwitches["motion_changexby"] = [
        {
          opcode: "motion_setx",
          remapInputName: { DX: "X" },
        },
        noopSwitch,
        {
          opcode: "motion_sety",
          remapInputName: { DX: "Y" },
        },
        {
          opcode: "motion_changeyby",
          remapInputName: { DX: "DY" },
        },
      ];
      blockSwitches["motion_sety"] = [
        {
          opcode: "motion_setx",
          remapInputName: { Y: "X" },
        },
        {
          opcode: "motion_changexby",
          remapInputName: { Y: "DX" },
        },
        noopSwitch,
        {
          opcode: "motion_changeyby",
          remapInputName: { Y: "DY" },
        },
      ];
      blockSwitches["motion_changeyby"] = [
        {
          opcode: "motion_setx",
          remapInputName: { DY: "X" },
        },
        {
          opcode: "motion_changexby",
          remapInputName: { DY: "DX" },
        },
        {
          opcode: "motion_sety",
          remapInputName: { DY: "Y" },
        },
        noopSwitch,
      ];
      blockSwitches["motion_xposition"] = [
        noopSwitch,
        {
          opcode: "motion_yposition",
        },
      ];
      blockSwitches["motion_yposition"] = [
        {
          opcode: "motion_xposition",
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("looks")) {
      blockSwitches["looks_seteffectto"] = [
        noopSwitch,
        {
          opcode: "looks_changeeffectby",
          remapInputName: { VALUE: "CHANGE" },
        },
      ];
      blockSwitches["looks_changeeffectby"] = [
        {
          opcode: "looks_seteffectto",
          remapInputName: { CHANGE: "VALUE" },
        },
        noopSwitch,
      ];
      blockSwitches["looks_setsizeto"] = [
        noopSwitch,
        {
          opcode: "looks_changesizeby",
          remapInputName: { SIZE: "CHANGE" },
        },
      ];
      blockSwitches["looks_changesizeby"] = [
        {
          opcode: "looks_setsizeto",
          remapInputName: { CHANGE: "SIZE" },
        },
        noopSwitch,
      ];
      blockSwitches["looks_costumenumbername"] = [
        noopSwitch,
        {
          opcode: "looks_backdropnumbername",
        },
      ];
      blockSwitches["looks_backdropnumbername"] = [
        {
          opcode: "looks_costumenumbername",
        },
        noopSwitch,
      ];
      blockSwitches["looks_show"] = [
        noopSwitch,
        {
          opcode: "looks_hide",
        },
      ];
      blockSwitches["looks_hide"] = [
        {
          opcode: "looks_show",
        },
        noopSwitch,
      ];
      blockSwitches["looks_nextcostume"] = [
        noopSwitch,
        {
          opcode: "looks_nextbackdrop",
        },
      ];
      blockSwitches["looks_nextbackdrop"] = [
        {
          opcode: "looks_nextcostume",
        },
        noopSwitch,
      ];
      blockSwitches["looks_say"] = [
        noopSwitch,
        {
          opcode: "looks_sayforsecs",
          createInputs: {
            SECS: {
              shadowType: "math_number",
              value: "2",
            },
          },
        },
        {
          opcode: "looks_think",
        },
        {
          opcode: "looks_thinkforsecs",
          createInputs: {
            SECS: {
              shadowType: "math_number",
              value: "2",
            },
          },
        },
      ];
      blockSwitches["looks_think"] = [
        {
          opcode: "looks_say",
        },
        {
          opcode: "looks_sayforsecs",
          createInputs: {
            SECS: {
              shadowType: "math_number",
              value: "2",
            },
          },
        },
        noopSwitch,
        {
          opcode: "looks_thinkforsecs",
          createInputs: {
            SECS: {
              shadowType: "math_number",
              value: "2",
            },
          },
        },
      ];
      blockSwitches["looks_sayforsecs"] = [
        {
          opcode: "looks_say",
          splitInputs: ["SECS"],
        },
        {
          opcode: "looks_think",
          splitInputs: ["SECS"],
        },
        noopSwitch,
        {
          opcode: "looks_thinkforsecs",
        },
      ];
      blockSwitches["looks_thinkforsecs"] = [
        {
          opcode: "looks_say",
          splitInputs: ["SECS"],
        },
        {
          opcode: "looks_think",
          splitInputs: ["SECS"],
        },
        {
          opcode: "looks_sayforsecs",
        },
        noopSwitch,
      ];
      blockSwitches["looks_switchbackdropto"] = [
        noopSwitch,
        {
          opcode: "looks_switchbackdroptoandwait",
        },
      ];
      blockSwitches["looks_switchbackdroptoandwait"] = [
        {
          opcode: "looks_switchbackdropto",
        },
        noopSwitch,
      ];
      blockSwitches["looks_gotofrontback"] = [
        noopSwitch,
        {
          opcode: "looks_goforwardbackwardlayers",
          remapInputName: {
            FRONT_BACK: "FORWARD_BACKWARD",
          },
          mapFieldValues: {
            FRONT_BACK: {
              front: "forward",
              back: "backward",
            },
          },
          createInputs: {
            NUM: {
              shadowType: "math_integer",
              value: "1",
            },
          },
        },
      ];
      blockSwitches["looks_goforwardbackwardlayers"] = [
        {
          opcode: "looks_gotofrontback",
          splitInputs: ["NUM"],
          remapInputName: {
            FORWARD_BACKWARD: "FRONT_BACK",
          },
          mapFieldValues: {
            FORWARD_BACKWARD: {
              forward: "front",
              backward: "back",
            },
          },
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("sound")) {
      blockSwitches["sound_play"] = [
        noopSwitch,
        {
          opcode: "sound_playuntildone",
        },
      ];
      blockSwitches["sound_playuntildone"] = [
        {
          opcode: "sound_play",
        },
        noopSwitch,
      ];
      blockSwitches["sound_seteffectto"] = [
        noopSwitch,
        {
          opcode: "sound_changeeffectby",
        },
      ];
      blockSwitches["sound_changeeffectby"] = [
        {
          opcode: "sound_seteffectto",
        },
        noopSwitch,
      ];
      blockSwitches["sound_setvolumeto"] = [
        noopSwitch,
        {
          opcode: "sound_changevolumeby",
        },
      ];
      blockSwitches["sound_changevolumeby"] = [
        {
          opcode: "sound_setvolumeto",
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("event")) {
      blockSwitches["event_broadcast"] = [
        noopSwitch,
        {
          opcode: "event_broadcastandwait",
        },
      ];
      blockSwitches["event_broadcastandwait"] = [
        {
          opcode: "event_broadcast",
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("control")) {
      blockSwitches["control_if"] = [
        noopSwitch,
        {
          opcode: "control_if_else",
        },
      ];
      blockSwitches["control_if_else"] = [
        {
          opcode: "control_if",
          splitInputs: ["SUBSTACK2"],
        },
        noopSwitch,
      ];
      blockSwitches["control_repeat_until"] = [
        noopSwitch,
        {
          opcode: "control_wait_until",
          splitInputs: ["SUBSTACK"],
        },
        {
          opcode: "control_forever",
          splitInputs: ["CONDITION"],
        },
      ];
      blockSwitches["control_forever"] = [
        {
          opcode: "control_repeat_until",
        },
        noopSwitch,
      ];
      blockSwitches["control_wait_until"] = [
        {
          opcode: "control_repeat_until",
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("operator")) {
      blockSwitches["operator_equals"] = [
        {
          opcode: "operator_gt",
        },
        noopSwitch,
        {
          opcode: "operator_lt",
        },
      ];
      blockSwitches["operator_gt"] = [
        noopSwitch,
        {
          opcode: "operator_equals",
        },
        {
          opcode: "operator_lt",
        },
      ];
      blockSwitches["operator_lt"] = [
        {
          opcode: "operator_gt",
        },
        {
          opcode: "operator_equals",
        },
        noopSwitch,
      ];
      blockSwitches["operator_add"] = [
        noopSwitch,
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
        noopSwitch,
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
        noopSwitch,
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
        noopSwitch,
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
        noopSwitch,
      ];
      blockSwitches["operator_and"] = [
        noopSwitch,
        {
          opcode: "operator_or",
        },
      ];
      blockSwitches["operator_or"] = [
        {
          opcode: "operator_and",
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("sensing")) {
      blockSwitches["sensing_mousex"] = [
        noopSwitch,
        {
          opcode: "sensing_mousey",
        },
      ];
      blockSwitches["sensing_mousey"] = [
        {
          opcode: "sensing_mousex",
        },
        noopSwitch,
      ];
      blockSwitches["sensing_touchingcolor"] = [
        noopSwitch,
        {
          opcode: "sensing_coloristouchingcolor",
          createInputs: {
            COLOR2: {
              shadowType: "colour_picker",
              value: randomColor,
            },
          },
        },
      ];
      blockSwitches["sensing_coloristouchingcolor"] = [
        {
          opcode: "sensing_touchingcolor",
          splitInputs: ["COLOR2"],
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("data")) {
      blockSwitches["data_setvariableto"] = [
        noopSwitch,
        {
          opcode: "data_changevariableby",
          remapShadowType: { VALUE: "math_number" },
        },
      ];
      blockSwitches["data_changevariableby"] = [
        {
          opcode: "data_setvariableto",
          remapShadowType: { VALUE: "text" },
        },
        noopSwitch,
      ];
      blockSwitches["data_showvariable"] = [
        noopSwitch,
        {
          opcode: "data_hidevariable",
        },
      ];
      blockSwitches["data_hidevariable"] = [
        {
          opcode: "data_showvariable",
        },
        noopSwitch,
      ];
      blockSwitches["data_showlist"] = [
        noopSwitch,
        {
          opcode: "data_hidelist",
        },
      ];
      blockSwitches["data_hidelist"] = [
        {
          opcode: "data_showlist",
        },
        noopSwitch,
      ];
      blockSwitches["data_replaceitemoflist"] = [
        noopSwitch,
        {
          opcode: "data_insertatlist",
        },
      ];
      blockSwitches["data_insertatlist"] = [
        {
          opcode: "data_replaceitemoflist",
        },
        noopSwitch,
      ];
      blockSwitches["data_deleteoflist"] = [
        noopSwitch,
        {
          opcode: "data_deletealloflist",
          splitInputs: ["INDEX"],
        },
      ];
      blockSwitches["data_deletealloflist"] = [
        {
          opcode: "data_deleteoflist",
          createInputs: {
            INDEX: {
              shadowType: "math_integer",
              value: "1",
            },
          },
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("extension")) {
      blockSwitches["pen_penDown"] = [
        noopSwitch,
        {
          opcode: "pen_penUp",
        },
      ];
      blockSwitches["pen_penUp"] = [
        {
          opcode: "pen_penDown",
        },
        noopSwitch,
      ];
      blockSwitches["pen_setPenColorParamTo"] = [
        noopSwitch,
        {
          opcode: "pen_changePenColorParamBy",
        },
      ];
      blockSwitches["pen_changePenColorParamBy"] = [
        {
          opcode: "pen_setPenColorParamTo",
        },
        noopSwitch,
      ];
      blockSwitches["pen_setPenHueToNumber"] = [
        noopSwitch,
        {
          opcode: "pen_changePenHueBy",
        },
      ];
      blockSwitches["pen_changePenHueBy"] = [
        {
          opcode: "pen_setPenHueToNumber",
        },
        noopSwitch,
      ];
      blockSwitches["pen_setPenShadeToNumber"] = [
        noopSwitch,
        {
          opcode: "pen_changePenShadeBy",
        },
      ];
      blockSwitches["pen_changePenShadeBy"] = [
        {
          opcode: "pen_setPenShadeToNumber",
        },
        noopSwitch,
      ];
      blockSwitches["pen_setPenSizeTo"] = [
        noopSwitch,
        {
          opcode: "pen_changePenSizeBy",
        },
      ];
      blockSwitches["pen_changePenSizeBy"] = [
        {
          opcode: "pen_setPenSizeTo",
        },
        noopSwitch,
      ];
      blockSwitches["music_setTempo"] = [
        noopSwitch,
        {
          opcode: "music_changeTempo",
        },
      ];
      blockSwitches["music_changeTempo"] = [
        {
          opcode: "music_setTempo",
        },
        noopSwitch,
      ];
    }

    if (addon.settings.get("sa")) {
      const logProc = "\u200B\u200Blog\u200B\u200B %s";
      const warnProc = "\u200B\u200Bwarn\u200B\u200B %s";
      const errorProc = "\u200B\u200Berror\u200B\u200B %s";
      const logMessage = msg("debugger_log");
      const warnMessage = msg("debugger_warn");
      const errorMessage = msg("debugger_error");
      const logSwitch = {
        mutate: {
          proccode: logProc,
        },
        msg: logMessage,
      };
      const warnSwitch = {
        mutate: {
          proccode: warnProc,
        },
        msg: warnMessage,
      };
      const errorSwitch = {
        mutate: {
          proccode: errorProc,
        },
        msg: errorMessage,
      };
      procedureSwitches[logProc] = [
        {
          msg: logMessage,
          isNoop: true,
        },
        warnSwitch,
        errorSwitch,
      ];
      procedureSwitches[warnProc] = [
        logSwitch,
        {
          msg: warnMessage,
          isNoop: true,
        },
        errorSwitch,
      ];
      procedureSwitches[errorProc] = [
        logSwitch,
        warnSwitch,
        {
          msg: errorMessage,
          isNoop: true,
        },
      ];
    }

    // Switching for these is implemented by Scratch. We only define them here to optionally add a border.
    // Because we don't implement the switching ourselves, this is not controlled by the data category option.
    blockSwitches["data_variable"] = [];
    blockSwitches["data_listcontents"] = [];
  };
  buildSwitches();
  addon.settings.addEventListener("change", buildSwitches);

  /**
   * @param {*} workspace
   * @param {Element} xmlBlock
   */
  const pasteBlockXML = (workspace, xmlBlock) => {
    // Similar to https://github.com/LLK/scratch-blocks/blob/7575c9a0f2c267676569c4b102b76d77f35d9fd6/core/workspace_svg.js#L1020
    // but without the collision checking.
    const block = ScratchBlocks.Xml.domToBlock(xmlBlock, workspace);
    const x = +xmlBlock.getAttribute("x");
    const y = +xmlBlock.getAttribute("y");
    // Don't need to handle RTL here
    block.moveBy(x, y);
    return block;
  };

  /**
   * @param {string} shadowType The type of shadow eg. "math_number"
   * @returns {string} The name of the shadow's inner field that contains the user-visible value
   */
  const getShadowFieldName = (shadowType) => {
    // This is non-comprehensive.
    if (shadowType === "text") {
      return "TEXT";
    }
    if (shadowType === "colour_picker") {
      return "COLOUR";
    }
    return "NUM";
  };

  /**
   * @template T
   * @param {T|()=>T} value
   * @returns {T}
   */
  const callIfFunction = (value) => {
    if (typeof value === 'function') {
      return value();
    }
    return value;
  };

  const menuCallbackFactory = (block, opcodeData) => () => {
    if (opcodeData.isNoop) {
      return;
    }

    if (opcodeData.fieldValue) {
      block.setFieldValue(opcodeData.fieldValue, "VALUE");
      return;
    }

    try {
      ScratchBlocks.Events.setGroup(true);

      const workspace = block.workspace;

      const blocksToBringToForeground = [];
      // Split inputs before we clone the block.
      if (opcodeData.splitInputs) {
        for (const inputName of opcodeData.splitInputs) {
          const input = block.getInput(inputName);
          if (!input) {
            continue;
          }
          const connection = input.connection;
          if (!connection) {
            continue;
          }
          if (connection.isConnected()) {
            const targetBlock = connection.targetBlock();
            if (targetBlock.isShadow()) {
              // Deleting shadows is handled later.
            } else {
              connection.disconnect();
              blocksToBringToForeground.push(targetBlock);
            }
          }
        }
      }

      // Make a copy of the block with the proper type set.
      // It doesn't seem to be possible to change a Block's type after it's created, so we'll just make a new block instead.
      const xml = ScratchBlocks.Xml.blockToDom(block);
      // blockToDomWithXY's handling of RTL is strange, so we encode the position ourselves.
      const position = block.getRelativeToSurfaceXY();
      xml.setAttribute("x", position.x);
      xml.setAttribute("y", position.y);
      if (opcodeData.opcode) {
        xml.setAttribute("type", opcodeData.opcode);
      }

      const parentBlock = block.getParent();
      let parentConnection;
      let blockConnectionType;
      if (parentBlock) {
        // If the block has a parent, find the parent -> child connection that will be reattached later.
        const parentConnections = parentBlock.getConnections_();
        parentConnection = parentConnections.find(
          (c) => c.targetConnection && c.targetConnection.sourceBlock_ === block
        );
        // There's two types of connections from child -> parent. We need to figure out which one is used.
        const blockConnections = block.getConnections_();
        const blockToParentConnection = blockConnections.find(
          (c) => c.targetConnection && c.targetConnection.sourceBlock_ === parentBlock
        );
        blockConnectionType = blockToParentConnection.type;
      }

      // Array.from creates a clone of the children list. This is important as we may remove
      // children as we iterate.
      for (const child of Array.from(xml.children)) {
        const oldName = child.getAttribute("name");

        // Any inputs that were supposed to be split that were not should be removed.
        // (eg. shadow inputs)
        if (opcodeData.splitInputs && opcodeData.splitInputs.includes(oldName)) {
          xml.removeChild(child);
          continue;
        }

        const newName = opcodeData.remapInputName && opcodeData.remapInputName[oldName];
        if (newName) {
          child.setAttribute("name", newName);
        }

        const newShadowType = opcodeData.remapShadowType && opcodeData.remapShadowType[oldName];
        if (newShadowType) {
          const valueNode = child.firstChild;
          const fieldNode = valueNode.firstChild;
          valueNode.setAttribute("type", newShadowType);
          fieldNode.setAttribute("name", getShadowFieldName(newShadowType));
        }

        const fieldValueMap = opcodeData.mapFieldValues && opcodeData.mapFieldValues[oldName];
        if (fieldValueMap && child.tagName === "FIELD") {
          const oldValue = child.innerText;
          const newValue = fieldValueMap[oldValue];
          if (typeof newValue === "string") {
            child.innerText = newValue;
          }
        }
      }

      if (opcodeData.mutate) {
        const mutation = xml.querySelector("mutation");
        for (const [key, value] of Object.entries(opcodeData.mutate)) {
          mutation.setAttribute(key, value);
        }
      }

      if (opcodeData.createInputs) {
        for (const [inputName, inputData] of Object.entries(opcodeData.createInputs)) {
          const valueElement = document.createElement("value");
          valueElement.setAttribute("name", inputName);

          const shadowElement = document.createElement("shadow");
          shadowElement.setAttribute("type", inputData.shadowType);

          const shadowFieldElement = document.createElement("field");
          shadowFieldElement.setAttribute("name", getShadowFieldName(inputData.shadowType));
          shadowFieldElement.innerText = callIfFunction(inputData.value);

          shadowElement.appendChild(shadowFieldElement);
          valueElement.appendChild(shadowElement);
          xml.appendChild(valueElement);
        }
      }

      // Remove the old block and insert the new one.
      block.dispose();
      const newBlock = pasteBlockXML(workspace, xml);

      if (parentConnection) {
        // Search for the same type of connection on the new block as on the old block.
        const newBlockConnections = newBlock.getConnections_();
        const newBlockConnection = newBlockConnections.find((c) => c.type === blockConnectionType);
        newBlockConnection.connect(parentConnection);
      }

      for (const otherBlock of blocksToBringToForeground) {
        // By re-appending the element, we move it to the end, which will make it display
        // on top.
        const svgRoot = otherBlock.getSvgRoot();
        svgRoot.parentNode.appendChild(svgRoot);
      }
    } finally {
      ScratchBlocks.Events.setGroup(false);
    }
  };

  const uniques = (array) => [...new Set(array)];

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (!addon.self.disabled) {
        const type = block.type;
        let switches = blockSwitches[block.type] || [];

        const customArgsMode = addon.settings.get("customargs") ? addon.settings.get("customargsmode") : "off";
        if (
          customArgsMode !== "off" &&
          ["argument_reporter_boolean", "argument_reporter_string_number"].includes(type) &&
          // if the arg is a shadow, it's in a procedures_prototype so we don't want it to be switchable
          !block.isShadow()
        ) {
          const customBlocks = getCustomBlocks();
          if (customArgsMode === "all") {
            switch (type) {
              case "argument_reporter_string_number":
                switches = Object.values(customBlocks)
                  .map((cb) => cb.stringArgs)
                  .flat(1);
                break;
              case "argument_reporter_boolean":
                switches = Object.values(customBlocks)
                  .map((cb) => cb.boolArgs)
                  .flat(1);
                break;
            }
          } else if (customArgsMode === "defOnly") {
            const root = block.getRootBlock();
            if (root.type !== "procedures_definition") return items;
            const customBlockObj = customBlocks[root.getChildren(true)[0].getProcCode()];
            switch (type) {
              case "argument_reporter_string_number":
                switches = customBlockObj.stringArgs;
                break;
              case "argument_reporter_boolean":
                switches = customBlockObj.boolArgs;
                break;
            }
          }
          const currentValue = block.getFieldValue("VALUE");
          switches = uniques(switches).map((i) => ({
            isNoop: i === currentValue,
            fieldValue: i,
            msg: i,
          }));
        }

        if (block.type === "procedures_call") {
          const proccode = block.getProcCode();
          if (procedureSwitches[proccode]) {
            switches = procedureSwitches[proccode];
          }
        }

        if (!addon.settings.get("noop")) {
          switches = switches.filter((i) => !i.isNoop);
        }

        switches.forEach((opcodeData, i) => {
          const makeSpaceItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
          const insertBeforeIndex =
            makeSpaceItemIndex !== -1
              ? // If "make space" button exists, add own items before it
                makeSpaceItemIndex
              : // If there's no such button, insert at end
                items.length;
          const text = opcodeData.msg ? opcodeData.msg : opcodeData.opcode ? msg(opcodeData.opcode) : msg(block.type);
          items.splice(insertBeforeIndex, 0, {
            enabled: true,
            text,
            callback: menuCallbackFactory(block, opcodeData),
            separator: i === 0,
          });
        });

        if (block.type === "data_variable" || block.type === "data_listcontents") {
          // Add top border to first variable (if it exists)
          const delBlockIndex = items.findIndex((item) => item.text === ScratchBlocks.Msg.DELETE_BLOCK);
          // firstVariableItem might be undefined, a variable to switch to,
          // or an item added by editor-devtools (or any addon before this one)
          const firstVariableItem = items[delBlockIndex + 1];
          if (firstVariableItem) firstVariableItem.separator = true;
        }
      }
      return items;
    },
    { blocks: true }
  );

  // https://github.com/LLK/scratch-blocks/blob/abbfe93136fef57fdfb9a077198b0bc64726f012/blocks_vertical/procedures.js#L207-L215
  // Returns a list like ["%s", "%d"]
  const parseArguments = (code) =>
    code
      .split(/(?=[^\\]%[nbs])/g)
      .map((i) => i.trim())
      .filter((i) => i.charAt(0) === "%")
      .map((i) => i.substring(0, 2));

  const getCustomBlocks = () => {
    const customBlocks = {};
    const target = vm.editingTarget;
    Object.values(target.blocks._blocks)
      .filter((block) => block.opcode === "procedures_prototype")
      .forEach((block) => {
        const procCode = block.mutation.proccode;
        const argumentNames = JSON.parse(block.mutation.argumentnames);
        // argumentdefaults is unreliable, so we have to parse the procedure code to determine argument types
        const parsedArguments = parseArguments(procCode);
        const stringArgs = [];
        const boolArgs = [];
        for (let i = 0; i < argumentNames.length; i++) {
          if (parsedArguments[i] === "%b") {
            boolArgs.push(argumentNames[i]);
          } else {
            stringArgs.push(argumentNames[i]);
          }
        }
        customBlocks[procCode] = {
          stringArgs,
          boolArgs,
        };
      });
    return customBlocks;
  };
}
