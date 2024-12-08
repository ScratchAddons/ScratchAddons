export default async function ({ addon, console }) {
  const blockly = await addon.tab.traps.getBlockly();

  const dropdownSanitizations = [
    { searchValue: "\\", replacer: "\\\\" },
    { searchValue: /^\/scratchblocks$/g, replacer: "\\/scratchblocks" },
    { searchValue: "]", replacer: "\\]" },
  ];

  const strInpSanitizations = [...dropdownSanitizations, { searchValue: / v$/g, replacer: " \\v" }];

  const blockSanitizations = [
    { searchValue: "\\", replacer: "\\\\" },
    { searchValue: "::", replacer: ":\\:" },
    { searchValue: "[", replacer: "\\[" },
    { searchValue: "(", replacer: "\\(" },
    { searchValue: "<", replacer: "\\<" },
    { searchValue: "{", replacer: "\\{" },
    { searchValue: "[/scratchblocks]", replacer: "[\\/scratchblocks]" },
    { searchValue: /^define[^ ]/g, replacer: "define\\" },
    { searchValue: /^define$/g, replacer: "define​" }, // putting a zwsp here is the only option
    { searchValue: /@(?=greenFlag|stopSign|turnLeft|turnRight|loopArrow|addInput|delInput|list)/g, replacer: "\\@" },
    { searchValue: "//", replacer: "\\//" },
  ];

  const repSanitizations = [...blockSanitizations, { searchValue: ")", replacer: "\\)" }];

  const blocks = {};

  // INPUTS
  blocks["math_angle"] =
    blocks["math_integer"] =
    blocks["math_whole_number"] =
    blocks["math_positive_number"] =
    blocks["math_number"] =
    blocks["note"] =
      {
        func: (block) => {
          const content = block.getFieldValue("NUM");
          return /^[0-9e.-]*$/.test(content) ? ["(", content, ")"] : ["[", sanitize(content, strInpSanitizations), "]"];
        },
      };
  // blocks["math_angle"] = blocks["math_number"];
  // blocks["math_integer"] = blocks["math_number"];
  // blocks["math_whole_number"] = blocks["math_number"];
  // blocks["math_positive_number"] = blocks["math_number"];
  blocks["text"] = ["[", { field: "TEXT", sanitizations: strInpSanitizations }, "]"];
  blocks["colour_picker"] = ["[", { field: "COLOUR" }, "]"];

  // MOTION
  blocks["motion_movesteps"] = ["move ", { input: "STEPS" }, " steps"];
  blocks["motion_turnright"] = ["turn right ", { input: "DEGREES" }, " degrees"];
  blocks["motion_turnleft"] = ["turn left ", { input: "DEGREES" }, " degrees"];
  blocks["motion_pointindirection"] = ["point in direction ", { input: "DIRECTION" }];
  blocks["motion_pointtowards_menu"] = ["(", { field: "TOWARDS", sanitizations: repSanitizations }, " v)"];
  blocks["motion_pointtowards"] = ["point towards ", { input: "TOWARDS" }];
  blocks["motion_goto_menu"] = ["(", { field: "TO", sanitizations: repSanitizations }, " v)"];
  blocks["motion_gotoxy"] = ["go to x: ", { input: "X" }, " y: ", { input: "Y" }];
  blocks["motion_goto"] = ["go to ", { input: "TO" }];
  blocks["motion_glidesecstoxy"] = [
    "glide ",
    { input: "SECS" },
    " secs to x: ",
    { input: "X" },
    " y: ",
    { input: "Y" },
  ];
  blocks["motion_glideto_menu"] = ["(", { field: "TO", sanitizations: repSanitizations }, " v)"];
  blocks["motion_glideto"] = ["glide ", { input: "SECS" }, " secs to ", { input: "TO" }];
  blocks["motion_changexby"] = ["change x by ", { input: "DX" }];
  blocks["motion_setx"] = ["set x to ", { input: "X" }];
  blocks["motion_changeyby"] = ["change y by ", { input: "DY" }];
  blocks["motion_sety"] = ["set y to ", { input: "Y" }];
  blocks["motion_ifonedgebounce"] = ["if on edge, bounce"];
  blocks["motion_setrotationstyle"] = ["set rotation style ", { field: "STYLE", dropdown: true }];
  blocks["motion_xposition"] = ["(x position", { override: "motion" }, ")"];
  blocks["motion_yposition"] = ["(y position", { override: "motion" }, ")"];
  blocks["motion_direction"] = ["(direction", { override: "motion" }, ")"];
  blocks["motion_scroll_right"] = ["scroll right", { input: "DISTANCE" }, " :: motion"]; // obsolete
  blocks["motion_scroll_up"] = ["scroll up", { input: "DISTANCE" }, " :: motion"]; // obsolete
  blocks["motion_align_scene"] = ["align scene ", { field: "ALIGNMENT", dropdown: true }, " :: motion"]; // obsolete
  blocks["motion_xscroll"] = ["(x scroll :: motion)"]; // obsolete
  blocks["motion_yscroll"] = ["(y scroll :: motion)"]; // obsolete

  // LOOKS
  blocks["looks_sayforsecs"] = ["say ", { input: "MESSAGE" }, " for ", { input: "SECS" }, " seconds"];
  blocks["looks_say"] = ["say ", { input: "MESSAGE" }];
  blocks["looks_thinkforsecs"] = ["think ", { input: "MESSAGE" }, " for ", { input: "SECS" }, " seconds"];
  blocks["looks_think"] = ["think ", { input: "MESSAGE" }];
  blocks["looks_show"] = ["show"];
  blocks["looks_hide"] = ["hide"];
  blocks["looks_hideallsprites"] = ["hide all sprites :: looks"]; // obsolete
  blocks["looks_changeeffectby"] = ["change ", { field: "EFFECT", dropdown: true }, " effect by ", { input: "CHANGE" }];
  blocks["looks_seteffectto"] = ["set ", { field: "EFFECT", dropdown: true }, " effect to ", { input: "VALUE" }];
  blocks["looks_cleargraphiceffects"] = ["clear graphic effects"];
  blocks["looks_changesizeby"] = ["change size by ", { input: "CHANGE" }];
  blocks["looks_setsizeto"] = ["set size to ", { input: "SIZE" }, " %"];
  blocks["looks_size"] = ["(size", { override: "looks" }, ")"];
  blocks["looks_costume"] = ["(", { field: "COSTUME", sanitizations: repSanitizations }, " v)"];
  blocks["looks_switchcostumeto"] = ["switch costume to ", { input: "COSTUME" }];
  blocks["looks_nextcostume"] = ["next costume"];
  blocks["looks_switchbackdropto"] = ["switch backdrop to ", { input: "BACKDROP" }];
  blocks["looks_backdrops"] = ["(", { field: "BACKDROP", sanitizations: repSanitizations }, " v)"];
  blocks["looks_gotofrontback"] = ["go to ", { field: "FRONT_BACK", dropdown: true }, " layer"];
  blocks["looks_goforwardbackwardlayers"] = [
    "go ",
    { field: "FORWARD_BACKWARD", dropdown: true },
    " ",
    { input: "NUM" },
    " layers",
  ];
  blocks["looks_backdropnumbername"] = ["(backdrop ", { field: "NUMBER_NAME", dropdown: true }, ")"];
  blocks["looks_costumenumbername"] = ["(costume ", { field: "NUMBER_NAME", dropdown: true }, ")"];
  blocks["looks_switchbackdroptoandwait"] = ["switch backdrop to ", { input: "BACKDROP" }, " and wait"];
  blocks["looks_nextbackdrop"] = ["next backdrop"];

  // SOUND
  blocks["sound_sounds_menu"] = ["(", { field: "SOUND_MENU", sanitizations: repSanitizations }, " v)"];
  blocks["sound_play"] = ["start sound ", { input: "SOUND_MENU" }];
  blocks["sound_playuntildone"] = ["play sound ", { input: "SOUND_MENU" }, " until done"];
  blocks["sound_stopallsounds"] = ["stop all sounds"];
  blocks["sound_seteffectto"] = ["set ", { field: "EFFECT", dropdown: true }, " effect to ", { input: "VALUE" }];
  blocks["sound_changeeffectby"] = ["change ", { field: "EFFECT", dropdown: true }, " effect by ", { input: "VALUE" }];
  blocks["sound_cleareffects"] = ["clear sound effects"];
  blocks["sound_changevolumeby"] = ["change volume by ", { input: "VOLUME" }];
  blocks["sound_setvolumeto"] = ["set volume to ", { input: "VOLUME" }, " %"];
  blocks["sound_volume"] = ["(volume", { override: "sound" }, ")"];

  // EVENTS
  blocks["event_whentouchingobject"] = ["when this sprite touches ", { input: "TOUCHINGOBJECTMENU" }];
  blocks["event_touchingobjectmenu"] = ["(", { field: "TOUCHINGOBJECTMENU", sanitizations: repSanitizations }, " v)"];
  blocks["event_whenflagclicked"] = ["when green flag clicked"];
  blocks["event_whenthisspriteclicked"] = ["when this sprite clicked"];
  blocks["event_whenstageclicked"] = ["when stage clicked"];
  blocks["event_whenbroadcastreceived"] = ["when I receive ", { field: "BROADCAST_OPTION", dropdown: true }];
  blocks["event_whenbackdropswitchesto"] = ["when backdrop switches to ", { field: "BACKDROP", dropdown: true }];
  blocks["event_whengreaterthan"] = [
    "when ",
    { field: "WHENGREATERTHANMENU", dropdown: true },
    " > ",
    { input: "VALUE" },
  ];
  blocks["event_broadcast_menu"] = ["(", { field: "BROADCAST_OPTION", sanitizations: repSanitizations }, " v)"];
  blocks["event_broadcast"] = ["broadcast ", { input: "BROADCAST_INPUT" }];
  blocks["event_broadcastandwait"] = ["broadcast ", { input: "BROADCAST_INPUT" }, " and wait"];
  blocks["event_whenkeypressed"] = ["when ", { field: "KEY_OPTION", dropdown: true }, " key pressed"];

  // CONTROL
  blocks["control_forever"] = ["forever\n", { input: "SUBSTACK", substack: true }, "end"];
  blocks["control_repeat"] = ["repeat ", { input: "TIMES" }, "\n", { input: "SUBSTACK", substack: true }, "end"];
  blocks["control_if"] = [
    "if ",
    { input: "CONDITION", boolean: true },
    " then\n",
    { input: "SUBSTACK", substack: true },
    "end",
  ];
  blocks["control_if_else"] = [
    "if ",
    { input: "CONDITION", boolean: true },
    " then\n",
    { input: "SUBSTACK", substack: true },
    "else\n",
    { input: "SUBSTACK2", substack: true },
    "end",
  ];
  blocks["control_stop"] = ["stop ", { field: "STOP_OPTION", dropdown: true }];
  blocks["control_wait"] = ["wait ", { input: "DURATION" }, " seconds"];
  blocks["control_wait_until"] = ["wait until ", { input: "CONDITION", boolean: true }];
  blocks["control_repeat_until"] = [
    "repeat until ",
    { input: "CONDITION", boolean: true },
    "\n",
    { input: "SUBSTACK", substack: true },
    "end",
  ];
  // obsolete
  blocks["control_while"] = [
    "while ",
    { input: "CONDITION", boolean: true },
    " {\n",
    { input: "SUBSTACK", substack: true },
    "} @loopArrow :: control",
  ];
  // obsolete
  blocks["control_for_each"] = [
    "for each ",
    { field: "VARIABLE", dropdown: true },
    " in ",
    { input: "VALUE" },
    " {\n",
    { input: "SUBSTACK", substack: true },
    "} @loopArrow :: control",
  ];
  blocks["control_start_as_clone"] = ["when I start as a clone"];
  blocks["control_create_clone_of_menu"] = ["(", { field: "CLONE_OPTION", sanitizations: repSanitizations }, " v)"];
  blocks["control_create_clone_of"] = ["create clone of ", { input: "CLONE_OPTION" }];
  blocks["control_delete_this_clone"] = ["delete this clone"];
  blocks["control_get_counter"] = ["(counter :: control)"]; // obsolete
  blocks["control_incr_counter"] = ["increment counter :: control"]; // obsolete
  blocks["control_clear_counter"] = ["clear counter :: control"]; // obsolete
  blocks["control_all_at_once"] = ["all at once {\n", { input: "SUBSTACK" }, "} :: control"]; // obsolete

  // SENSING
  blocks["sensing_touchingobject"] = ["<touching ", { input: "TOUCHINGOBJECTMENU" }, " ?>"];
  blocks["sensing_touchingobjectmenu"] = ["(", { field: "TOUCHINGOBJECTMENU", sanitizations: repSanitizations }, " v)"];
  blocks["sensing_touchingcolor"] = ["<touching color ", { input: "COLOR" }, " ?>"];
  blocks["sensing_coloristouchingcolor"] = ["<colour ", { input: "COLOR" }, " is touching ", { input: "COLOR" }, " ?>"];
  blocks["sensing_distanceto"] = ["(distance to ", { input: "DISTANCETOMENU" }, ")"];
  blocks["sensing_distancetomenu"] = ["(", { field: "DISTANCETOMENU", sanitizations: repSanitizations }, " v)"];
  blocks["sensing_askandwait"] = ["ask ", { input: "QUESTION" }, " and wait"];
  blocks["sensing_answer"] = ["(answer", { override: "sensing" }, ")"];
  blocks["sensing_keypressed"] = ["key ", { input: "KEY_OPTION" }, " pressed"];
  blocks["sensing_keyoptions"] = ["(", { field: "KEY_OPTION", sanitizations: repSanitizations }, " v)"];
  blocks["sensing_mousedown"] = ["<mouse down?", { override: "sensing" }, ">"];
  blocks["sensing_mousex"] = ["(mouse x", { override: "sensing" }, ")"];
  blocks["sensing_mousey"] = ["(mouse y", { override: "sensing" }, ")"];
  blocks["sensing_setdragmode"] = ["set drag mode ", { field: "DRAG_MODE", dropdown: true }];
  blocks["sensing_loudness"] = ["(loudness", { override: "sensing" }, ")"];
  blocks["sensing_loud"] = ["<loud :: sensing>"]; // obsolete
  blocks["sensing_timer"] = ["(timer", { override: "sensing" }, ")"];
  blocks["sensing_resettimer"] = ["reset timer"];
  blocks["sensing_of_object_menu"] = ["(", { field: "OBJECT", sanitizations: repSanitizations }, " v)"];
  blocks["sensing_of"] = ["(", { field: "PROPERTY", dropdown: true }, " of ", { input: "OBJECT" }, ")"];
  blocks["sensing_current"] = ["(current ", { field: "CURRENTMENU", dropdown: true }, ")"];
  blocks["sensing_dayssince2000"] = ["(days since 2000", { override: "sensing" }, ")"];
  blocks["sensing_username"] = ["(username", { override: "sensing" }, ")"];
  blocks["sensing_userid"] = ["(user id", { override: "sensing" }, ")"]; // obsolete

  // OPERATORS
  blocks["operator_add"] = ["(", { input: "NUM1" }, " + ", { input: "NUM2" }, ")"];
  blocks["operator_subtract"] = ["(", { input: "NUM1" }, " - ", { input: "NUM2" }, ")"];
  blocks["operator_multiply"] = ["(", { input: "NUM1" }, " * ", { input: "NUM2" }, ")"];
  blocks["operator_divide"] = ["(", { input: "NUM1" }, " / ", { input: "NUM2" }, ")"];
  blocks["operator_random"] = ["(pick random ", { input: "FROM" }, " to ", { input: "TO" }];
  blocks["operator_lt"] = ["<", { input: "OPERAND1" }, " < ", { input: "OPERAND2" }, ">"];
  blocks["operator_equals"] = ["<", { input: "OPERAND1" }, " = ", { input: "OPERAND2" }, ">"];
  blocks["operator_gt"] = ["<", { input: "OPERAND1" }, " > ", { input: "OPERAND2" }, ">"];
  blocks["operator_and"] = ["<", { input: "OPERAND1" }, " and ", { input: "OPERAND2" }, ">"];
  blocks["operator_or"] = ["<", { input: "OPERAND1" }, " or ", { input: "OPERAND2" }, ">"];
  blocks["operator_lt"] = ["<not ", { input: "OPERAND" }, ">"];
  blocks["operator_join"] = ["(join ", { input: "STRING1" }, " ", { input: "STRING2" }, ")"];
  blocks["operator_letter_of"] = ["(letter ", { input: "LETTER" }, " of ", { input: "STRING" }, ")"];
  blocks["operator_length"] = ["(length of ", { input: "STRING" }, ")"];
  blocks["operator_contains"] = ["<", { input: "STRING1" }, " contains ", { input: "STRING2" }, " ?>"];
  blocks["operator_mod"] = ["(", { input: "NUM1" }, " mod ", { input: "NUM2" }, ")"];
  blocks["operator_round"] = ["(round ", { input: "NUM" }, ")"];
  blocks["operator_mathop"] = ["(", { field: "OPERATOR", dropdown: true }, " of ", { input: "NUM" }, ")"];

  // DATA
  blocks["data_variable"] = [
    "(",
    {
      field: "VARIABLE",
      sanitizations: repSanitizations,
    },
    { override: "variables" },
    ")",
  ];
  blocks["data_setvariableto"] = ["set ", { field: "VARIABLE", dropdown: true }, " to ", { input: "VALUE" }];
  blocks["data_changevariableby"] = ["change ", { field: "VARIABLE", dropdown: true }, " by ", { input: "VALUE" }];
  blocks["data_showvariable"] = ["show variable ", { field: "VARIABLE", dropdown: true }];
  blocks["data_showvariable"] = ["hide variable ", { field: "VARIABLE", dropdown: true }];
  blocks["data_listcontents"] = ["(", { field: "LIST", sanitizations: repSanitizations }, { override: "list" }, ")"];
  blocks["data_listindexall"] = blocks["data_listindexrandom"] = [
    "(",
    { field: "INDEX", sanitizations: repSanitizations },
    " v)",
  ];
  blocks["data_addtolist"] = ["add ", { input: "ITEM" }, " to ", { field: "LIST", dropdown: true }];
  blocks["data_deleteoflist"] = ["delete ", { input: "INDEX" }, " of ", { field: "LIST", dropdown: true }];
  blocks["data_deletealloflist"] = ["delete all of ", { field: "LIST", dropdown: true }];
  blocks["data_insertatlist"] = [
    "insert ",
    { input: "ITEM" },
    " at ",
    { input: "INDEX" },
    " of ",
    { field: "LIST", dropdown: true },
  ];
  blocks["data_replaceitemoflist"] = [
    "replace item ",
    { input: "INDEX" },
    " of ",
    { field: "LIST", dropdown: true },
    " with ",
    { input: "ITEM" },
  ];
  blocks["data_itemoflist"] = ["(item ", { input: "INDEX" }, " of ", { field: "LIST", dropdown: true }, ")"];
  blocks["data_itemnumoflist"] = ["(item # of ", { input: "ITEM" }, " in ", { field: "LIST", dropdown: true }, ")"];
  blocks["data_lengthoflist"] = ["(length of ", { field: "LIST", dropdown: true }, ")"];
  blocks["data_listcontainsitem"] = ["<", { field: "LIST", dropdown: true }, " contains ", { input: "ITEM" }, ">"];
  blocks["data_showlist"] = ["show list ", { field: "LIST", dropdown: true }];
  blocks["data_hidelist"] = ["hide list ", { field: "LIST", dropdown: true }];

  // PROCEDURES
  blocks["procedures_definition"] = ["define ", { input: "custom_block" }];
  blocks["procedures_call"] = blocks["procedures_prototype"] = {
    func: (block) => {
      let output = [],
        argumentCount = 0;

      for (const component of block.getProcCode().split(/(?<!\\)(%[nbs])/)) {
        if (/^%[nbs]/.test(component.trim())) {
          output.push({ input: block.argumentIds_[argumentCount] });
          argumentCount++;
        } else {
          const sanitizations = [
            { searchValue: "\\%", replacer: "%" },
            ...blockSanitizations,
            { searchValue: /^ {2,}| {2,}$/g, replacer: " " },
          ];
          output.push(sanitize(component, sanitizations));
        }
      }

      output.push({ override: "custom" });
      return output;
    },
  };
  blocks["argument_reporter_string_number"] = [
    "(",
    { field: "VALUE", sanitizations: repSanitizations },
    { override: "custom" },
    ")",
  ];
  blocks["argument_reporter_boolean"] = [
    "<",
    { field: "VALUE", sanitizations: repSanitizations },
    { override: "custom" },
    ">",
  ];

  // PEN
  blocks["pen_clear"] = ["erase all"];
  blocks["pen_stamp"] = ["stamp"];
  blocks["pen_penDown"] = ["pen down"];
  blocks["pen_penUp"] = ["pen up"];
  blocks["pen_setPenColorToColor"] = ["set pen color to ", { input: "COLOR" }];
  blocks["pen_changePenColorParamBy"] = ["change pen ", { input: "COLOR_PARAM" }, " by ", { input: "VALUE" }];
  blocks["pen_setPenColorParamTo"] = ["set pen ", { input: "COLOR_PARAM" }, " to ", { input: "VALUE" }];
  blocks["pen_changePenSizeBy"] = ["change pen size by ", { input: "SIZE" }];
  blocks["pen_setPenSizeTo"] = ["set pen size to ", { input: "SIZE" }];

  // MUSIC
  blocks["music_playDrumForBeats"] = ["play drum ", { input: "DRUM" }, " for ", { input: "BEATS" }, " beats"];
  blocks["music_restForBeats"] = ["rest for ", { input: "BEATS" }, " beats"];
  blocks["music_restForBeats"] = ["play note ", { input: "NOTE" }, " for ", { input: "BEATS" }, " beats"];
  blocks["music_setTempo"] = ["set tempo to ", {input: "TEMPO"}];
  blocks["music_changeTempo"] = ["change tempo by ", {input: "TEMPO"}];
  blocks["music_getTempo"] = ["(tempo", {override: "MUSIC"}, ")"];

  function sanitize(text, sanitizations) {
    for (const sanitization of sanitizations) text = text.replaceAll(sanitization.searchValue, sanitization.replacer);
    return text;
  }

  function getBlockCode(block, script, procArgs) {
    const blockData = blocks[block.type];
    if (!blockData) return "";

    const components = (blockData.func && blockData.func(block)) ?? blockData;
    let output = "";

    for (const component of components) {
      if (component.input) {
        const inputConnection = block.getInput(component.input).connection;
        const inputBlock = inputConnection.targetBlock();
        if (inputBlock) {
          if (inputBlock.substack) {
            output += getBlockCode(inputBlock, true).replaceAll(/^/gm, "   ");
            output += "\n";
          } else {
            output += getBlockCode(inputBlock);
          }
        } else if (component.boolean) {
          output += "<>";
        }
      } else if (component.field) {
        const text = block.getField(component.field).getText();
        if (component.dropdown) {
          output += `[${sanitize(text, dropdownSanitizations)} v]`;
        } else {
          output += component.sanitizations ? sanitize(text, component.sanitizations) : text;
        }
      } else if (component.override) {
        // TODO
      } else {
        output += component;
      }
    }

    if (script) {
      const nextBlock = block.getNextBlock();
      if (nextBlock) {
        output += "\n";
        output += getBlockCode(nextBlock, true);
      }
    }

    return output.trim();
  }

  addon.tab.createBlockContextMenu(
    (items) => {
      items.push({
        enabled: true,
        text: "Copy scripts as scratchblocks",
        callback: () => {
          const topBlocks = blockly.getMainWorkspace().getTopBlocks();
          console.log(topBlocks);
        },
        separator: true,
      });

      return items;
    },
    { workspace: true }
  );

  addon.tab.createBlockContextMenu(
    (items, block) => {
      items.push(
        {
          enabled: true,
          text: "Log block",
          callback: () => {
            console.log(block);
          },
          separator: true,
        },
        {
          enabled: true,
          text: "Log input names",
          callback: () => {
            console.log(block.inputList.map((input) => input.name));
          },
        },
        {
          enabled: true,
          text: "Log block code",
          callback: () => console.log(block.type),
        },
        {
          enabled: true,
          text: "Log block scratchblocks",
          callback: () => console.log(getBlockCode(block)),
          separator: true,
        },
        {
          enabled: block.getPreviousBlock() || block.getNextBlock(),
          text: "Log script scratchblocks",
          callback: () => console.log(getBlockCode(block.getRootBlock(), true)),
        }
      );

      return items;
    },
    { blocks: true, flyout: true }
  );
}
