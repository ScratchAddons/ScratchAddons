// TODO: add block comments

export function getBlockCode(block, context = {}) {
  const output = blocks[block.type]?.(block, context);
  return context.startBlock && block.getNextBlock()
    ? `${output}\n${getBlockCode(block.getNextBlock(), context)}`
    : output;
}

export function getScriptsCode(...rootBlocks) {
  return rootBlocks.map((block) => getBlockCode(block, { startBlock: block, rootBlocks: rootBlocks })).join("\n\n");
}

function processComponent(component, block, context) {
  if (component.input) {
    const inputConnection = block.getInput(component.input).connection;
    const inputBlock = inputConnection.targetBlock();

    if (inputBlock) {
      return component.substack
        ? getBlockCode(inputBlock, { startBlock: block, ...context }).replaceAll(/^/gm, "   ") + "\n"
        : getBlockCode(inputBlock, { startBlock: block, ...context });
    }

    return inputConnection.check_?.length === 1 && inputConnection.check_[0] === "Boolean" ? "<>" : "";
  }

  if (component.field) {
    if (component.dropdown) return dropdown({ ...component, square: true })(block);
    const text = block.getField(component.field).getText();
    return component.sanitizations ? sanitize(text, component.sanitizations) : text;
  }

  return "";
}

function build(labels, ...components) {
  const func = (block, context) => {
    return components.reduce(
      (output, component, i) => output + processComponent(component, block, context) + labels[i + 1],
      labels[0]
    );
  };

  func.labels = labels;
  func.components = components;
  return func;
}

const argumentConflict = (text, startBlock) =>
  startBlock &&
  startBlock.type === "procedures_definition" &&
  startBlock.getInputTargetBlock("custom_block").displayNames_.includes(text);

const sanitize = (text, sanitizations) =>
  sanitizations.reduce((output, { searchValue, replacer }) => output.replace(searchValue, replacer), text);

// Sanitization configurations

const dropdownSanitizations = [
  { searchValue: "\\", replacer: "\\\\" },
  { searchValue: /^\/scratchblocks$/g, replacer: "\\/scratchblocks" },
  { searchValue: "]", replacer: "\\]" },
];

const strInpSanitizations = [
  ...dropdownSanitizations,
  { searchValue: / v$/g, replacer: " \\v" },
  { searchValue: /^(#(?:[\da-f]{3}){1,2}?)$/gi, replacer: "​$1" }, // ZWSP
];

const blockSanitizations = [
  { searchValue: "\\", replacer: "\\\\" },
  { searchValue: "::", replacer: ":\\:" },
  { searchValue: "[", replacer: "\\[" },
  { searchValue: "(", replacer: "\\(" },
  { searchValue: "<", replacer: "\\<" },
  { searchValue: "{", replacer: "\\{" },
  { searchValue: "[/scratchblocks]", replacer: "[\\/scratchblocks]" },
  { searchValue: /^define /g, replacer: "define\\ " },
  { searchValue: /^define$/g, replacer: "define​" }, // ZWSP
  { searchValue: /@(greenFlag|stopSign|turnLeft|turnRight|loopArrow|addInput|delInput|list)/g, replacer: "\\@$1" },
  { searchValue: "//", replacer: "\\//" },
];

const repSanitizations = [
  ...blockSanitizations,
  { searchValue: ")", replacer: "\\)" },
  { searchValue: ">", replacer: "\\>" },
  { searchValue: /^$/g, replacer: " " },
];

// Dropdown data

const looksEffectArgs = {
  BRIGHTNESS: "brightness",
  COLOR: "color",
  FISHEYE: "fisheye",
  GHOST: "ghost",
  MOSAIC: "mosaic",
  PIXELATE: "pixelate",
  WHIRL: "whirl",
};

const soundEffectArgs = { PITCH: "pitch", PAN: "pan left/right" };

const motionObjectArgs = { _mouse_: "mouse-pointer", _random_: "random position" };

const sensingCurrentArgs = {
  DATE: "date",
  DAYOFWEEK: "day of week",
  HOUR: "hour",
  MINUTE: "minute",
  MONTH: "month",
  SECOND: "second",
  YEAR: "year",
};

// Block definitions

const numBlock = (field) => (block) => {
  const content = block.getFieldValue(field);
  return /^[0-9e.-]*$/.test(content) ? `(${content})` : `[${sanitize(content, strInpSanitizations)}]`;
};

const dropdown = (options) => (block) => {
  const field = options?.field ? block.getField(options?.field) : block.inputList[0].fieldRow[0];
  const text = options?.args?.[field.getValue()] ?? (options?.useText ? field.getText() : field.getValue());
  return options?.square ? `[${sanitize(text, dropdownSanitizations)} v]` : `(${sanitize(text, repSanitizations)} v)`;
};

const simpleReporter = (text, category, isBool) => {
  const block = (_, context) =>
    `${isBool ? "<" : "("}${text}${argumentConflict(text, context.startBlock) ? ` :: ${category}` : ""}${isBool ? ">" : ")"}`;

  block.repText = text;
  block.isBool = isBool;
  return block;
};

const procedure = (block, context) => {
  const isDef = (checkBlock) =>
    checkBlock &&
    checkBlock.type === "procedures_definition" &&
    checkBlock.getInputTargetBlock("custom_block").getProcCode() === block.getProcCode();

  const isDebuggerProcCode = (procCode) =>
    [
      "\u200B\u200Bbreakpoint\u200B\u200B",
      "\u200B\u200Blog\u200B\u200B %s",
      "\u200B\u200Bwarn\u200B\u200B %s",
      "\u200B\u200Berror\u200B\u200B %s",
    ].includes(procCode);

  const sanitizations = [
    { searchValue: "\\%", replacer: "%" },
    ...blockSanitizations,
    { searchValue: /^ {2,}| {2,}$/g, replacer: " " },
  ];

  const labels = [];
  let argCount = 0,
    isLabel = true,
    output = "";

  for (const component of block.getProcCode().split(/(?<!\\)(%[nbs])/)) {
    if (isLabel) {
      const labelText = sanitize(component, sanitizations);
      labels.push(labelText);
      output += labelText;
    } else {
      const inputBlock = block.getInputTargetBlock(block.argumentIds_[argCount++]);
      if (inputBlock) output += getBlockCode(inputBlock, { startBlock: block, ...context });
      else if (component === "%b") output += "<>";
    }

    isLabel = !isLabel;
  }

  if (isDebuggerProcCode(block.getProcCode())) {
    return output.replaceAll("\u200B", "") + " :: #29beb8";
  }

  if (
    block.type === "procedures_call" &&
    (!(isDef(context.startBlock) || context.rootBlocks?.some((block) => isDef(block))) ||
      /^define(?: |$)/.test(block.toString()) ||
      Object.values(blocks).some(
        (block) =>
          block.labels?.length === labels.length &&
          block.labels.every((label, index) => label.replace(/[,%?:]/g, "") === labels[index].replace(/[,%?:]/g, ""))
      ))
  ) {
    return output + ` :: custom`;
  }

  return output;
};

const blocks = {
  math_angle: numBlock("NUM"),
  math_integer: numBlock("NUM"),
  math_whole_number: numBlock("NUM"),
  math_positive_number: numBlock("NUM"),
  math_number: numBlock("NUM"),
  note: numBlock("NOTE"),
  text: build`[${{ field: "TEXT", sanitizations: strInpSanitizations }}]`,
  colour_picker: build`[${{ field: "COLOUR" }}]`,

  motion_movesteps: build`move ${{ input: "STEPS" }} steps`,
  motion_turnright: build`turn right ${{ input: "DEGREES" }} degrees`,
  motion_turnleft: build`turn left ${{ input: "DEGREES" }} degrees`,
  motion_pointindirection: build`point in direction ${{ input: "DIRECTION" }}`,
  motion_pointtowards_menu: dropdown({ args: motionObjectArgs }),
  motion_pointtowards: build`point towards ${{ input: "TOWARDS" }}`,
  motion_goto_menu: dropdown({ args: motionObjectArgs }),
  motion_gotoxy: build`go to x: ${{ input: "X" }} y: ${{ input: "Y" }}`,
  motion_goto: build`go to ${{ input: "TO" }}`,
  motion_glidesecstoxy: build`glide ${{ input: "SECS" }} secs to x: ${{ input: "X" }} y: ${{ input: "Y" }}`,
  motion_glideto_menu: dropdown({ args: motionObjectArgs }),
  motion_glideto: build`glide ${{ input: "SECS" }} secs to ${{ input: "TO" }}`,
  motion_changexby: build`change x by ${{ input: "DX" }}`,
  motion_setx: build`set x to ${{ input: "X" }}`,
  motion_changeyby: build`change y by ${{ input: "DY" }}`,
  motion_sety: build`set y to ${{ input: "Y" }}`,
  motion_ifonedgebounce: build`if on edge, bounce`,
  motion_setrotationstyle: build`set rotation style ${{ field: "STYLE", dropdown: true }}`,
  motion_xposition: simpleReporter("x position", "motion"),
  motion_yposition: simpleReporter("y position", "motion"),
  motion_direction: simpleReporter("direction", "motion"),
  motion_scroll_right: build`scroll right ${{ input: "DISTANCE" }} :: motion`,
  motion_scroll_up: build`scroll up ${{ input: "DISTANCE" }} :: motion`,
  motion_align_scene: build`align scene ${{ field: "ALIGNMENT", dropdown: true }} :: motion`,
  motion_yscroll: build`(y scroll :: motion)`,
  motion_xscroll: build`(x scroll :: motion)`,

  looks_sayforsecs: build`say ${{ input: "MESSAGE" }} for ${{ input: "SECS" }} seconds`,
  looks_say: build`say ${{ input: "MESSAGE" }}`,
  looks_thinkforsecs: build`think ${{ input: "MESSAGE" }} for ${{ input: "SECS" }} seconds`,
  looks_think: build`think ${{ input: "MESSAGE" }}`,
  looks_show: build`show`,
  looks_hide: build`hide`,
  looks_hideallsprites: build`hide all sprites :: looks`,
  looks_changeeffectby: build`change ${{ field: "EFFECT", dropdown: true, args: looksEffectArgs }} effect by ${{ input: "CHANGE" }}`,
  looks_seteffectto: build`set ${{ field: "EFFECT", dropdown: true, args: looksEffectArgs }} effect to ${{ input: "VALUE" }}`,
  looks_cleargraphiceffects: build`clear graphic effects`,
  looks_changesizeby: build`change size by ${{ input: "CHANGE" }}`,
  looks_setsizeto: build`set size to ${{ input: "SIZE" }} %`,
  looks_size: simpleReporter("size", "looks"),
  looks_changestretchby: build`change stretch by ${{ input: "CHANGE" }} :: looks`,
  looks_setstretchto: build`set stretch to ${{ input: "STRETCH" }} % :: looks`,
  looks_costume: dropdown(),
  looks_switchcostumeto: build`switch costume to ${{ input: "COSTUME" }}`,
  looks_nextcostume: build`next costume`,
  looks_switchbackdropto: build`switch backdrop to ${{ input: "BACKDROP" }}`,
  looks_backdrops: dropdown(),
  looks_gotofrontback: build`go to ${{ field: "FRONT_BACK", dropdown: true }} layer`,
  looks_goforwardbackwardlayers: build`go ${{ field: "FORWARD_BACKWARD", dropdown: true }} ${{ input: "NUM" }} layers`,
  looks_backdropnumbername: build`(backdrop ${{ field: "NUMBER_NAME", dropdown: true }})`,
  looks_costumenumbername: build`(costume ${{ field: "NUMBER_NAME", dropdown: true }})`,
  looks_switchbackdroptoandwait: build`switch backdrop to ${{ input: "BACKDROP" }} and wait`,
  looks_nextbackdrop: build`next backdrop`,

  sound_sounds_menu: dropdown(),
  sound_play: build`start sound ${{ input: "SOUND_MENU" }}`,
  sound_playuntildone: build`play sound ${{ input: "SOUND_MENU" }} until done`,
  sound_stopallsounds: build`stop all sounds`,
  sound_seteffectto: build`set ${{ field: "EFFECT", dropdown: true, args: soundEffectArgs }} effect to ${{ input: "VALUE" }}`,
  sound_changeeffectby: build`change ${{ field: "EFFECT", dropdown: true, args: soundEffectArgs }} effect by ${{ input: "VALUE" }}`,
  sound_cleareffects: build`clear sound effects`,
  sound_changevolumeby: build`change volume by ${{ input: "VOLUME" }}`,
  sound_setvolumeto: build`set volume to ${{ input: "VOLUME" }} %`,
  sound_volume: simpleReporter("volume", "sound"),

  event_whentouchingobject: build`when this sprite touches ${{ input: "TOUCHINGOBJECTMENU" }} :: events hat`,
  event_touchingobjectmenu: dropdown({ args: { _mouse_: "mouse-pointer", _edge_: "edge" } }),
  event_whenflagclicked: build`when green flag clicked`,
  event_whenthisspriteclicked: build`when this sprite clicked`,
  event_whenstageclicked: build`when stage clicked`,
  event_whenbroadcastreceived: build`when I receive ${{ field: "BROADCAST_OPTION", dropdown: true, useText: true }}`,
  event_whenbackdropswitchesto: build`when backdrop switches to ${{ field: "BACKDROP", dropdown: true }}`,
  event_whengreaterthan: build`when ${{ field: "WHENGREATERTHANMENU", dropdown: true, args: { LOUDNESS: "loudness", TIMER: "timer" } }} > ${{ input: "VALUE" }}`,
  event_broadcast_menu: dropdown({ useText: true }),
  event_broadcast: build`broadcast ${{ input: "BROADCAST_INPUT", dropdown: true, useText: true }}`,
  event_broadcastandwait: build`broadcast ${{ input: "BROADCAST_INPUT", dropdown: true, useText: true }} and wait`,
  event_whenkeypressed: build`when ${{ field: "KEY_OPTION", dropdown: true }} key pressed`,

  control_forever: build`forever\n${{ input: "SUBSTACK", substack: true }}end`,
  control_repeat: build`repeat ${{ input: "TIMES" }}\n${{ input: "SUBSTACK", substack: true }}end`,
  control_if: build`if ${{ input: "CONDITION" }} then\n${{ input: "SUBSTACK", substack: true }}end`,
  control_if_else: build`if ${{ input: "CONDITION" }} then\n${{ input: "SUBSTACK", substack: true }}else\n${{ input: "SUBSTACK2", substack: true }}end`,
  control_stop: build`stop ${{ field: "STOP_OPTION", dropdown: true }}`,
  control_wait: build`wait ${{ input: "DURATION" }} seconds`,
  control_wait_until: build`wait until ${{ input: "CONDITION" }}`,
  control_repeat_until: build`repeat until ${{ input: "CONDITION" }}\n${{ input: "SUBSTACK", substack: true }}end`,
  control_while: build`while ${{ input: "CONDITION" }} {\n${{ input: "SUBSTACK", substack: true }}} @loopArrow :: control`,
  control_for_each: build`for each ${{ field: "VARIABLE", dropdown: true, useText: true }} in ${{ input: "VALUE" }} {\n${{ input: "SUBSTACK", substack: true }}} @loopArrow :: control`,
  control_start_as_clone: build`when I start as a clone`,
  control_create_clone_of_menu: dropdown({ args: { _myself_: "myself" } }),
  control_create_clone_of: build`create clone of ${{ input: "CLONE_OPTION" }}`,
  control_delete_this_clone: build`delete this clone`,
  control_get_counter: build`(counter :: control)`,
  control_incr_counter: build`increment counter :: control`,
  control_clear_counter: build`clear counter :: control`,
  control_all_at_once: build`all at once {\n${{ input: "SUBSTACK" }}} :: control`,

  sensing_touchingobject: build`<touching ${{ input: "TOUCHINGOBJECTMENU" }} ?>`,
  sensing_touchingobjectmenu: dropdown({ args: { _mouse_: "mouse-pointer", _edge_: "edge" } }),
  sensing_touchingcolor: build`<touching color ${{ input: "COLOR" }} ?>`,
  sensing_coloristouchingcolor: build`<color ${{ input: "COLOR" }} is touching ${{ input: "COLOR2" }} ?>`,
  sensing_distanceto: build`(distance to ${{ input: "DISTANCETOMENU" }})`,
  sensing_distancetomenu: dropdown({ args: { _mouse_: "mouse-pointer" } }),
  sensing_askandwait: build`ask ${{ input: "QUESTION" }} and wait`,
  sensing_answer: simpleReporter("answer", "sensing"),
  sensing_keypressed: build`key ${{ input: "KEY_OPTION" }} pressed`,
  sensing_keyoptions: dropdown(),
  sensing_mousedown: simpleReporter("mouse down?", "sensing", true),
  sensing_mousex: simpleReporter("mouse x", "sensing"),
  sensing_mousey: simpleReporter("mouse y", "sensing"),
  sensing_setdragmode: build`set drag mode ${{ field: "DRAG_MODE", dropdown: true }}`,
  sensing_loudness: simpleReporter("loudness", "sensing"),
  sensing_loud: build`<loud :: sensing>`,
  sensing_timer: simpleReporter("timer", "sensing"),
  sensing_resettimer: build`reset timer`,
  sensing_of_object_menu: dropdown({ args: { _stage_: "Stage" } }),
  sensing_current: build`(current ${{ field: "CURRENTMENU", dropdown: true, args: sensingCurrentArgs }})`,
  sensing_of: (block, context) => {
    const property = sanitize(block.getField("PROPERTY").getValue(), dropdownSanitizations);
    const mathOptions = [
      "abs",
      "floor",
      "ceiling",
      "sqrt",
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "ln",
      "log",
      "e ^",
      "10 ^",
    ];
    const override = mathOptions.includes(property) ? " :: sensing" : "";
    return `([${property} v] of ${getBlockCode(block.getInputTargetBlock("OBJECT", { startBlock: block, ...context }))}${override})`;
  },
  sensing_dayssince2000: simpleReporter("days since 2000", "sensing"),
  sensing_username: simpleReporter("username", "sensing"),
  sensing_userid: build`(user id :: sensing)`,

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
  operator_mathop: build`(${{ field: "OPERATOR", dropdown: true }} of ${{ input: "NUM" }})`,

  data_variable: (block, context) => {
    const text = block.getField("VARIABLE").getText();
    const conflict =
      argumentConflict(text, context.startBlock) ||
      / v$/.test(text) ||
      Object.values(blocks).some(
        (block) =>
          block.repText && !block.isBool && block.repText.replaceAll(/[,%?:]/g, "") === text.replaceAll(/[,%?:]/g, "")
      );

    return `(${sanitize(text, repSanitizations)}${conflict ? " :: variables" : ""})`;
  },
  data_setvariableto: build`set ${{ field: "VARIABLE", dropdown: true, useText: true }} to ${{ input: "VALUE" }}`,
  data_changevariableby: build`change ${{ field: "VARIABLE", dropdown: true, useText: true }} by ${{ input: "VALUE" }}`,
  data_showvariable: build`show variable ${{ field: "VARIABLE", dropdown: true, useText: true }}`,
  data_hidevariable: build`hide variable ${{ field: "VARIABLE", dropdown: true, useText: true }}`,
  data_listcontents: build`(${{ field: "LIST", sanitizations: repSanitizations }} :: list)`,
  data_listindexall: dropdown(),
  data_listindexrandom: dropdown(),
  data_addtolist: build`add ${{ input: "ITEM" }} to ${{ field: "LIST", dropdown: true, useText: true }}`,
  data_deleteoflist: build`delete ${{ input: "INDEX" }} of ${{ field: "LIST", dropdown: true, useText: true }}`,
  data_deletealloflist: build`delete all of ${{ field: "LIST", dropdown: true, useText: true }}`,
  data_insertatlist: build`insert ${{ input: "ITEM" }} at ${{ input: "INDEX" }} of ${{ field: "LIST", dropdown: true, useText: true }}`,
  data_replaceitemoflist: build`replace item ${{ input: "INDEX" }} of ${{ field: "LIST", dropdown: true, useText: true }} with ${{ input: "ITEM" }}`,
  data_itemoflist: build`(item ${{ input: "INDEX" }} of ${{ field: "LIST", dropdown: true, useText: true }})`,
  data_itemnumoflist: build`(item # of ${{ input: "ITEM" }} in ${{ field: "LIST", dropdown: true, useText: true }})`,
  data_lengthoflist: build`(length of ${{ field: "LIST", dropdown: true, useText: true }})`,
  data_listcontainsitem: build`<${{ field: "LIST", dropdown: true, useText: true }} contains ${{ input: "ITEM" }}>`,
  data_showlist: build`show list ${{ field: "LIST", dropdown: true, useText: true }}`,
  data_hidelist: build`hide list ${{ field: "LIST", dropdown: true, useText: true }}`,

  procedures_definition: build`define ${{ input: "custom_block" }}`,
  procedures_call: procedure,
  procedures_prototype: procedure,
  argument_reporter_string_number: (block, context) => {
    const text = block.getFieldValue("VALUE");
    return `(${sanitize(text, repSanitizations)}${argumentConflict(text, context.startBlock) && !/ v$/.test(text) ? "" : " :: custom-arg"})`;
  },
  argument_reporter_boolean: (block, context) => {
    const text = block.getFieldValue("VALUE");
    return `<${sanitize(text, repSanitizations)}${argumentConflict(text, context.startBlock) ? "" : " :: custom-arg"}>`;
  },

  pen_clear: build`erase all`,
  pen_stamp: build`stamp`,
  pen_penDown: build`pen down`,
  pen_penUp: build`pen up`,
  pen_setPenColorToColor: build`set pen color to ${{ input: "COLOR" }}`,
  pen_menu_colorParam: dropdown(),
  pen_changePenColorParamBy: build`change pen ${{ input: "COLOR_PARAM" }} by ${{ input: "VALUE" }}`,
  pen_setPenColorParamTo: build`set pen ${{ input: "COLOR_PARAM" }} to ${{ input: "VALUE" }}`,
  pen_changePenSizeBy: build`change pen size by ${{ input: "SIZE" }}`,
  pen_setPenSizeTo: build`set pen size to ${{ input: "SIZE" }}`,
  pen_setPenShadeToNumber: build`set pen shade to ${{ input: "SHADE" }}`,
  pen_changePenShadeBy: build`change pen shade by ${{ input: "SHADE" }}`,
  pen_setPenHueToNumber: build`set pen hue to ${{ input: "HUE" }}`,
  pen_changePenHueBy: build`change pen hue by ${{ input: "HUE" }}`,

  music_menu_DRUM: dropdown({
    args: {
      1: "(1) Snare Drum",
      2: "(2) Bass Drum",
      3: "(3) Side Stick",
      4: "(4) Crash Cymbal",
      5: "(5) Open Hi-Hat",
      6: "(6) Closed Hi-Hat",
      7: "(7) Tambourine",
      8: "(8) Hand Clap",
      9: "(9) Claves",
      10: "(10) Wood Block",
      11: "(11) Cowbell",
      12: "(12) Triangle",
      13: "(13) Bongo",
      14: "(14) Conga",
      15: "(15) Cabasa",
      16: "(16) Guiro",
      17: "(17) Vibraslap",
      18: "(18) Cuica",
    },
  }),
  music_menu_INSTRUMENT: dropdown({
    args: {
      1: "(1) Piano",
      2: "(2) Electric Piano",
      3: "(3) Organ",
      4: "(4) Guitar",
      5: "(5) Electric Guitar",
      6: "(6) Bass",
      7: "(7) Pizzicato",
      8: "(8) Cello",
      9: "(9) Trombone",
      10: "(10) Clarinet",
      11: "(11) Saxophone",
      12: "(12) Flute",
      13: "(13) Wooden Flute",
      14: "(14) Bassoon",
      15: "(15) Choir",
      16: "(16) Vibraphone",
      17: "(17) Music Box",
      18: "(18) Steel Drum",
      19: "(19) Marimba",
      20: "(20) Synth Lead",
      21: "(21) Synth Pad",
    },
  }),
  music_playDrumForBeats: build`play drum ${{ input: "DRUM" }} for ${{ input: "BEATS" }} beats`,
  music_restForBeats: build`rest for ${{ input: "BEATS" }} beats`,
  music_playNoteForBeats: build`play note ${{ input: "NOTE" }} for ${{ input: "BEATS" }} beats`,
  music_setInstrument: build`set instrument to ${{ input: "INSTRUMENT" }}`,
  music_setTempo: build`set tempo to ${{ input: "TEMPO" }}`,
  music_changeTempo: build`change tempo by ${{ input: "TEMPO" }}`,
  music_getTempo: simpleReporter("tempo", "music"),
  music_midiPlayDrumForBeats: build`play drum ${{ input: "DRUM" }} for ${{ input: "BEATS" }} beats`,
  music_midiSetInstrument: build`set instrument to ${{ input: "INSTRUMENT" }}`,

  videoSensing_whenMotionGreaterThan: build`when video motion > ${{ input: "REFERENCE" }}`,
  videoSensing_videoOn: build`(video ${{ input: "ATTRIBUTE" }} on ${{ input: "SUBJECT" }})`,
  videoSensing_menu_ATTRIBUTE: dropdown(),
  videoSensing_menu_SUBJECT: dropdown({ args: { Stage: "stage", "this sprite": "sprite" } }),
  videoSensing_videoToggle: build`turn video ${{ input: "VIDEO_STATE" }}`,
  videoSensing_menu_VIDEO_STATE: dropdown({ args: { "on-flipped": "on flipped" } }),
  videoSensing_setVideoTransparency: build`set video transparency to ${{ input: "TRANSPARENCY" }}`,

  text2speech_speakAndWait: build`speak ${{ input: "WORDS" }}`,
  text2speech_setVoice: build`set voice to ${{ input: "VOICE" }}`,
  text2speech_menu_voices: dropdown({
    args: {
      ALTO: "alto",
      TENOR: "tenor",
      SQUEAK: "squeak",
      GIANT: "giant",
      KITTEN: "kitten",
    },
  }),
  text2speech_setLanguage: build`set language to ${{ input: "LANGUAGE" }}`,
  text2speech_menu_languages: dropdown({ useText: true }),

  translate_menu_languages: dropdown({ useText: true }),
  translate_getTranslate: build`(translate ${{ input: "WORDS" }} to ${{ input: "LANGUAGE" }})`,
  translate_getViewerLanguage: simpleReporter("language", "translate"),

  makeymakey_whenMakeyKeyPressed: build`when ${{ input: "KEY" }} key pressed :: makeymakey`,
  makeymakey_menu_KEY: dropdown({ args: { SPACE: "space", LEFT: "left", UP: "up", RIGHT: "right", DOWN: "down" } }),
  makeymakey_whenCodePressed: build`when ${{ input: "SEQUENCE" }} pressed in order`,
  makeymakey_menu_SEQUENCE: dropdown({
    args: {
      "LEFT UP RIGHT": "left up right",
      "RIGHT UP LEFT": "right up left",
      "LEFT RIGHT": "left right",
      "RIGHT LEFT": "right left",
      "UP DOWN": "up down",
      "DOWN UP": "down up",
      "UP RIGHT DOWN LEFT": "up right down left",
      "UP LEFT DOWN RIGHT": "up left down right",
      "UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT": "up up down down left right left right",
    },
  }),

  matrix: dropdown(),
  microbit_menu_buttons: dropdown(),
  microbit_menu_gestures: dropdown(),
  microbit_menu_tiltDirectionAny: dropdown(),
  microbit_menu_tiltDirection: dropdown(),
  microbit_menu_touchPins: dropdown(),
  microbit_whenButtonPressed: build`when ${{ input: "BTN" }} button pressed`,
  microbit_isButtonPressed: build`<${{ input: "BTN" }} button pressed?>`,
  microbit_whenGesture: build`when ${{ input: "GESTURE" }} :: microbit`,
  microbit_displaySymbol: build`display ${{ input: "MATRIX" }}`,
  microbit_displayText: build`display text ${{ input: "TEXT" }}`,
  microbit_displayClear: build`clear display`,
  microbit_whenTilted: build`when tilted ${{ input: "DIRECTION" }}`,
  microbit_isTilted: build`<tilted ${{ input: "DIRECTION" }} ?>`,
  microbit_getTiltAngle: build`(tilt angle ${{ input: "DIRECTION" }})`,
  microbit_whenPinConnected: build`when pin ${{ input: "PIN" }} connected`,
  microbit_menu_pinState: dropdown(),

  ev3_menu_motorPorts: dropdown({ useText: true }),
  ev3_motorTurnClockwise: build`motor ${{ input: "PORT" }} turn this way for ${{ input: "TIME" }} seconds`,
  ev3_motorTurnCounterClockwise: build`motor ${{ input: "PORT" }} turn that way for ${{ input: "TIME" }} seconds`,
  ev3_motorSetPower: build`motor ${{ input: "PORT" }} set power ${{ input: "POWER" }} %`,
  ev3_getMotorPosition: build`(motor ${{ input: "PORT" }} position)`,
  ev3_menu_sensorPorts: dropdown({ useText: true }),
  ev3_whenButtonPressed: build`when button ${{ input: "PORT" }} pressed`,
  ev3_whenDistanceLessThan: build`when distance \\< ${{ input: "DISTANCE" }}`,
  ev3_whenBrightnessLessThan: build`when brightness \\< ${{ input: "DISTANCE" }}`,
  ev3_buttonPressed: build`<button ${{ input: "PORT" }} pressed?>`,
  ev3_getDistance: simpleReporter("distance", "ev3"),
  ev3_getBrightness: simpleReporter("brightness", "ev3"),
  ev3_beep: build`beep note ${{ input: "NOTE" }} for ${{ input: "TIME" }} secs`,

  boost_menu_MOTOR_ID: dropdown(),
  boost_menu_MOTOR_DIRECTION: dropdown(),
  boost_menu_MOTOR_REPORTER_ID: dropdown(),
  boost_menu_COLOR: dropdown({ any: "any color" }),
  boost_menu_TILT_DIRECTION_ANY: dropdown(),
  boost_menu_TILT_DIRECTION: dropdown(),
  boost_motorOnFor: build`turn motor ${{ input: "MOTOR_ID" }} for ${{ input: "DURATION" }} seconds`,
  boost_motorOnForRotation: build`turn motor ${{ input: "MOTOR_ID" }} for ${{ input: "ROTATION" }} rotations`,
  boost_motorOn: build`turn motor ${{ input: "MOTOR_ID" }} on`,
  boost_motorOff: build`turn motor ${{ input: "MOTOR_ID" }} off`,
  boost_setMotorPower: build`set motor ${{ input: "MOTOR_ID" }} speed to ${{ input: "POWER" }} %`,
  boost_setMotorDirection: build`set motor ${{ input: "MOTOR_ID" }} direction ${{ input: "MOTOR_DIRECTION" }}`,
  boost_getMotorPosition: build`(motor ${{ input: "MOTOR_REPORTER_ID" }} position :: boost`,
  boost_whenColor: build`when ${{ input: "COLOR" }} brick seen`,
  boost_seeingColor: build`<seeing ${{ input: "COLOR" }} brick?>`,
  boost_whenTilted: build`when tilted ${{ input: "TILT_DIRECTION_ANY" }} :: boost`,
  boost_getTiltAngle: build`(tilt angle ${{ input: "TILT_DIRECTION" }} :: boost)`,
  boost_setLightHue: build`set light color to ${{ input: "HUE" }} :: boost`,

  wedo2_menu_MOTOR_ID: dropdown(),
  wedo2_menu_MOTOR_DIRECTION: dropdown(),
  wedo2_menu_OP: dropdown(),
  wedo2_menu_TILT_DIRECTION_ANY: dropdown(),
  wedo2_menu_TILT_DIRECTION: dropdown(),
  wedo2_motorOnFor: build`turn ${{ input: "MOTOR_ID" }} on for ${{ input: "DURATION" }} seconds`,
  wedo2_motorOn: build`turn ${{ input: "MOTOR_ID" }} on`,
  wedo2_motorOff: build`turn ${{ input: "MOTOR_ID" }} off`,
  wedo2_startMotorPower: build`set ${{ input: "MOTOR_ID" }} power to ${{ input: "POWER" }}`,
  wedo2_setMotorDirection: build`set ${{ input: "MOTOR_ID" }} direction to ${{ input: "MOTOR_DIRECTION" }}`,
  wedo2_setLightHue: build`set light color to ${{ input: "HUE" }}`,
  wedo2_whenDistance: build`when distance ${{ input: "OP" }} ${{ input: "REFERENCE" }}`,
  wedo2_whenTilted: build`when tilted ${{ input: "TILT_DIRECTION_ANY" }} :: wedo`,
  wedo2_getDistance: build`(distance :: wedo)`,
  wedo2_isTilted: build`<tilted ${{ input: "TILT_DIRECTION_ANY" }} ? :: wedo>`,
  wedo2_getTiltAngle: build`(tilt angle ${{ input: "TILT_DIRECTION" }} :: wedo)`,
  wedo2_playNoteFor: build`play note ${{ input: "NOTE" }} for ${{ input: "DURATION" }} seconds`,

  gdxfor_menu_gestureOptions: dropdown(),
  gdxfor_menu_pushPullOptions: dropdown(),
  gdxfor_menu_tiltAnyOptions: dropdown(),
  gdxfor_menu_tiltOptions: dropdown(),
  gdxfor_menu_axisOptions: dropdown(),
  gdxfor_whenGesture: build`when ${{ input: "GESTURE" }}`,
  gdxfor_whenForcePushedOrPulled: build`when force sensor ${{ input: "PUSH_PULL" }}`,
  gdxfor_getForce: simpleReporter("force", "gdxfor"),
  gdxfor_whenTilted: build`when tilted ${{ input: "TILT" }} :: gdxfor`,
  gdxfor_isTilted: build`<tilted ${{ input: "TILT" }} ? :: gdxfor>`,
  gdxfor_getTilt: build`(tilt angle ${{ input: "TILT" }} :: gdxfor)`,
  gdxfor_isFreeFalling: simpleReporter("falling?", "gdxfor", true),
  gdxfor_getSpinSpeed: build`(spin speed ${{ input: "DIRECTION" }})`,
  gdxfor_getAcceleration: build`(acceleration ${{ input: "DIRECTION" }})`,
};
