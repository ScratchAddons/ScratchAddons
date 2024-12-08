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
      (block) => {
        const content = block.getFieldValue("NUM");
        return /^[0-9e.-]*$/.test(content) ? `(${content})` : `[${sanitize(content, strInpSanitizations)}]`;
      };
  blocks["text"] = (b) => process(b)`[${{ field: "TEXT", sanitizations: strInpSanitizations }}]`;
  blocks["colour_picker"] = (b) => process(b)`[${{ field: "COLOUR", sanitizations: strInpSanitizations }}]`;

  // MOTION
  blocks["motion_movesteps"] = (b) => process(b)`move ${{ input: "STEPS" }} steps`;
  blocks["motion_turnright"] = (b) => process(b)`turn right ${{ input: "DEGREES" }} degrees`;
  blocks["motion_turnleft"] = (b) => process(b)`turn left ${{ input: "DEGREES" }} degrees`;
  blocks["motion_pointindirection"] = (b) => process(b)`point in direction ${{ input: "DIRECTION" }}`;
  blocks["motion_pointtowards_menu"] = (b) => process(b)`(${{ field: "TOWARDS", sanitizations: repSanitizations }} v)`;
  blocks["motion_pointtowards"] = (b) => process(b)`point towards ${{ input: "TOWARDS" }}`;
  blocks["motion_goto_menu"] = (b) => process(b)`(${{ field: "TO", sanitizations: repSanitizations }} v)`;
  blocks["motion_gotoxy"] = (b) => process(b)`go to x: ${{ input: "X" }} y: ${{ input: "Y" }}`;
  blocks["motion_goto"] = (b) => process(b)`go to ${{ input: "TO" }}`;
  blocks["motion_glidesecstoxy"] = (b) =>
    process(b)`glide ${{ input: "SECS" }} secs to x: ${{ input: "X" }} y: ${{ input: "Y" }}`;
  blocks["motion_glideto_menu"] = (b) => process(b)`(${{ field: "TO", sanitizations: repSanitizations }} v)`;
  blocks["motion_glideto"] = (b) => process(b)`glide ${{ input: "SECS" }} secs to ${{ input: "TO" }}`;
  blocks["motion_changexby"] = (b) => process(b)`change x by ${{ input: "DX" }}`;
  blocks["motion_setx"] = (b) => process(b)`set x to ${{ input: "X" }}`;
  blocks["motion_changeyby"] = (b) => process(b)`change y by ${{ input: "DY" }}`;
  blocks["motion_sety"] = (b) => process(b)`set y to ${{ input: "Y" }}`;
  blocks["motion_ifonedgebounce"] = (b) => process(b)`if on edge, bounce`;
  blocks["motion_setrotationstyle"] = (b) =>
    process(b)`set rotation style [${{ field: "STYLE", blockSanitizations: dropdownSanitizations }} v]`;
  blocks["motion_xposition"] = (b) => process(b)`(x position${{ override: "motion" }})`;
  blocks["motion_yposition"] = (b) => process(b)`(y position${{ override: "motion" }})`;
  blocks["motion_direction"] = (b) => process(b)`(direction${{ override: "motion" }})`;
  blocks["motion_scroll_right"] = (b) => process(b)`scroll right ${{ input: "DISTANCE" }} :: motion`; // obsolete
  blocks["motion_scroll_up"] = (b) => process(b)`scroll up ${{ input: "DISTANCE" }} :: motion`; // obsolete
  blocks["motion_align_scene"] = (b) =>
    process(b)`align scene [${{ field: "ALIGNMENT", sanitizations: dropdownSanitizations }} v] :: motion`;
  blocks["motion_xscroll"] = (b) => process(b)`(x scroll :: motion)`; // obsolete
  blocks["motion_yscroll"] = (b) => process(b)`(y scroll :: motion)`; // obsolete

  // LOOKS
  blocks["looks_sayforsecs"] = (b) => process(b)`say ${{ input: "MESSAGE" }} for ${{ input: "SECS" }} seconds`;
  blocks["looks_say"] = (b) => process(b)`say ${{ input: "MESSAGE" }}`;
  blocks["looks_thinkforsecs"] = (b) => process(b)`think ${{ input: "MESSAGE" }} for ${{ input: "SECS" }} seconds`;
  blocks["looks_think"] = (b) => process(b)`think ${{ input: "MESSAGE" }}`;
  blocks["looks_show"] = (b) => process(b)`show`;
  blocks["looks_hide"] = (b) => process(b)`hide`;
  blocks["looks_hideallsprites"] = (b) => process(b)`hide all sprites :: looks`; // obsolete
  blocks["looks_changeeffectby"] = (b) =>
    process(b)`change [${{ field: "EFFECT", dropdown: true }} v] effect by ${{ input: "CHANGE" }}`;
  blocks["looks_seteffectto"] = (b) =>
    process(b)`set [${{ field: "EFFECT", dropdown: true }} v] effect to ${{ input: "VALUE" }}`;
  blocks["looks_cleargraphiceffects"] = (b) => process(b)`clear graphic effects`;
  blocks["looks_changesizeby"] = (b) => process(b)`change size by ${{ input: "CHANGE" }}`;
  blocks["looks_setsizeto"] = (b) => process(b)`set size to ${{ input: "SIZE" }} %`;
  blocks["looks_size"] = (b) => process(b)`(size${{ override: "looks" }})`;
  blocks["looks_costume"] = (b) => process(b)`(${{ field: "COSTUME", sanitizations: repSanitizations }} v)`;
  blocks["looks_switchcostumeto"] = (b) => process(b)`switch costume to ${{ input: "COSTUME" }}`;
  blocks["looks_nextcostume"] = (b) => process(b)`next costume`;
  blocks["looks_switchbackdropto"] = (b) => process(b)`switch backdrop to ${{ input: "BACKDROP" }}`;
  blocks["looks_backdrops"] = (b) => process(b)`(${{ field: "BACKDROP", sanitizations: repSanitizations }} v)`;
  blocks["looks_gotofrontback"] = (b) => process(b)`go to [${{ field: "FRONT_BACK", dropdown: true }} v] layer`;
  blocks["looks_goforwardbackwardlayers"] = (b) =>
    process(b)`go [${{ field: "FORWARD_BACKWARD", dropdown: true }} v] ${{ input: "NUM" }} layers`;
  blocks["looks_backdropnumbername"] = (b) => process(b)`(backdrop [${{ field: "NUMBER_NAME", dropdown: true }} v])`;
  blocks["looks_costumenumbername"] = (b) => process(b)`(costume [${{ field: "NUMBER_NAME", dropdown: true }} v])`;
  blocks["looks_switchbackdroptoandwait"] = (b) => process(b)`switch backdrop to ${{ input: "BACKDROP" }} and wait`;
  blocks["looks_nextbackdrop"] = (b) => process(b)`next backdrop`;

  // SOUND
  blocks["sound_sounds_menu"] = (b) => process(b)`(${{ field: "SOUND_MENU", sanitizations: repSanitizations }} v)`;
  blocks["sound_play"] = (b) => process(b)`start sound ${{ input: "SOUND_MENU" }}`;
  blocks["sound_playuntildone"] = (b) => process(b)`play sound ${{ input: "SOUND_MENU" }} until done`;
  blocks["sound_stopallsounds"] = (b) => process(b)`stop all sounds`;
  blocks["sound_seteffectto"] = (b) =>
    process(b)`set [${{ field: "EFFECT", dropdown: true }} v] effect to ${{ input: "VALUE" }}`;
  blocks["sound_changeeffectby"] = (b) =>
    process(b)`change [${{ field: "EFFECT", dropdown: true }} v] effect by ${{ input: "VALUE" }}`;
  blocks["sound_cleareffects"] = (b) => process(b)`clear sound effects`;
  blocks["sound_changevolumeby"] = (b) => process(b)`change volume by ${{ input: "VOLUME" }}`;
  blocks["sound_setvolumeto"] = (b) => process(b)`set volume to ${{ input: "VOLUME" }} %`;
  blocks["sound_volume"] = (b) => process(b)`(volume${{ override: "sound" }})`;

  // EVENTS
  blocks["event_whentouchingobject"] = (b) => process(b)`when this sprite touches ${{ input: "TOUCHINGOBJECTMENU" }}`;
  blocks["event_touchingobjectmenu"] = (b) =>
    process(b)`(${{ field: "TOUCHINGOBJECTMENU", sanitizations: repSanitizations }} v)`;
  blocks["event_whenflagclicked"] = (b) => process(b)`when green flag clicked`;
  blocks["event_whenthisspriteclicked"] = (b) => process(b)`when this sprite clicked`;
  blocks["event_whenstageclicked"] = (b) => process(b)`when stage clicked`;
  blocks["event_whenbroadcastreceived"] = (b) =>
    process(b)`when I receive [${{ field: "BROADCAST_OPTION", dropdown: true }} v]`;
  blocks["event_whenbackdropswitchesto"] = (b) =>
    process(b)`when backdrop switches to [${{ field: "BACKDROP", dropdown: true }} v]`;
  blocks["event_whengreaterthan"] = (b) =>
    process(b)`when [${{ field: "WHENGREATERTHANMENU", dropdown: true }} v] > ${{ input: "VALUE" }}`;
  blocks["event_broadcast_menu"] = (b) =>
    process(b)`(${{ field: "BROADCAST_OPTION", sanitizations: repSanitizations }} v)`;
  blocks["event_broadcast"] = (b) => process(b)`broadcast ${{ input: "BROADCAST_INPUT" }}`;
  blocks["event_broadcastandwait"] = (b) => process(b)`broadcast ${{ input: "BROADCAST_INPUT" }} and wait`;
  blocks["event_whenkeypressed"] = (b) => process(b)`when [${{ field: "KEY_OPTION", dropdown: true }} v] key pressed`;

  // CONTROL
  blocks["control_forever"] = (b) => process(b)`forever\n${{ input: "SUBSTACK", substack: true }}end`;
  blocks["control_repeat"] = (b) =>
    process(b)`repeat ${{ input: "TIMES" }}\n${{ input: "SUBSTACK", substack: true }}end`;
  blocks["control_if"] = (b) =>
    process(b)`if ${{ input: "CONDITION", boolean: true }} then\n${{ input: "SUBSTACK", substack: true }}end`;
  blocks["control_if_else"] = (b) =>
    process(
      b
    )`if ${{ input: "CONDITION", boolean: true }} then\n${{ input: "SUBSTACK", substack: true }}else\n${{ input: "SUBSTACK2", substack: true }}end`;
  blocks["control_stop"] = (b) => process(b)`stop [${{ field: "STOP_OPTION", dropdown: true }} v]`;
  blocks["control_wait"] = (b) => process(b)`wait ${{ input: "DURATION" }} seconds`;
  blocks["control_wait_until"] = (b) => process(b)`wait until ${{ input: "CONDITION", boolean: true }}`;
  blocks["control_repeat_until"] = (b) =>
    process(b)`repeat until ${{ input: "CONDITION", boolean: true }}\n${{ input: "SUBSTACK", substack: true }}end`;
  // obsolete
  blocks["control_while"] = (b) =>
    process(
      b
    )`while ${{ input: "CONDITION", boolean: true }} {\n${{ input: "SUBSTACK", substack: true }}} @loopArrow :: control`;
  // obsolete
  blocks["control_for_each"] = (b) =>
    process(
      b
    )`for each [${{ field: "VARIABLE", dropdown: true }} v] in ${{ input: "VALUE" }} {\n${{ input: "SUBSTACK", substack: true }}} @loopArrow :: control`;
  blocks["control_start_as_clone"] = (b) => process(b)`when I start as a clone`;
  blocks["control_create_clone_of_menu"] = (b) =>
    process(b)`(${{ field: "CLONE_OPTION", sanitizations: repSanitizations }} v)`;
  blocks["control_create_clone_of"] = (b) => process(b)`create clone of ${{ input: "CLONE_OPTION" }}`;
  blocks["control_delete_this_clone"] = (b) => process(b)`delete this clone`;
  blocks["control_get_counter"] = (b) => process(b)`(counter :: control)`; // obsolete
  blocks["control_incr_counter"] = (b) => process(b)`increment counter :: control`; // obsolete
  blocks["control_clear_counter"] = (b) => process(b)`clear counter :: control`; // obsolete
  blocks["control_all_at_once"] = (b) => process(b)`all at once {\n${{ input: "SUBSTACK" }}} :: control`; // obsolete

  // SENSING
  blocks["sensing_touchingobject"] = (b) => process(b)`<touching ${{ input: "TOUCHINGOBJECTMENU" }} ?>`;
  blocks["sensing_touchingobjectmenu"] = (b) =>
    process(b)`(${{ field: "TOUCHINGOBJECTMENU", sanitizations: repSanitizations }} v)`;
  blocks["sensing_touchingcolor"] = (b) => process(b)`<touching color ${{ input: "COLOR" }} ?>`;
  blocks["sensing_coloristouchingcolor"] = (b) =>
    process(b)`<colour ${{ input: "COLOR" }} is touching ${{ input: "COLOR" }} ?>`;
  blocks["sensing_distanceto"] = (b) => process(b)`(distance to ${{ input: "DISTANCETOMENU" }})`;
  blocks["sensing_distancetomenu"] = (b) =>
    process(b)`(${{ field: "DISTANCETOMENU", sanitizations: repSanitizations }} v)`;
  blocks["sensing_askandwait"] = (b) => process(b)`ask ${{ input: "QUESTION" }} and wait`;
  blocks["sensing_answer"] = (b) => process(b)`(answer${{ override: "sensing" }})`;
  blocks["sensing_keypressed"] = (b) => process(b)`key ${{ input: "KEY_OPTION" }} pressed`;
  blocks["sensing_keyoptions"] = (b) => process(b)`(${{ field: "KEY_OPTION", sanitizations: repSanitizations }} v)`;
  blocks["sensing_mousedown"] = (b) => process(b)`<mouse down?${{ override: "sensing" }}>`;
  blocks["sensing_mousex"] = (b) => process(b)`(mouse x${{ override: "sensing" }})`;
  blocks["sensing_mousey"] = (b) => process(b)`(mouse y${{ override: "sensing" }})`;
  blocks["sensing_setdragmode"] = (b) => process(b)`set drag mode [${{ field: "DRAG_MODE", dropdown: true }} v]`;
  blocks["sensing_loudness"] = (b) => process(b)`(loudness${{ override: "sensing" }})`;
  blocks["sensing_loud"] = (b) => process(b)`<loud :: sensing>`; // obsolete
  blocks["sensing_timer"] = (b) => process(b)`(timer${{ override: "sensing" }})`;
  blocks["sensing_resettimer"] = (b) => process(b)`reset timer`;
  blocks["sensing_of_object_menu"] = (b) => process(b)`(${{ field: "OBJECT", sanitizations: repSanitizations }} v)`;
  blocks["sensing_of"] = (b) => process(b)`([${{ field: "PROPERTY", dropdown: true }} v] of ${{ input: "OBJECT" }})`;
  blocks["sensing_current"] = (b) => process(b)`(current [${{ field: "CURRENTMENU", dropdown: true }} v])`;
  blocks["sensing_dayssince2000"] = (b) => process(b)`(days since 2000${{ override: "sensing" }})`;
  blocks["sensing_username"] = (b) => process(b)`(username${{ override: "sensing" }})`;
  blocks["sensing_userid"] = (b) => process(b)`(user id${{ override: "sensing" }})`; // obsolete

  // OPERATORS
  blocks["operator_add"] = (b) => process(b)`(${{ input: "NUM1" }} + ${{ input: "NUM2" }})`;
  blocks["operator_subtract"] = (b) => process(b)`(${{ input: "NUM1" }} - ${{ input: "NUM2" }})`;
  blocks["operator_multiply"] = (b) => process(b)`(${{ input: "NUM1" }} * ${{ input: "NUM2" }})`;
  blocks["operator_divide"] = (b) => process(b)`(${{ input: "NUM1" }} / ${{ input: "NUM2" }})`;
  blocks["operator_random"] = (b) => process(b)`(pick random ${{ input: "FROM" }} to ${{ input: "TO" }})`;
  blocks["operator_lt"] = (b) => process(b)`<${{ input: "OPERAND1" }} < ${{ input: "OPERAND2" }}>`;
  blocks["operator_equals"] = (b) => process(b)`<${{ input: "OPERAND1" }} = ${{ input: "OPERAND2" }}>`;
  blocks["operator_gt"] = (b) => process(b)`<${{ input: "OPERAND1" }} > ${{ input: "OPERAND2" }}>`;
  blocks["operator_and"] = (b) => process(b)`<${{ input: "OPERAND1" }} and ${{ input: "OPERAND2" }}>`;
  blocks["operator_or"] = (b) => process(b)`<${{ input: "OPERAND1" }} or ${{ input: "OPERAND2" }}>`;
  blocks["operator_not"] = (b) => process(b)`<not ${{ input: "OPERAND" }}>`;
  blocks["operator_join"] = (b) => process(b)`(join ${{ input: "STRING1" }} ${{ input: "STRING2" }})`;
  blocks["operator_letter_of"] = (b) => process(b)`(letter ${{ input: "LETTER" }} of ${{ input: "STRING" }})`;
  blocks["operator_length"] = (b) => process(b)`(length of ${{ input: "STRING" }})`;
  blocks["operator_contains"] = (b) => process(b)`<${{ input: "STRING1" }} contains ${{ input: "STRING2" }} ?>`;
  blocks["operator_mod"] = (b) => process(b)`(${{ input: "NUM1" }} mod ${{ input: "NUM2" }})`;
  blocks["operator_round"] = (b) => process(b)`(round ${{ input: "NUM" }})`;
  blocks["operator_mathop"] = (b) => process(b)`([${{ field: "OPERATOR", dropdown: true }} v] of ${{ input: "NUM" }})`;

  // DATA
  blocks["data_variable"] = (b) =>
    process(b)`(${{ field: "VARIABLE", sanitizations: repSanitizations }}${{ override: "variables" }})`;
  blocks["data_setvariableto"] = (b) =>
    process(b)`set [${{ field: "VARIABLE", dropdown: true }} v] to ${{ input: "VALUE" }}`;
  blocks["data_changevariableby"] = (b) =>
    process(b)`change [${{ field: "VARIABLE", dropdown: true }} v] by ${{ input: "VALUE" }}`;
  blocks["data_showvariable"] = (b) => process(b)`show variable [${{ field: "VARIABLE", dropdown: true }} v]`;
  blocks["data_hidevariable"] = (b) => process(b)`hide variable [${{ field: "VARIABLE", dropdown: true }} v]`;
  blocks["data_listcontents"] = (b) =>
    process(b)`(${{ field: "LIST", sanitizations: repSanitizations }}${{ override: "list" }})`;
  blocks["data_listindexall"] = blocks["data_listindexrandom"] = (b) =>
    process(b)`(${{ field: "INDEX", sanitizations: repSanitizations }} v)`;
  blocks["data_addtolist"] = (b) => process(b)`add ${{ input: "ITEM" }} to [${{ field: "LIST", dropdown: true }} v]`;
  blocks["data_deleteoflist"] = (b) =>
    process(b)`delete ${{ input: "INDEX" }} of [${{ field: "LIST", dropdown: true }} v]`;
  blocks["data_deletealloflist"] = (b) => process(b)`delete all of [${{ field: "LIST", dropdown: true }} v]`;
  blocks["data_insertatlist"] = (b) =>
    process(b)`insert ${{ input: "ITEM" }} at ${{ input: "INDEX" }} of [${{ field: "LIST", dropdown: true }} v]`;
  blocks["data_replaceitemoflist"] = (b) =>
    process(
      b
    )`replace item ${{ input: "INDEX" }} of [${{ field: "LIST", dropdown: true }} v] with ${{ input: "ITEM" }}`;
  blocks["data_itemoflist"] = (b) =>
    process(b)`(item ${{ input: "INDEX" }} of [${{ field: "LIST", dropdown: true }} v])`;
  blocks["data_itemnumoflist"] = (b) =>
    process(b)`(item # of ${{ input: "ITEM" }} in [${{ field: "LIST", dropdown: true }} v])`;
  blocks["data_lengthoflist"] = (b) => process(b)`(length of [${{ field: "LIST", dropdown: true }} v])`;
  blocks["data_listcontainsitem"] = (b) =>
    process(b)`<[${{ field: "LIST", dropdown: true }} v] contains ${{ input: "ITEM" }}>`;
  blocks["data_showlist"] = (b) => process(b)`show list [${{ field: "LIST", dropdown: true }} v]`;
  blocks["data_hidelist"] = (b) => process(b)`hide list [${{ field: "LIST", dropdown: true }} v]`;

  // PROCEDURES
  blocks["procedures_definition"] = (b) => process(b)`define ${{ input: "custom_block" }}`;
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
  blocks["argument_reporter_string_number"] = (b) =>
    process(b)`(${{ field: "VALUE", sanitizations: repSanitizations }}${{ override: "custom" }})`;
  blocks["argument_reporter_boolean"] = (b) =>
    process(b)`<${{ field: "VALUE", sanitizations: repSanitizations }}${{ override: "custom" }}>`;

  // PEN
  blocks["pen_clear"] = (b) => process(b)`erase all`;
  blocks["pen_stamp"] = (b) => process(b)`stamp`;
  blocks["pen_penDown"] = (b) => process(b)`pen down`;
  blocks["pen_penUp"] = (b) => process(b)`pen up`;
  blocks["pen_setPenColorToColor"] = (b) => process(b)`set pen color to ${{ input: "COLOR" }}`;
  blocks["pen_menu_colorParam"] = (b) => process(b)`(${{ field: "colorParam", sanitizations: repSanitizations }} v)`;
  blocks["pen_changePenColorParamBy"] = (b) =>
    process(b)`change pen ${{ input: "COLOR_PARAM" }} by ${{ input: "VALUE" }}`;
  blocks["pen_setPenColorParamTo"] = (b) => process(b)`set pen ${{ input: "COLOR_PARAM" }} to ${{ input: "VALUE" }}`;
  blocks["pen_changePenSizeBy"] = (b) => process(b)`change pen size by ${{ input: "SIZE" }}`;
  blocks["pen_setPenSizeTo"] = (b) => process(b)`set pen size to ${{ input: "SIZE" }}`;

  // MUSIC
  blocks["music_menu_DRUM"] = (b) => process(b)`(${{ field: "DRUM", sanitizations: repSanitizations }} v)`;
  blocks["music_menu_INSTRUMENT"] = (b) => process(b)`(${{ field: "INSTRUMENT", sanitizations: repSanitizations }} v)`;
  blocks["music_playDrumForBeats"] = (b) => process(b)`play drum ${{ input: "DRUM" }} for ${{ input: "BEATS" }} beats`;
  blocks["music_restForBeats"] = (b) => process(b)`rest for ${{ input: "BEATS" }} beats`;
  blocks["music_playNoteForBeats"] = (b) => process(b)`play note ${{ input: "NOTE" }} for ${{ input: "BEATS" }} beats`;
  blocks["music_setInstrumentTo"] = (b) => process(b)`set instrument to ${{ input: "INSTRUMENT" }}`;
  blocks["music_setTempo"] = (b) => process(b)`set tempo to ${{ input: "TEMPO" }}`;
  blocks["music_changeTempo"] = (b) => process(b)`change tempo by ${{ input: "TEMPO" }}`;
  blocks["music_getTempo"] = (b) => process(b)`(tempo ${{ override: "MUSIC" }})`;

  function sanitize(text, sanitizations) {
    for (const sanitization of sanitizations) text = text.replaceAll(sanitization.searchValue, sanitization.replacer);
    return text;
  }

  const process =
    (block) =>
    (labels, ...components) => {
      function handleComponent(component) {
        if (component.input) {
          const inputBlock = block.getInputTargetBlock(component.input);
          if (inputBlock) {
            if (component.substack) {
              return getBlockCode(inputBlock, true).replaceAll(/^/gm, "   ") + "\n";
            } else {
              return getBlockCode(inputBlock);
            }
          } else if (component.boolean) return "<>";
          else return "";
        }

        if (component.field) {
          const text = block.getField(component.field).getText();
          return component.sanitizations ? sanitize(text, component.sanitizations) : text;
        }

        if (component.override) {
          // TODO
        }

        return "";
      }

      return components.reduce(
        (output, component, i) => output + handleComponent(component) + labels[i + 1],
        labels[0]
      );
    };

  function getBlockCode(block, script) {
    const output = blocks[block.type] && blocks[block.type](block, script);
    return (script && block.getNextBlock() && `${output}\n${getBlockCode(block.getNextBlock(), true)}`) || output;
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
