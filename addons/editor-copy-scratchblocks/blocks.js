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
    const inputConnection = block.getInput(component.input).connection;
    const inputBlock = inputConnection.targetBlock();
    if (inputBlock) {
      if (component.substack) {
        return getBlockCode(inputBlock, true).replaceAll(/^/gm, "   ") + "\n";
      } else {
        return getBlockCode(inputBlock);
      }
    } else if (inputConnection.check_.length === 1 && inputConnection.check_[0] === "Boolean") return "<>";
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

const numBlock = (field) => (block) => {
  const content = block.getFieldValue(field);
  return /^[0-9e.-]*$/.test(content) ? `(${content})` : `[${sanitize(content, strInpSanitizations)}]`;
};

const dropdown = (field) => (block) => `(${sanitize(block.getField(field).getText(), repSanitizations)} v)`;

const simpleReporter = (text, category) => () => {
  // TODO: override checking
  return `(${text})`;
}

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
    if (/^%[nbs]$/.test(component)) {
      const inputBlock = block.getInputTargetBlock(block.argumentIds_[argumentCount++]);
      if (!inputBlock) {
        if (component === "%b") {
          output += "<>";
        }
      } else {
        output += getBlockCode(inputBlock);
      }
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
  math_angle: numBlock("NUM"),
  math_integer: numBlock("NUM"),
  math_whole_number: numBlock("NUM"),
  math_positive_number: numBlock("NUM"),
  math_number: numBlock("NUM"),
  note: numBlock("NOTE"),
  text: build`[${{ field: "TEXT", sanitizations: strInpSanitizations }}]`,
  colour_picker: build`[${{ field: "COLOUR", sanitizations: strInpSanitizations }}]`,

  motion_movesteps: build`move ${{ input: "STEPS" }} steps`,
  motion_turnright: build`turn right ${{ input: "DEGREES" }} degrees`,
  motion_turnleft: build`turn left ${{ input: "DEGREES" }} degrees`,
  motion_pointindirection: build`point in direction ${{ input: "DIRECTION" }}`,
  motion_pointtowards_menu: dropdown("TOWARDS"),
  motion_pointtowards: build`point towards ${{ input: "TOWARDS" }}`,
  motion_goto_menu: dropdown("TO"),
  motion_gotoxy: build`go to x: ${{ input: "X" }} y: ${{ input: "Y" }}`,
  motion_goto: build`go to ${{ input: "TO" }}`,
  motion_glidesecstoxy: build`glide ${{ input: "SECS" }} secs to x: ${{ input: "X" }} y: ${{ input: "Y" }}`,
  motion_glideto_menu: dropdown("TO"),
  motion_glideto: build`glide ${{ input: "SECS" }} secs to ${{ input: "TO" }}`,
  motion_changexby: build`change x by ${{ input: "DX" }}`,
  motion_setx: build`set x to ${{ input: "X" }}`,
  motion_changeyby: build`change y by ${{ input: "DY" }}`,
  motion_sety: build`set y to ${{ input: "Y" }}`,
  motion_ifonedgebounce: build`if on edge, bounce`,
  motion_setrotationstyle: build`set rotation style [${{ field: "STYLE", sanitizations: dropdownSanitizations }} v]`,
  motion_xposition: simpleReporter("x position", "motion"),
  motion_yposition: simpleReporter("y position", "motion"),
  motion_direction: simpleReporter("direction", "motion"),
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
  looks_size: simpleReporter("size", "looks"),
  looks_costume: dropdown("COSTUME"),
  looks_switchcostumeto: build`switch costume to ${{ input: "COSTUME" }}`,
  looks_nextcostume: build`next costume`,
  looks_switchbackdropto: build`switch backdrop to ${{ input: "BACKDROP" }}`,
  looks_backdrops: dropdown("BACKDROP"),
  looks_gotofrontback: build`go to [${{ field: "FRONT_BACK", sanitizations: dropdownSanitizations }} v] layer`,
  looks_goforwardbackwardlayers: build`go [${{ field: "FORWARD_BACKWARD", sanitizations: dropdownSanitizations }} v] ${{
    input: "NUM",
  }} layers`,
  looks_backdropnumbername: build`(backdrop [${{ field: "NUMBER_NAME", sanitizations: dropdownSanitizations }} v])`,
  looks_costumenumbername: build`(costume [${{ field: "NUMBER_NAME", sanitizations: dropdownSanitizations }} v])`,
  looks_switchbackdroptoandwait: build`switch backdrop to ${{ input: "BACKDROP" }} and wait`,
  looks_nextbackdrop: build`next backdrop`,

  sound_sounds_menu: dropdown("SOUND_MENU"),
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
  sound_volume: simpleReporter("volume", "sound"),

  event_whentouchingobject: build`when this sprite touches ${{ input: "TOUCHINGOBJECTMENU" }}`,
  event_touchingobjectmenu: dropdown("TOUCHINGOBJECTMENU"),
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
  event_broadcast_menu: dropdown("BROADCAST_OPTION"),
  event_broadcast: build`broadcast ${{ input: "BROADCAST_INPUT" }}`,
  event_broadcastandwait: build`broadcast ${{ input: "BROADCAST_INPUT" }} and wait`,
  event_whenkeypressed: build`when [${{ field: "KEY_OPTION", sanitizations: dropdownSanitizations }} v] key pressed`,

  control_forever: build`forever\n${{ input: "SUBSTACK", substack: true }}end`,
  control_repeat: build`repeat ${{ input: "TIMES" }}\n${{ input: "SUBSTACK", substack: true }}end`,
  control_if: build`if ${{ input: "CONDITION" }} then\n${{ input: "SUBSTACK", substack: true }}end`,
  control_if_else: build`if ${{ input: "CONDITION" }} then\n${{
    input: "SUBSTACK",
    substack: true,
  }}else\n${{ input: "SUBSTACK2", substack: true }}end`,
  control_stop: build`stop [${{ field: "STOP_OPTION", sanitizations: dropdownSanitizations }} v]`,
  control_wait: build`wait ${{ input: "DURATION" }} seconds`,
  control_wait_until: build`wait until ${{ input: "CONDITION" }}`,
  control_repeat_until: build`repeat until ${{ input: "CONDITION" }}\n${{
    input: "SUBSTACK",
    substack: true,
  }}end`,

  control_while: build`while ${{ input: "CONDITION" }} {\n${{
    input: "SUBSTACK",
    substack: true,
  }}} @loopArrow :: control`,

  control_for_each: build`for each [${{ field: "VARIABLE", sanitizations: dropdownSanitizations }} v] in ${{
    input: "VALUE",
  }} {\n${{ input: "SUBSTACK", substack: true }}} @loopArrow :: control`,
  control_start_as_clone: build`when I start as a clone`,
  control_create_clone_of_menu: dropdown("CLONE_OPTION"),
  control_create_clone_of: build`create clone of ${{ input: "CLONE_OPTION" }}`,
  control_delete_this_clone: build`delete this clone`,
  control_get_counter: build`(counter :: control)`,
  control_incr_counter: build`increment counter :: control`,
  control_clear_counter: build`clear counter :: control`,
  control_all_at_once: build`all at once {\n${{ input: "SUBSTACK" }}} :: control`,

  sensing_touchingobject: build`<touching ${{ input: "TOUCHINGOBJECTMENU" }} ?>`,
  sensing_touchingobjectmenu: dropdown("TOUCHINGOBJECTMENU"),
  sensing_touchingcolor: build`<touching color ${{ input: "COLOR" }} ?>`,
  sensing_coloristouchingcolor: build`<colour ${{ input: "COLOR" }} is touching ${{ input: "COLOR2" }} ?>`,
  sensing_distanceto: build`(distance to ${{ input: "DISTANCETOMENU" }})`,
  sensing_distancetomenu: dropdown("DISTANCETOMENU"),
  sensing_askandwait: build`ask ${{ input: "QUESTION" }} and wait`,
  sensing_answer: simpleReporter("answer", "sensing"),
  sensing_keypressed: build`key ${{ input: "KEY_OPTION" }} pressed`,
  sensing_keyoptions: dropdown("KEY_OPTION"),
  sensing_mousedown: build`<mouse down?${{ override: "sensing" }}>`,
  sensing_mousex: simpleReporter("mouse x", "sensing"),
  sensing_mousey: simpleReporter("mouse y", "sensing"),
  sensing_setdragmode: build`set drag mode [${{ field: "DRAG_MODE", sanitizations: dropdownSanitizations }} v]`,
  sensing_loudness: simpleReporter("loudness", "sensing"),
  sensing_loud: build`<loud :: sensing>`,
  sensing_timer: simpleReporter("timer", "sensing"),
  sensing_resettimer: build`reset timer`,
  sensing_of_object_menu: dropdown("OBJECT"),
  sensing_of: build`([${{ field: "PROPERTY", sanitizations: dropdownSanitizations }} v] of ${{ input: "OBJECT" }})`,
  sensing_current: build`(current [${{ field: "CURRENTMENU", sanitizations: dropdownSanitizations }} v])`,
  sensing_dayssince2000: simpleReporter("days since 2000", "sensing"),
  sensing_username: simpleReporter("username", "sensing"),
  sensing_userid: simpleReporter("user id", "sensing"),

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
  data_listindexall: dropdown("INDEX"),
  data_listindexrandom: dropdown("INDEX"),
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
  pen_menu_colorParam: dropdown("colorParam"),
  pen_changePenColorParamBy: build`change pen ${{ input: "COLOR_PARAM" }} by ${{ input: "VALUE" }}`,
  pen_setPenColorParamTo: build`set pen ${{ input: "COLOR_PARAM" }} to ${{ input: "VALUE" }}`,
  pen_changePenSizeBy: build`change pen size by ${{ input: "SIZE" }}`,
  pen_setPenSizeTo: build`set pen size to ${{ input: "SIZE" }}`,
  pen_setPenShadeToNumber: build`set pen shade to ${{ input: "SHADE" }}`,
  pen_changePenShadeBy: build`change pen shade by ${{ input: "SHADE" }}`,
  pen_setPenHueToNumber: build`set pen hue to ${{ input: "HUE" }}`,
  pen_changePenHueBy: build`change pen hue by ${{ input: "HUE" }}`,

  music_menu_DRUM: dropdown("DRUM"),
  music_menu_INSTRUMENT: dropdown("INSTRUMENT"),
  music_playDrumForBeats: build`play drum ${{ input: "DRUM" }} for ${{ input: "BEATS" }} beats`,
  music_restForBeats: build`rest for ${{ input: "BEATS" }} beats`,
  music_playNoteForBeats: build`play note ${{ input: "NOTE" }} for ${{ input: "BEATS" }} beats`,
  music_setInstrument: build`set instrument to ${{ input: "INSTRUMENT" }}`,
  music_setTempo: build`set tempo to ${{ input: "TEMPO" }}`,
  music_changeTempo: build`change tempo by ${{ input: "TEMPO" }}`,
  music_getTempo: simpleReporter("tempo", "MUSIC"),

  videoSensing_whenMotionGreaterThan: build`when video motion > ${{ input: "REFERENCE" }}`,
  videoSensing_videoOn: build`(video ${{ input: "ATTRIBUTE" }} on ${{ input: "SUBJECT" }})`,
  videoSensing_menu_ATTRIBUTE: dropdown("ATTRIBUTE"),
  videoSensing_menu_SUBJECT: dropdown("SUBJECT"),
  videoSensing_videoToggle: build`turn video ${{ input: "VIDEO_STATE" }}`,
  videoSensing_menu_VIDEO_STATE: dropdown("VIDEO_STATE"),
  videoSensing_setVideoTransparency: build`set video transparency to ${{ input: "TRANSPARENCY" }}`,

  text2speech_speakAndWait: build`speak ${{ input: "WORDS" }}`,
  text2speech_setVoice: build`set voice to ${{ input: "VOICE" }}`,
  text2speech_menu_voices: dropdown("voices"),
  text2speech_setLanguage: build`set language to ${{ input: "LANGUAGE" }}`,
  text2speech_menu_languages: dropdown("languages"),

  translate_menu_languages: dropdown("languages"),
  translate_getTranslate: build`(translate ${{ input: "WORDS" }} to ${{ input: "LANGUAGE" }})`,
  translate_getViewerLanguage: simpleReporter("language", "TRANSLATE"),

  makeymakey_whenMakeyKeyPressed: build`when ${{ input: "KEY" }} key pressed`,
  makeymakey_menu_KEY: dropdown("KEY"),
  makeymakey_whenCodePressed: build`when ${{ input: "SEQUENCE" }} pressed in order`,
  makeymakey_menu_SEQUENCE: dropdown("SEQUENCE"),

  // TODO: microbit

  ev3_menu_motorPorts: dropdown("motorPorts"),
  ev3_motorTurnClockwise: build`motor ${{ input: "PORT" }} turn this way for ${{ input: "TIME" }} seconds`,
  ev3_motorTurnCounterClockwise: build`motor ${{ input: "PORT" }} turn that way for ${{ input: "TIME" }} seconds`,
  ev3_motorSetPower: build`motor ${{ input: "PORT" }} set power ${{ input: "POWER" }} %`,
  ev3_getMotorPosition: build`(motor ${{ input: "PORT" }} position)`,
  ev3_menu_sensorPorts: dropdown("sensorPorts"),
  ev3_whenButtonPressed: build`when button ${{ input: "PORT" }} pressed`,
  ev3_whenDistanceLessThan: build`when distance \\< ${{ input: "DISTANCE" }}`,
  ev3_whenBrightnessLessThan: build`when brightness \\< ${{ input: "DISTANCE" }}`,
  ev3_buttonPressed: build`<button ${{ input: "PORT" }} pressed?>`,
  ev3_getDistance: simpleReporter("distance", "EV3"),
  ev3_getBrightness: simpleReporter("brightness", "EV3"),
  ev3_beep: build`beep note ${{input: "NOTE"}} for ${{input: "TIME"}} secs`

  // TODO: add remaining extensions
};
