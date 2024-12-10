// TODO: add block comments
// TODO: debugger blocks

export default function getBlockCode(block, script) {
  const output = blocks[block.type]?.(block);
  return (script && block.getNextBlock() && `${output}\n${getBlockCode(block.getNextBlock(), true)}`) || output;
}

function overrideCheck(block) {
  // TODO: this doesn't work, toString might not be reliable
  const rootBlock = block.getRootBlock();
  return (
    rootBlock.type === "procedures_definition" &&
    rootBlock.getInputTargetBlock("custom_block").displayNames_.includes(block.toString())
  );
}

function processComponent(component, block, script) {
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

  if (script && component.override && overrideCheck(component.override)) {
    return ` :: ${component.override}`;
  }

  return "";
}

function build(labels, ...components) {
  const func = (block, script) => {
    return components.reduce(
      (output, component, i) => output + processComponent(component, block, script) + labels[i + 1],
      labels[0]
    );
  };

  func.labels = labels;
  func.components = components;
  return func;
}

const sanitize = (text, sanitizations) =>
  sanitizations.reduce((output, { searchValue, replacer }) => output.replace(searchValue, replacer), text);

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
  { searchValue: /^define /g, replacer: "define\\ " },
  { searchValue: /^define$/g, replacer: "define​" }, // putting a zwsp here is the only option
  { searchValue: /@(greenFlag|stopSign|turnLeft|turnRight|loopArrow|addInput|delInput|list)/g, replacer: "\\@$1" },
  { searchValue: "//", replacer: "\\//" },
];

const repSanitizations = [...blockSanitizations, { searchValue: ")", replacer: "\\)" }];

const numBlock = (block) => {
  const content = block.getFieldValue("NUM");
  return /^[0-9e.-]*$/.test(content) ? `(${content})` : `[${sanitize(content, strInpSanitizations)}]`;
};

const procedure = (block) => {
  const sanitizations = [
      { searchValue: "\\%", replacer: "%" },
      ...blockSanitizations,
      { searchValue: /^ {2,}| {2,}$/g, replacer: " " },
    ],
    labels = [];

  let argumentCount = 0,
    output = "";

  for (const component of block.getProcCode().split(/(?<!\\)(%[nbs])/)) {
    if (/^%[nbs]/.test(component.trim())) {
      output += getBlockCode(block.getInputTargetBlock(block.argumentIds_[argumentCount++]));
    } else {
      const labelText = sanitize(component, sanitizations);
      output += labelText;
      labels.push(labelText);
    }
  }

  if (/^define(?: |$)/.test(block.toString()) || Object.values(blocks).some((block) => block.labels === labels))
    output += " :: custom";

  return output;
};

const blocks = {
  math_angle: numBlock,
  math_integer: numBlock,
  math_whole_number: numBlock,
  math_positive_number: numBlock,
  math_number: numBlock,
  note: numBlock,
  text: build`[${{ field: "TEXT", sanitizations: strInpSanitizations }}]`,
  colour_picker: build`[${{ field: "COLOUR", sanitizations: strInpSanitizations }}]`,

  motion_movesteps: build`move ${{ input: "STEPS" }} steps`,
  motion_turnright: build`turn right ${{ input: "DEGREES" }} degrees`,
  motion_turnleft: build`turn left ${{ input: "DEGREES" }} degrees`,
  motion_pointindirection: build`point in direction ${{ input: "DIRECTION" }}`,
  motion_pointtowards_menu: build`(${{ field: "TOWARDS", sanitizations: repSanitizations }} v)`,
  motion_pointtowards: build`point towards ${{ input: "TOWARDS" }}`,
  motion_goto_menu: build`(${{ field: "TO", sanitizations: repSanitizations }} v)`,
  motion_gotoxy: build`go to x: ${{ input: "X" }} y: ${{ input: "Y" }}`,
  motion_goto: build`go to ${{ input: "TO" }}`,
  motion_glidesecstoxy: build`glide ${{ input: "SECS" }} secs to x: ${{ input: "X" }} y: ${{ input: "Y" }}`,
  motion_glideto_menu: build`(${{ field: "TO", sanitizations: repSanitizations }} v)`,
  motion_glideto: build`glide ${{ input: "SECS" }} secs to ${{ input: "TO" }}`,
  motion_changexby: build`change x by ${{ input: "DX" }}`,
  motion_setx: build`set x to ${{ input: "X" }}`,
  motion_changeyby: build`change y by ${{ input: "DY" }}`,
  motion_sety: build`set y to ${{ input: "Y" }}`,
  motion_ifonedgebounce: build`if on edge, bounce`,
  motion_setrotationstyle: build`set rotation style [${{ field: "STYLE", sanitizations: dropdownSanitizations }} v]`,
  motion_xposition: build`(x position${{ override: "motion" }})`,
  motion_yposition: build`(y position${{ override: "motion" }})`,
  motion_direction: build`(direction${{ override: "motion" }})`,
  motion_scroll_right: build`scroll right ${{ input: "DISTANCE" }} :: motion`,
  motion_scroll_up: build`scroll up ${{ input: "DISTANCE" }} :: motion`,
  motion_align_scene: build`align scene [${{ field: "ALIGNMENT", sanitizations: dropdownSanitizations }} v] :: motion`,
  motion_yscroll: build`(y scroll :: motion)`,
  motion_xscroll: build`(x scroll :: motion)`,

  looks_sayforsecs: build`say ${{ input: "MESSAGE" }} for ${{ input: "SECS" }} seconds`,
  looks_say: build`say ${{ input: "MESSAGE" }}`,
  looks_thinkforsecs: build`think ${{ input: "MESSAGE" }} for ${{ input: "SECS" }} seconds`,
  looks_think: build`think ${{ input: "MESSAGE" }}`,
  looks_show: build`show`,
  looks_hide: build`hide`,
  looks_hideallsprites: build`hide all sprites :: looks`,
  looks_changeeffectby: build`change [${{ field: "EFFECT", sanitizations: dropdownSanitizations }} v] effect by ${{
    input: "CHANGE",
  }}`,
  looks_seteffectto: build`set [${{ field: "EFFECT", sanitizations: dropdownSanitizations }} v] effect to ${{
    input: "VALUE",
  }}`,
  looks_cleargraphiceffects: build`clear graphic effects`,
  looks_changesizeby: build`change size by ${{ input: "CHANGE" }}`,
  looks_setsizeto: build`set size to ${{ input: "SIZE" }} %`,
  looks_size: build`(size${{ override: "looks" }})`,
  looks_costume: build`(${{ field: "COSTUME", sanitizations: repSanitizations }} v)`,
  looks_switchcostumeto: build`switch costume to ${{ input: "COSTUME" }}`,
  looks_nextcostume: build`next costume`,
  looks_switchbackdropto: build`switch backdrop to ${{ input: "BACKDROP" }}`,
  looks_backdrops: build`(${{ field: "BACKDROP", sanitizations: repSanitizations }} v)`,
  looks_gotofrontback: build`go to [${{ field: "FRONT_BACK", sanitizations: dropdownSanitizations }} v] layer`,
  looks_goforwardbackwardlayers: build`go [${{ field: "FORWARD_BACKWARD", sanitizations: dropdownSanitizations }} v] ${{
    input: "NUM",
  }} layers`,
  looks_backdropnumbername: build`(backdrop [${{ field: "NUMBER_NAME", sanitizations: dropdownSanitizations }} v])`,
  looks_costumenumbername: build`(costume [${{ field: "NUMBER_NAME", sanitizations: dropdownSanitizations }} v])`,
  looks_switchbackdroptoandwait: build`switch backdrop to ${{ input: "BACKDROP" }} and wait`,
  looks_nextbackdrop: build`next backdrop`,

  sound_sounds_menu: build`(${{ field: "SOUND_MENU", sanitizations: repSanitizations }} v)`,
  sound_play: build`start sound ${{ input: "SOUND_MENU" }}`,
  sound_playuntildone: build`play sound ${{ input: "SOUND_MENU" }} until done`,
  sound_stopallsounds: build`stop all sounds`,
  sound_seteffectto: build`set [${{ field: "EFFECT", sanitizations: dropdownSanitizations }} v] effect to ${{
    input: "VALUE",
  }}`,
  sound_changeeffectby: build`change [${{ field: "EFFECT", sanitizations: dropdownSanitizations }} v] effect by ${{
    input: "VALUE",
  }}`,
  sound_cleareffects: build`clear sound effects`,
  sound_changevolumeby: build`change volume by ${{ input: "VOLUME" }}`,
  sound_setvolumeto: build`set volume to ${{ input: "VOLUME" }} %`,
  sound_volume: build`(volume${{ override: "sound" }})`,

  event_whentouchingobject: build`when this sprite touches ${{ input: "TOUCHINGOBJECTMENU" }}`,
  event_touchingobjectmenu: build`(${{ field: "TOUCHINGOBJECTMENU", sanitizations: repSanitizations }} v)`,
  event_whenflagclicked: build`when green flag clicked`,
  event_whenthisspriteclicked: build`when this sprite clicked`,
  event_whenstageclicked: build`when stage clicked`,
  event_whenbroadcastreceived: build`when I receive [${{
    field: "BROADCAST_OPTION",
    sanitizations: dropdownSanitizations,
  }} v]`,
  event_whenbackdropswitchesto: build`when backdrop switches to [${{
    field: "BACKDROP",
    sanitizations: dropdownSanitizations,
  }} v]`,
  event_whengreaterthan: build`when [${{ field: "WHENGREATERTHANMENU", sanitizations: dropdownSanitizations }} v] > ${{
    input: "VALUE",
  }}`,
  event_broadcast_menu: build`(${{ field: "BROADCAST_OPTION", sanitizations: repSanitizations }} v)`,
  event_broadcast: build`broadcast ${{ input: "BROADCAST_INPUT" }}`,
  event_broadcastandwait: build`broadcast ${{ input: "BROADCAST_INPUT" }} and wait`,
  event_whenkeypressed: build`when [${{ field: "KEY_OPTION", sanitizations: dropdownSanitizations }} v] key pressed`,

  control_forever: build`forever\n${{ input: "SUBSTACK", substack: true }}end`,
  control_repeat: build`repeat ${{ input: "TIMES" }}\n${{ input: "SUBSTACK", substack: true }}end`,
  control_if: build`if ${{ input: "CONDITION", boolean: true }} then\n${{ input: "SUBSTACK", substack: true }}end`,
  control_if_else: build`if ${{ input: "CONDITION", boolean: true }} then\n${{
    input: "SUBSTACK",
    substack: true,
  }}else\n${{ input: "SUBSTACK2", substack: true }}end`,
  control_stop: build`stop [${{ field: "STOP_OPTION", sanitizations: dropdownSanitizations }} v]`,
  control_wait: build`wait ${{ input: "DURATION" }} seconds`,
  control_wait_until: build`wait until ${{ input: "CONDITION", boolean: true }}`,
  control_repeat_until: build`repeat until ${{ input: "CONDITION", boolean: true }}\n${{
    input: "SUBSTACK",
    substack: true,
  }}end`,

  control_while: build`while ${{ input: "CONDITION", boolean: true }} {\n${{
    input: "SUBSTACK",
    substack: true,
  }}} @loopArrow :: control`,

  control_for_each: build`for each [${{ field: "VARIABLE", sanitizations: dropdownSanitizations }} v] in ${{
    input: "VALUE",
  }} {\n${{ input: "SUBSTACK", substack: true }}} @loopArrow :: control`,
  control_start_as_clone: build`when I start as a clone`,
  control_create_clone_of_menu: build`(${{ field: "CLONE_OPTION", sanitizations: repSanitizations }} v)`,
  control_create_clone_of: build`create clone of ${{ input: "CLONE_OPTION" }}`,
  control_delete_this_clone: build`delete this clone`,
  control_get_counter: build`(counter :: control)`,
  control_incr_counter: build`increment counter :: control`,
  control_clear_counter: build`clear counter :: control`,
  control_all_at_once: build`all at once {\n${{ input: "SUBSTACK" }}} :: control`,

  sensing_touchingobject: build`<touching ${{ input: "TOUCHINGOBJECTMENU" }} ?>`,
  sensing_touchingobjectmenu: build`(${{ field: "TOUCHINGOBJECTMENU", sanitizations: repSanitizations }} v)`,
  sensing_touchingcolor: build`<touching color ${{ input: "COLOR" }} ?>`,
  sensing_coloristouchingcolor: build`<colour ${{ input: "COLOR" }} is touching ${{ input: "COLOR" }} ?>`,
  sensing_distanceto: build`(distance to ${{ input: "DISTANCETOMENU" }})`,
  sensing_distancetomenu: build`(${{ field: "DISTANCETOMENU", sanitizations: repSanitizations }} v)`,
  sensing_askandwait: build`ask ${{ input: "QUESTION" }} and wait`,
  sensing_answer: build`(answer${{ override: "sensing" }})`,
  sensing_keypressed: build`key ${{ input: "KEY_OPTION" }} pressed`,
  sensing_keyoptions: build`(${{ field: "KEY_OPTION", sanitizations: repSanitizations }} v)`,
  sensing_mousedown: build`<mouse down?${{ override: "sensing" }}>`,
  sensing_mousex: build`(mouse x${{ override: "sensing" }})`,
  sensing_mousey: build`(mouse y${{ override: "sensing" }})`,
  sensing_setdragmode: build`set drag mode [${{ field: "DRAG_MODE", sanitizations: dropdownSanitizations }} v]`,
  sensing_loudness: build`(loudness${{ override: "sensing" }})`,
  sensing_loud: build`<loud :: sensing>`,
  sensing_timer: build`(timer${{ override: "sensing" }})`,
  sensing_resettimer: build`reset timer`,
  sensing_of_object_menu: build`(${{ field: "OBJECT", sanitizations: repSanitizations }} v)`,
  sensing_of: build`([${{ field: "PROPERTY", sanitizations: dropdownSanitizations }} v] of ${{ input: "OBJECT" }})`,
  sensing_current: build`(current [${{ field: "CURRENTMENU", sanitizations: dropdownSanitizations }} v])`,
  sensing_dayssince2000: build`(days since 2000${{ override: "sensing" }})`,
  sensing_username: build`(username${{ override: "sensing" }})`,
  sensing_userid: build`(user id${{ override: "sensing" }})`,

  operator_add: build`(${{ input: "NUM1" }} + ${{ input: "NUM2" }})`,
  operator_subtract: build`(${{ input: "NUM1" }} - ${{ input: "NUM2" }})`,
  operator_multiply: build`(${{ input: "NUM1" }} * ${{ input: "NUM2" }})`,
  operator_divide: build`(${{ input: "NUM1" }} / ${{ input: "NUM2" }})`,
  operator_random: build`(pick random ${{ input: "FROM" }} to ${{ input: "TO" }})`,
  operator_lt: build`<${{ input: "OPERAND1" }} < ${{ input: "OPERAND2" }}>`,
  operator_equals: build`<${{ input: "OPERAND1" }} = ${{ input: "OPERAND2" }}>`,
  operator_gt: build`<${{ input: "OPERAND1" }} > ${{ input: "OPERAND2" }}>`,
  operator_and: build`<${{ input: "OPERAND1" }} and ${{ input: "OPERAND2" }}>`,
  operator_or: build`<${{ input: "OPERAND1" }} or ${{ input: "OPERAND2" }}>`,
  operator_not: build`<not ${{ input: "OPERAND" }}>`,
  operator_join: build`(join ${{ input: "STRING1" }} ${{ input: "STRING2" }})`,
  operator_letter_of: build`(letter ${{ input: "LETTER" }} of ${{ input: "STRING" }})`,
  operator_length: build`(length of ${{ input: "STRING" }})`,
  operator_contains: build`<${{ input: "STRING1" }} contains ${{ input: "STRING2" }} ?>`,
  operator_mod: build`(${{ input: "NUM1" }} mod ${{ input: "NUM2" }})`,
  operator_round: build`(round ${{ input: "NUM" }})`,
  operator_mathop: build`([${{ field: "OPERATOR", sanitizations: dropdownSanitizations }} v] of ${{ input: "NUM" }})`,

  data_variable: build`(${{ field: "VARIABLE", sanitizations: repSanitizations }}${{ override: "variables" }})`,
  data_setvariableto: build`set [${{ field: "VARIABLE", sanitizations: dropdownSanitizations }} v] to ${{
    input: "VALUE",
  }}`,
  data_changevariableby: build`change [${{ field: "VARIABLE", sanitizations: dropdownSanitizations }} v] by ${{
    input: "VALUE",
  }}`,
  data_showvariable: build`show variable [${{ field: "VARIABLE", sanitizations: dropdownSanitizations }} v]`,
  data_hidevariable: build`hide variable [${{ field: "VARIABLE", sanitizations: dropdownSanitizations }} v]`,
  data_listcontents: build`(${{ field: "LIST", sanitizations: repSanitizations }}${{ override: "list" }})`,
  data_listindexall: build`(${{ field: "INDEX", sanitizations: repSanitizations }} v)`,
  data_listindexrandom: build`(${{ field: "INDEX", sanitizations: repSanitizations }} v)`,
  data_addtolist: build`add ${{ input: "ITEM" }} to [${{ field: "LIST", sanitizations: dropdownSanitizations }} v]`,
  data_deleteoflist: build`delete ${{ input: "INDEX" }} of [${{
    field: "LIST",
    sanitizations: dropdownSanitizations,
  }} v]`,
  data_deletealloflist: build`delete all of [${{ field: "LIST", sanitizations: dropdownSanitizations }} v]`,
  data_insertatlist: build`insert ${{ input: "ITEM" }} at ${{ input: "INDEX" }} of [${{
    field: "LIST",
    sanitizations: dropdownSanitizations,
  }} v]`,
  data_replaceitemoflist: build`replace item ${{ input: "INDEX" }} of [${{
    field: "LIST",
    sanitizations: dropdownSanitizations,
  }} v] with ${{ input: "ITEM" }}`,
  data_itemoflist: build`(item ${{ input: "INDEX" }} of [${{
    field: "LIST",
    sanitizations: dropdownSanitizations,
  }} v])`,
  data_itemnumoflist: build`(item # of ${{ input: "ITEM" }} in [${{
    field: "LIST",
    sanitizations: dropdownSanitizations,
  }} v])`,
  data_lengthoflist: build`(length of [${{ field: "LIST", sanitizations: dropdownSanitizations }} v])`,
  data_listcontainsitem: build`<[${{ field: "LIST", sanitizations: dropdownSanitizations }} v] contains ${{
    input: "ITEM",
  }}>`,
  data_showlist: build`show list [${{ field: "LIST", sanitizations: dropdownSanitizations }} v]`,
  data_hidelist: build`hide list [${{ field: "LIST", sanitizations: dropdownSanitizations }} v]`,

  procedures_definition: build`define ${{ input: "custom_block" }}`,
  procedures_call: procedure,
  procedures_prototype: procedure,
  argument_reporter_string_number: build`(${{ field: "VALUE", sanitizations: repSanitizations }}${{
    override: "custom",
  }})`,
  argument_reporter_boolean: build`<${{ field: "VALUE", sanitizations: repSanitizations }}${{ override: "custom" }}>`,

  pen_clear: build`erase all`,
  pen_stamp: build`stamp`,
  pen_penDown: build`pen down`,
  pen_penUp: build`pen up`,
  pen_setPenColorToColor: build`set pen color to ${{ input: "COLOR" }}`,
  pen_menu_colorParam: build`(${{ field: "colorParam", sanitizations: repSanitizations }} v)`,
  pen_changePenColorParamBy: build`change pen ${{ input: "COLOR_PARAM" }} by ${{ input: "VALUE" }}`,
  pen_setPenColorParamTo: build`set pen ${{ input: "COLOR_PARAM" }} to ${{ input: "VALUE" }}`,
  pen_changePenSizeBy: build`change pen size by ${{ input: "SIZE" }}`,
  pen_setPenSizeTo: build`set pen size to ${{ input: "SIZE" }}`,
  pen_setPenShadeToNumber: build`set pen shade to ${{ input: "SHADE" }}`,
  pen_changePenShadeBy: build`change pen shade by ${{ input: "SHADE" }}`,
  pen_setPenHueToNumber: build`set pen hue to ${{ input: "HUE" }}`,
  pen_changePenHueBy: build`change pen hue by ${{ input: "HUE" }}`,

  music_menu_DRUM: build`(${{ field: "DRUM", sanitizations: repSanitizations }} v)`,
  music_menu_INSTRUMENT: build`(${{ field: "INSTRUMENT", sanitizations: repSanitizations }} v)`,
  music_playDrumForBeats: build`play drum ${{ input: "DRUM" }} for ${{ input: "BEATS" }} beats`,
  music_restForBeats: build`rest for ${{ input: "BEATS" }} beats`,
  music_playNoteForBeats: build`play note ${{ input: "NOTE" }} for ${{ input: "BEATS" }} beats`,
  music_setInstrument: build`set instrument to ${{ input: "INSTRUMENT" }}`,
  music_setTempo: build`set tempo to ${{ input: "TEMPO" }}`,
  music_changeTempo: build`change tempo by ${{ input: "TEMPO" }}`,
  music_getTempo: build`(tempo ${{ override: "MUSIC" }})`,

  videoSensing_whenMotionGreaterThan: build`when video motion > ${{ input: "REFERENCE" }}`,
  videoSensing_videoOn: build`(video ${{ input: "ATTRIBUTE" }} on ${{ input: "SUBJECT" }})`,
  videoSensing_menu_ATTRIBUTE: build`(${{ field: "ATTRIBUTE", sanitizations: repSanitizations }} v)`,
  videoSensing_menu_SUBJECT: build`(${{ field: "SUBJECT", sanitizations: repSanitizations }} v)`,
  videoSensing_videoToggle: build`turn video ${{ input: "VIDEO_STATE" }}`,
  videoSensing_menu_VIDEO_STATE: build`(${{ field: "VIDEO_STATE", sanitizations: repSanitizations }} v)`,
  videoSensing_setVideoTransparency: build`set video transparency to ${{ input: "TRANSPARENCY" }}`,

  text2speech_speakAndWait: build`speak ${{ input: "WORDS" }}`,
  text2speech_setVoice: build`set voice to ${{ input: "VOICE" }}`,
  text2speech_menu_voices: build`(${{ field: "voices", sanitizations: repSanitizations }} v)`,
  text2speech_setLanguage: build`set language to ${{ input: "LANGUAGE" }}`,
  text2speech_menu_languages: build`(${{ field: "languages", sanitizations: repSanitizations }} v)`,

  translate_menu_languages: build`(${{ field: "languages", sanitizations: repSanitizations }} v)`,
  translate_getTranslate: build`(translate ${{ input: "WORDS" }} to ${{ input: "LANGUAGE" }})`,
  translate_getViewerLanguage: build`(language${{ override: "TRANSLATE" }})`,

  makeymakey_whenMakeyKeyPressed: build`when ${{ input: "KEY" }} key pressed`,
  makeymakey_menu_KEY: build`(${{ field: "KEY", sanitizations: repSanitizations }} v)`,
  makeymakey_whenCodePressed: build`when ${{ input: "SEQUENCE" }} pressed in order`,
  makeymakey_menu_SEQUENCE: build`(${{ field: "SEQUENCE", sanitizations: repSanitizations }} v)`,

  // TODO: add remaining extensions
};
