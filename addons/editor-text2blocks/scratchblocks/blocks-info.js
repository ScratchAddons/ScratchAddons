import { DROPDOWN, FIELD_DROPDOWN, BOOLEAN, SCRIPT } from "./type-enum.js";

// Constants for repeated options
const BACKDROP_OPTIONS = {
  LOOKS_NEXTBACKDROP: "next backdrop",
  LOOKS_PREVIOUSBACKDROP: "previous backdrop",
  LOOKS_RANDOMBACKDROP: "random backdrop",
};

const NUMBER_NAME_OPTIONS = {
  LOOKS_NUMBERNAME_NUMBER: "number",
  LOOKS_NUMBERNAME_NAME: "name",
};

const KEY_OPTIONS = {
  EVENT_WHENKEYPRESSED_SPACE: "space",
  EVENT_WHENKEYPRESSED_LEFT: "left arrow",
  EVENT_WHENKEYPRESSED_RIGHT: "right arrow",
  EVENT_WHENKEYPRESSED_UP: "up arrow",
  EVENT_WHENKEYPRESSED_DOWN: "down arrow",
  EVENT_WHENKEYPRESSED_ANY: "any",
};

const PEN_COLOR_PARAM_OPTIONS = {
  "pen.colorMenu.color": "color",
  "pen.colorMenu.saturation": "saturation",
  "pen.colorMenu.brightness": "brightness",
  "pen.colorMenu.transparency": "transparency",
};

const FACE_PART_OPTIONS = {
  "faceSensing.leftEye": "0",
  "faceSensing.rightEye": "1",
  "faceSensing.nose": "2",
  "faceSensing.mouth": "3",
  "faceSensing.leftEar": "4",
  "faceSensing.rightEar": "5",
  "faceSensing.betweenEyes": "6",
  "faceSensing.topOfHead": "7",
};

const MICROBIT_BUTTON_OPTIONS = {
  "raw:A": "A",
  "raw:B": "B",
  "microbit.buttonsMenu.any": "any",
};

const MICROBIT_TILT_DIRECTION_OPTIONS = {
  "microbit.tiltDirectionMenu.left": "left",
  "microbit.tiltDirectionMenu.right": "right",
  "microbit.tiltDirectionMenu.front": "front",
  "microbit.tiltDirectionMenu.back": "back",
};

const MICROBIT_TILT_DIRECTION_ANY_OPTIONS = {
  ...MICROBIT_TILT_DIRECTION_OPTIONS,
  "microbit.tiltDirectionMenu.any": "any",
};

const EV3_MOTOR_PORTS_OPTIONS = {
  "raw:A": "0",
  "raw:B": "1",
  "raw:C": "2",
  "raw:D": "3",
};

const EV3_SENSOR_PORTS_OPTIONS = {
  "raw:1": "1",
  "raw:2": "2",
  "raw:3": "3",
  "raw:4": "4",
};

const WEDO2_MOTOR_ID_OPTIONS = {
  "wedo2.motorId.default": "motor",
  "wedo2.motorId.a": "motor A",
  "wedo2.motorId.b": "motor B",
  "wedo2.motorId.all": "all motors",
};

const WEDO2_TILT_DIRECTION_OPTIONS = {
  "wedo2.tiltDirection.up": "up",
  "wedo2.tiltDirection.down": "down",
  "wedo2.tiltDirection.left": "left",
  "wedo2.tiltDirection.right": "right",
};

const GDXFORD_AXIS_OPTIONS = {
  "raw:x": "x",
  "raw:y": "y",
  "raw:z": "z",
};

const BOOST_MOTOR_ID_OPTIONS = {
  "raw:A": "A",
  "raw:B": "B",
  "raw:C": "C",
  "raw:D": "D",
  "raw:AB": "AB",
  "raw:ABCD": "ABCD",
};

const BOOST_TILT_DIRECTION_OPTIONS = {
  "boost.tiltDirection.left": "left",
  "boost.tiltDirection.right": "right",
  "boost.tiltDirection.up": "up",
  "boost.tiltDirection.down": "down",
};

// Param constants
const MOTOR_ID_PARAM = {
  name: "MOTOR_ID",
  opcode: "boost_menu_MOTOR_ID",
  type: DROPDOWN,
  options: BOOST_MOTOR_ID_OPTIONS,
};

const COLOR_PARAM = {
  name: "COLOR",
  opcode: "boost_menu_COLOR",
  type: DROPDOWN,
  options: {
    "boost.color.any": "any",
    "boost.color.red": "red",
    "boost.color.blue": "blue",
    "boost.color.green": "green",
    "boost.color.yellow": "yellow",
    "boost.color.white": "white",
    "boost.color.black": "black",
  },
};

const TILT_DIRECTION_ANY_PARAM = {
  name: "TILT_DIRECTION_ANY",
  opcode: "boost_menu_TILT_DIRECTION_ANY",
  type: DROPDOWN,
  options: {
    "boost.tiltDirection.left": "left",
    "boost.tiltDirection.right": "right",
    "boost.tiltDirection.up": "up",
    "boost.tiltDirection.down": "down",
    "boost.tiltDirection.any": "any",
  },
};

const TILT_DIRECTION_PARAM = {
  name: "TILT_DIRECTION",
  opcode: "boost_menu_TILT_DIRECTION",
  type: DROPDOWN,
  options: BOOST_TILT_DIRECTION_OPTIONS,
};

const EV3_MOTOR_PORT_PARAM = {
  name: "PORT",
  internal_field_name: "motorPorts",
  opcode: "ev3_menu_motorPorts",
  type: DROPDOWN,
  options: EV3_MOTOR_PORTS_OPTIONS,
};

const EV3_SENSOR_PORT_PARAM = {
  name: "PORT",
  internal_field_name: "sensorPorts",
  opcode: "ev3_menu_sensorPorts",
  type: DROPDOWN,
  options: EV3_SENSOR_PORTS_OPTIONS,
};

const WEDO2_MOTOR_ID_PARAM = {
  name: "MOTOR_ID",
  opcode: "wedo2_menu_MOTOR_ID",
  type: DROPDOWN,
  options: WEDO2_MOTOR_ID_OPTIONS,
};

const WEDO2_TILT_DIRECTION_PARAM = {
  name: "TILT_DIRECTION",
  opcode: "wedo2_menu_TILT_DIRECTION",
  type: DROPDOWN,
  options: WEDO2_TILT_DIRECTION_OPTIONS,
};

const GDXFORD_TILT_ANY_PARAM = {
  name: "TILT",
  internal_field_name: "tiltAnyOptions",
  opcode: "gdxfor_menu_tiltAnyOptions",
  type: DROPDOWN,
  options: {
    "gdxfor.tiltDirectionMenu.front": "front",
    "gdxfor.tiltDirectionMenu.back": "back",
    "gdxfor.tiltDirectionMenu.left": "left",
    "gdxfor.tiltDirectionMenu.right": "right",
    "gdxfor.tiltDirectionMenu.any": "any",
  },
};

const GDXFORD_AXIS_PARAM = {
  name: "DIRECTION",
  internal_field_name: "axisOptions",
  opcode: "gdxfor_menu_axisOptions",
  type: DROPDOWN,
  options: GDXFORD_AXIS_OPTIONS,
};

const MICROBIT_BUTTON_PARAM = {
  name: "BTN",
  internal_field_name: "buttons",
  opcode: "microbit_menu_buttons",
  type: DROPDOWN,
  options: MICROBIT_BUTTON_OPTIONS,
};

const MICROBIT_TILT_DIRECTION_ANY_PARAM = {
  name: "DIRECTION",
  internal_field_name: "tiltDirectionAny",
  opcode: "microbit_menu_tiltDirectionAny",
  type: DROPDOWN,
  options: MICROBIT_TILT_DIRECTION_ANY_OPTIONS,
};

const FACE_PART_PARAM = {
  name: "PART",
  type: FIELD_DROPDOWN,
  options: FACE_PART_OPTIONS,
};

const PEN_COLOR_PARAM_PARAM = {
  name: "COLOR_PARAM",
  internal_field_name: "colorParam",
  opcode: "pen_menu_colorParam",
  type: DROPDOWN,
  options: PEN_COLOR_PARAM_OPTIONS,
};

const NUMBER_NAME_PARAM = {
  name: "NUMBER_NAME",
  type: FIELD_DROPDOWN,
  options: NUMBER_NAME_OPTIONS,
};

const EFFECT_PARAM = {
  name: "EFFECT",
  type: FIELD_DROPDOWN,
  options: {
    LOOKS_EFFECT_COLOR: "COLOR",
    LOOKS_EFFECT_FISHEYE: "FISHEYE",
    LOOKS_EFFECT_WHIRL: "WHIRL",
    LOOKS_EFFECT_PIXELATE: "PIXELATE",
    LOOKS_EFFECT_MOSAIC: "MOSAIC",
    LOOKS_EFFECT_BRIGHTNESS: "BRIGHTNESS",
    LOOKS_EFFECT_GHOST: "GHOST",
  },
};

export const blocks_info = {
  motion_movesteps: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "STEPS",
        opcode: "math_number",
      },
    ],
  },
  motion_turnright: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "DEGREES",
        opcode: "math_number",
      },
    ],
  },
  motion_turnleft: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "DEGREES",
        opcode: "math_number",
      },
    ],
  },
  motion_pointindirection: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "DIRECTION",
        opcode: "math_angle",
      },
    ],
  },
  motion_pointtowards: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "TOWARDS",
        opcode: "motion_pointtowards_menu",
        type: DROPDOWN,
        options: {
          MOTION_POINTTOWARDS_POINTER: "_mouse_",
          MOTION_POINTTOWARDS_RANDOM: "_random_",
        },
        dynamicOptions: "sprites",
      },
    ],
  },
  motion_gotoxy: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "X",
        opcode: "math_number",
      },
      {
        name: "Y",
        opcode: "math_number",
      },
    ],
  },
  motion_goto: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "TO",
        opcode: "motion_goto_menu",
        type: DROPDOWN,
        options: {
          MOTION_GOTO_POINTER: "_mouse_",
          MOTION_GOTO_RANDOM: "_random_",
        },
        dynamicOptions: "sprites",
      },
    ],
  },
  motion_glidesecstoxy: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "SECS",
        opcode: "math_positive_number",
      },
      {
        name: "X",
        opcode: "math_number",
      },
      {
        name: "Y",
        opcode: "math_number",
      },
    ],
  },
  motion_glideto: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "TO",
        opcode: "motion_goto_menu",
        type: DROPDOWN,
        options: {
          MOTION_GLIDETO_POINTER: "_mouse_",
          MOTION_GLIDETO_RANDOM: "_random_",
        },
        dynamicOptions: "sprites",
      },
      {
        name: "SECS",
        opcode: "math_positive_number",
      },
    ],
  },
  motion_changexby: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "DX",
        opcode: "math_number",
      },
    ],
  },
  motion_setx: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "X",
        opcode: "math_number",
      },
    ],
  },
  motion_changeyby: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "DY",
        opcode: "math_number",
      },
    ],
  },
  motion_sety: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "Y",
        opcode: "math_number",
      },
    ],
  },
  motion_ifonedgebounce: {
    shape: "stack",
    category: "motion",
    params: [],
  },
  motion_setrotationstyle: {
    shape: "stack",
    category: "motion",
    params: [
      {
        name: "STYLE",
        type: FIELD_DROPDOWN,
        options: {
          MOTION_SETROTATIONSTYLE_LEFTRIGHT: "left-right",
          MOTION_SETROTATIONSTYLE_DONTROTATE: "don't rotate",
          MOTION_SETROTATIONSTYLE_ALLAROUND: "all around",
        },
      },
    ],
  },
  motion_xposition: {
    shape: "reporter",
    category: "motion",
    params: [],
  },
  motion_yposition: {
    shape: "reporter",
    category: "motion",
    params: [],
  },
  motion_direction: {
    shape: "reporter",
    category: "motion",
    params: [],
  },
  looks_sayforsecs: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "MESSAGE",
        opcode: "text",
      },
      {
        name: "SECS",
        opcode: "math_number",
      },
    ],
  },
  looks_say: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "MESSAGE",
        opcode: "text",
      },
    ],
  },
  looks_thinkforsecs: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "MESSAGE",
        opcode: "text",
      },
      {
        name: "SECS",
        opcode: "math_number",
      },
    ],
  },
  looks_think: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "MESSAGE",
        opcode: "text",
      },
    ],
  },
  looks_show: {
    shape: "stack",
    category: "looks",
    params: [],
  },
  looks_hide: {
    shape: "stack",
    category: "looks",
    params: [],
  },
  looks_switchcostumeto: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "COSTUME",
        opcode: "looks_costume",
        type: DROPDOWN,
        dynamicOptions: "costumes",
      },
    ],
  },
  looks_nextcostume: {
    shape: "stack",
    category: "looks",
    params: [],
  },
  looks_nextbackdrop_block: {
    shape: "stack",
    category: "looks",
    params: [],
  },
  looks_switchbackdropto: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "BACKDROP",
        opcode: "looks_backdrops",
        type: DROPDOWN,
        options: BACKDROP_OPTIONS,
        dynamicOptions: "backdrops",
      },
    ],
  },
  looks_switchbackdroptoandwait: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "BACKDROP",
        opcode: "looks_backdrops",
        type: DROPDOWN,
        options: BACKDROP_OPTIONS,
        dynamicOptions: "backdrops",
      },
    ],
  },
  looks_changeeffectby: {
    shape: "stack",
    category: "looks",
    params: [
      EFFECT_PARAM,
      {
        name: "CHANGE",
        opcode: "math_number",
      },
    ],
  },
  looks_seteffectto: {
    shape: "stack",
    category: "looks",
    params: [
      EFFECT_PARAM,
      {
        name: "VALUE",
        opcode: "math_number",
      },
    ],
  },
  looks_cleargraphiceffects: {
    shape: "stack",
    category: "looks",
    params: [],
  },
  looks_changesizeby: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "CHANGE",
        opcode: "math_number",
      },
    ],
  },
  looks_setsizeto: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "SIZE",
        opcode: "math_number",
      },
    ],
  },
  looks_gotofrontback: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "FRONT_BACK",
        type: FIELD_DROPDOWN,
        options: {
          LOOKS_GOTOFRONTBACK_FRONT: "front",
          LOOKS_GOTOFRONTBACK_BACK: "back",
        },
      },
    ],
  },
  looks_goforwardbackwardlayers: {
    shape: "stack",
    category: "looks",
    params: [
      {
        name: "FORWARD_BACKWARD",
        type: FIELD_DROPDOWN,
        options: {
          LOOKS_GOFORWARDBACKWARDLAYERS_FORWARD: "forward",
          LOOKS_GOFORWARDBACKWARDLAYERS_BACKWARD: "backward",
        },
      },
      {
        name: "NUM",
        opcode: "math_integer",
      },
    ],
  },
  looks_costumenumbername: {
    shape: "reporter",
    category: "looks",
    params: [NUMBER_NAME_PARAM],
  },
  looks_backdropnumbername: {
    shape: "reporter",
    category: "looks",
    params: [NUMBER_NAME_PARAM],
  },
  looks_size: {
    shape: "reporter",
    category: "looks",
    params: [],
  },
  sound_play: {
    shape: "stack",
    category: "sound",
    params: [
      {
        name: "SOUND_MENU",
        opcode: "sound_sounds_menu",
        type: DROPDOWN,
        dynamicOptions: "sounds",
      },
    ],
  },
  sound_changeeffectby: {
    shape: "stack",
    category: "sound",
    params: [
      {
        name: "EFFECT",
        type: FIELD_DROPDOWN,
        options: {
          SOUND_EFFECTS_PITCH: "PITCH",
          SOUND_EFFECTS_PAN: "PAN",
        },
      },
      {
        name: "VALUE",
        opcode: "math_number",
      },
    ],
  },
  sound_seteffecto: {
    shape: "stack",
    category: "sound",
    params: [],
  },
  sound_cleareffects: {
    shape: "stack",
    category: "sound",
    params: [],
  },
  sound_playuntildone: {
    shape: "stack",
    category: "sound",
    params: [
      {
        name: "SOUND_MENU",
        opcode: "sound_sounds_menu",
        type: DROPDOWN,
        dynamicOptions: "sounds",
      },
    ],
  },
  sound_stopallsounds: {
    shape: "stack",
    category: "sound",
    params: [],
  },
  sound_changevolumeby: {
    shape: "stack",
    category: "sound",
    params: [],
  },
  sound_setvolumeto: {
    shape: "stack",
    category: "sound",
    params: [
      {
        name: "VOLUME",
        opcode: "math_number",
      },
    ],
  },
  sound_volume: {
    shape: "reporter",
    category: "sound",
    params: [],
  },
  event_whenflagclicked: {
    shape: "hat",
    category: "events",
    params: [],
  },
  event_whenkeypressed: {
    shape: "hat",
    category: "events",
    params: [
      {
        name: "KEY_OPTION",
        type: FIELD_DROPDOWN,
        options: KEY_OPTIONS,
        dynamicOptions: "keys",
      },
    ],
  },
  event_whenthisspriteclicked: {
    shape: "hat",
    category: "events",
    params: [],
  },
  event_whenstageclicked: {
    shape: "hat",
    category: "events",
    params: [],
  },
  event_whenbackdropswitchesto: {
    shape: "hat",
    category: "events",
    params: [
      {
        name: "BACKDROP",
        type: FIELD_DROPDOWN,
        dynamicOptions: "backdrops",
      },
    ],
  },
  event_whengreaterthan: {
    shape: "hat",
    category: "events",
    params: [
      {
        name: "WHENGREATERTHANMENU",
        type: FIELD_DROPDOWN,
        options: {
          EVENT_WHENGREATERTHAN_LOUDNESS: "loudness",
          EVENT_WHENGREATERTHAN_TIMER: "timer",
        },
      },
      {
        name: "VALUE",
        opcode: "math_number",
      },
    ],
  },
  event_whenbroadcastreceived: {
    shape: "hat",
    category: "events",
    params: [
      {
        name: "BROADCAST_OPTION",
        type: FIELD_DROPDOWN,
        dynamicOptions: "messages",
      },
    ],
  },
  event_broadcast: {
    shape: "stack",
    category: "events",
    params: [
      {
        name: "BROADCAST_INPUT",
        internal_field_name: "BROADCAST_OPTION",
        opcode: "event_broadcast_menu",
        type: DROPDOWN,
        dynamicOptions: "messages",
      },
    ],
  },
  event_broadcastandwait: {
    shape: "stack",
    category: "events",
    params: [
      {
        name: "BROADCAST_INPUT",
        internal_field_name: "BROADCAST_OPTION",
        opcode: "event_broadcast_menu",
        type: DROPDOWN,
        dynamicOptions: "messages",
      },
    ],
  },
  control_wait: {
    shape: "stack",
    category: "control",
    params: [
      {
        name: "DURATION",
        opcode: "math_positive_number",
      },
    ],
  },
  control_repeat: {
    shape: "c-block",
    category: "control",
    params: [
      {
        name: "TIMES",
        opcode: "math_whole_number",
      },
      {
        name: "SUBSTACK",
        type: SCRIPT,
      },
    ],
  },
  control_forever: {
    shape: "c-block cap",
    category: "control",
    params: [
      {
        name: "SUBSTACK",
        type: SCRIPT,
      },
    ],
  },
  control_if: {
    shape: "c-block",
    category: "control",
    params: [
      {
        name: "CONDITION",
        type: BOOLEAN,
      },
      {
        name: "SUBSTACK",
        type: SCRIPT,
      },
    ],
  },
  control_if_else: {
    shape: "c-block",
    category: "control",
    params: [
      {
        name: "CONDITION",
        type: BOOLEAN,
      },
      {
        name: "SUBSTACK",
        type: SCRIPT,
      },
      {
        name: "SUBSTACK2",
        type: SCRIPT,
      },
    ],
    skipLocaleBuild: true,
  },
  control_wait_until: {
    id: "CONTROL_WAITUNTIL",
    shape: "stack",
    category: "control",
    params: [
      {
        name: "CONDITION",
        type: BOOLEAN,
      },
    ],
  },
  control_repeat_until: {
    id: "CONTROL_REPEATUNTIL",
    shape: "c-block",
    category: "control",
    params: [
      {
        name: "CONDITION",
        type: BOOLEAN,
      },
      {
        name: "SUBSTACK",
        type: SCRIPT,
      },
    ],
  },
  control_stop: {
    shape: "cap",
    category: "control",
    params: [
      {
        name: "STOP_OPTION",
        type: FIELD_DROPDOWN,
        options: {
          CONTROL_STOP_ALL: "all",
          CONTROL_STOP_THIS: "this script",
          CONTROL_STOP_OTHER: "other scripts in sprite",
        },
      },
    ],
  },
  control_start_as_clone: {
    id: "CONTROL_STARTASCLONE",
    shape: "hat",
    category: "control",
    params: [],
  },
  control_create_clone_of: {
    id: "CONTROL_CREATECLONEOF",
    shape: "stack",
    category: "control",
    params: [
      {
        name: "CLONE_OPTION",
        opcode: "control_create_clone_of_menu",
        type: DROPDOWN,
        options: {
          CONTROL_CREATECLONEOF_MYSELF: "_myself_",
        },
        dynamicOptions: "sprites",
      },
    ],
  },
  control_delete_this_clone: {
    id: "CONTROL_DELETETHISCLONE",
    shape: "cap",
    category: "control",
    params: [],
  },
  data_variable: {
    shape: "reporter",
    category: "variables",
    params: [],
    skipLocaleBuild: true,
  },
  data_setvariableto: {
    shape: "stack",
    category: "variables",
    params: [
      {
        name: "VARIABLE",
        type: FIELD_DROPDOWN,
        dynamicOptions: "variables",
      },
      {
        name: "VALUE",
        opcode: "text",
      },
    ],
  },
  data_changevariableby: {
    shape: "stack",
    category: "variables",
    params: [
      {
        name: "VARIABLE",
        type: FIELD_DROPDOWN,
        dynamicOptions: "variables",
      },
      {
        name: "VALUE",
        opcode: "math_number",
      },
    ],
  },
  data_showvariable: {
    shape: "stack",
    category: "variables",
    params: [
      {
        name: "VARIABLE",
        type: FIELD_DROPDOWN,
        dynamicOptions: "variables",
      },
    ],
  },
  data_hidevariable: {
    shape: "stack",
    category: "variables",
    params: [
      {
        name: "VARIABLE",
        type: FIELD_DROPDOWN,
        dynamicOptions: "variables",
      },
    ],
  },
  data_listcontents: {
    shape: "reporter",
    category: "list",
    params: [],
    skipLocaleBuild: true,
  },
  data_addtolist: {
    shape: "stack",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
      {
        name: "ITEM",
        opcode: "text",
      },
    ],
  },
  data_deleteoflist: {
    shape: "stack",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
      {
        name: "INDEX",
        opcode: "math_integer",
      },
    ],
  },
  data_deletealloflist: {
    shape: "stack",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
    ],
  },
  data_insertatlist: {
    shape: "stack",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
      {
        name: "INDEX",
        opcode: "math_integer",
      },
      {
        name: "ITEM",
        opcode: "text",
      },
    ],
  },
  data_replaceitemoflist: {
    shape: "stack",
    category: "list",
    params: [
      {
        name: "INDEX",
        opcode: "math_integer",
      },
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
      {
        name: "ITEM",
        opcode: "text",
      },
    ],
  },
  data_showlist: {
    shape: "stack",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
    ],
  },
  data_hidelist: {
    shape: "stack",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
    ],
  },
  data_itemoflist: {
    shape: "reporter",
    category: "list",
    params: [
      {
        name: "INDEX",
        opcode: "math_integer",
      },
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
    ],
  },
  data_itemnumoflist: {
    shape: "reporter",
    category: "list",
    params: [
      {
        name: "ITEM",
        opcode: "text",
      },
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
    ],
  },
  data_lengthoflist: {
    shape: "reporter",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
    ],
  },
  data_listcontainsitem: {
    shape: "boolean",
    category: "list",
    params: [
      {
        name: "LIST",
        type: FIELD_DROPDOWN,
        dynamicOptions: "lists",
      },
      {
        name: "ITEM",
        opcode: "text",
      },
    ],
  },
  sensing_touchingobject: {
    shape: "boolean",
    category: "sensing",
    params: [
      {
        name: "TOUCHINGOBJECTMENU",
        opcode: "sensing_touchingobjectmenu",
        type: DROPDOWN,
        options: {
          SENSING_TOUCHINGOBJECT_POINTER: "_mouse_",
          SENSING_TOUCHINGOBJECT_EDGE: "_edge_",
        },
        dynamicOptions: "sprites",
      },
    ],
  },
  sensing_touchingcolor: {
    shape: "boolean",
    category: "sensing",
    params: [
      {
        name: "COLOR",
        opcode: "colour_picker",
      },
    ],
  },
  sensing_coloristouchingcolor: {
    shape: "boolean",
    category: "sensing",
    params: [
      {
        name: "COLOR",
        opcode: "colour_picker",
      },
      {
        name: "COLOR2",
        opcode: "colour_picker",
      },
    ],
  },
  sensing_distanceto: {
    shape: "reporter",
    category: "sensing",
    params: [
      {
        name: "DISTANCETOMENU",
        opcode: "sensing_distancetomenu",
        type: DROPDOWN,
        options: {
          SENSING_DISTANCETO_POINTER: "_mouse_",
        },
        dynamicOptions: "sprites",
      },
    ],
  },
  sensing_answer: {
    shape: "reporter",
    category: "sensing",
    params: [],
  },
  sensing_keypressed: {
    shape: "boolean",
    category: "sensing",
    params: [
      {
        name: "KEY_OPTION",
        opcode: "sensing_keyoptions",
        type: DROPDOWN,
        options: KEY_OPTIONS,
        dynamicOptions: "keys",
      },
    ],
  },
  sensing_mousedown: {
    shape: "boolean",
    category: "sensing",
    params: [],
  },
  sensing_mousex: {
    shape: "reporter",
    category: "sensing",
    params: [],
  },
  sensing_mousey: {
    shape: "reporter",
    category: "sensing",
    params: [],
  },
  sensing_setdragmode: {
    shape: "stack",
    category: "sensing",
    params: [
      {
        name: "DRAG_MODE",
        type: FIELD_DROPDOWN,
        options: {
          SENSING_SETDRAGMODE_DRAGGABLE: "draggable",
          SENSING_SETDRAGMODE_NOTDRAGGABLE: "not draggable",
        },
      },
    ],
  },
  sensing_loudness: {
    shape: "reporter",
    category: "sensing",
    params: [],
  },
  sensing_timer: {
    shape: "reporter",
    category: "sensing",
    params: [],
  },
  sensing_resettimer: {
    shape: "stack",
    category: "sensing",
    params: [],
  },
  sensing_of: {
    shape: "reporter",
    category: "sensing",
    params: [
      {
        name: "PROPERTY",
        type: FIELD_DROPDOWN,
        options: {
          SENSING_OF_XPOSITION: "x position",
          SENSING_OF_YPOSITION: "y position",
          SENSING_OF_DIRECTION: "direction",
          SENSING_OF_COSTUMENUMBER: "costume #",
          SENSING_OF_COSTUMENAME: "costume name",
          SENSING_OF_SIZE: "size",
          SENSING_OF_VOLUME: "volume",
          SENSING_OF_BACKDROPNUMBER: "backdrop #",
          SENSING_OF_BACKDROPNAME: "backdrop name",
        },
        dynamicOptions: "targetVariables",
      },
      {
        name: "OBJECT",
        opcode: "sensing_of_object_menu",
        type: DROPDOWN,
        options: {
          SENSING_OF_STAGE: "_stage_",
        },
        dynamicOptions: "sprites",
      },
    ],
  },
  sensing_current: {
    shape: "reporter",
    category: "sensing",
    params: [
      {
        name: "CURRENTMENU",
        type: FIELD_DROPDOWN,
        options: {
          SENSING_CURRENT_YEAR: "YEAR",
          SENSING_CURRENT_MONTH: "MONTH",
          SENSING_CURRENT_DATE: "DATE",
          SENSING_CURRENT_DAYOFWEEK: "DAYOFWEEK",
          SENSING_CURRENT_HOUR: "HOUR",
          SENSING_CURRENT_MINUTE: "MINUTE",
          SENSING_CURRENT_SECOND: "SECOND",
        },
      },
    ],
  },
  sensing_dayssince2000: {
    shape: "reporter",
    category: "sensing",
    params: [],
  },
  sensing_username: {
    shape: "reporter",
    category: "sensing",
    params: [],
  },
  sensing_askandwait: {
    shape: "stack",
    category: "sensing",
    params: [
      {
        name: "QUESTION",
        opcode: "text",
      },
    ],
  },
  operator_add: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "NUM1",
        opcode: "math_number",
      },
      {
        name: "NUM2",
        opcode: "math_number",
      },
    ],
  },
  operator_subtract: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "NUM1",
        opcode: "math_number",
      },
      {
        name: "NUM2",
        opcode: "math_number",
      },
    ],
  },
  operator_multiply: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "NUM1",
        opcode: "math_number",
      },
      {
        name: "NUM2",
        opcode: "math_number",
      },
    ],
  },
  operator_divide: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "NUM1",
        opcode: "math_number",
      },
      {
        name: "NUM2",
        opcode: "math_number",
      },
    ],
  },
  operator_random: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "FROM",
        opcode: "math_number",
      },
      {
        name: "TO",
        opcode: "math_number",
      },
    ],
  },
  operator_lt: {
    shape: "boolean",
    category: "operators",
    params: [
      {
        name: "OPERAND1",
        opcode: "text",
      },
      {
        name: "OPERAND2",
        opcode: "text",
      },
    ],
  },
  operator_equals: {
    shape: "boolean",
    category: "operators",
    params: [
      {
        name: "OPERAND1",
        opcode: "text",
      },
      {
        name: "OPERAND2",
        opcode: "text",
      },
    ],
  },
  operator_gt: {
    shape: "boolean",
    category: "operators",
    params: [
      {
        name: "OPERAND1",
        opcode: "text",
      },
      {
        name: "OPERAND2",
        opcode: "text",
      },
    ],
  },
  operator_and: {
    shape: "boolean",
    category: "operators",
    params: [
      {
        name: "OPERAND1",
        type: BOOLEAN,
      },
      {
        name: "OPERAND2",
        type: BOOLEAN,
      },
    ],
  },
  operator_or: {
    shape: "boolean",
    category: "operators",
    params: [
      {
        name: "OPERAND1",
        type: BOOLEAN,
      },
      {
        name: "OPERAND2",
        type: BOOLEAN,
      },
    ],
  },
  operator_not: {
    shape: "boolean",
    category: "operators",
    params: [
      {
        name: "OPERAND",
        type: BOOLEAN,
      },
    ],
  },
  operator_join: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "STRING1",
        opcode: "text",
      },
      {
        name: "STRING2",
        opcode: "text",
      },
    ],
  },
  operator_letterof: {
    shape: "reporter",
    category: "operators",
    params: [],
  },
  operator_length: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "STRING",
        opcode: "text",
      },
    ],
  },
  operator_mod: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "NUM1",
        opcode: "math_number",
      },
      {
        name: "NUM2",
        opcode: "math_number",
      },
    ],
  },
  operator_round: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "NUM",
        opcode: "math_number",
      },
    ],
  },
  operator_mathop: {
    shape: "reporter",
    category: "operators",
    params: [
      {
        name: "OPERATOR",
        type: FIELD_DROPDOWN,
        options: {
          OPERATORS_MATHOP_ABS: "abs",
          OPERATORS_MATHOP_FLOOR: "floor",
          OPERATORS_MATHOP_CEILING: "ceiling",
          OPERATORS_MATHOP_SQRT: "sqrt",
          OPERATORS_MATHOP_SIN: "sin",
          OPERATORS_MATHOP_COS: "cos",
          OPERATORS_MATHOP_TAN: "tan",
          OPERATORS_MATHOP_ASIN: "asin",
          OPERATORS_MATHOP_ACOS: "acos",
          OPERATORS_MATHOP_ATAN: "atan",
          OPERATORS_MATHOP_LN: "ln",
          OPERATORS_MATHOP_LOG: "log",
          OPERATORS_MATHOP_EEXP: "e ^",
          OPERATORS_MATHOP_10EXP: "10 ^",
        },
      },
      {
        name: "NUM",
        opcode: "math_number",
      },
    ],
  },
  operator_contains: {
    shape: "boolean",
    category: "operators",
    params: [
      {
        name: "STRING1",
        opcode: "text",
      },
      {
        name: "STRING2",
        opcode: "text",
      },
    ],
  },
  music_getTempo: {
    shape: "reporter",
    category: "music",
    params: [],
  },
  music_playDrumForBeats: {
    shape: "stack",
    category: "music",
    params: [
      {
        name: "DRUM",
        opcode: "music_menu_DRUM",
        type: DROPDOWN,
        options: {
          "music.drumSnare": "1",
          "music.drumBass": "2",
          "music.drumSideStick": "3",
          "music.drumCrashCymbal": "4",
          "music.drumOpenHiHat": "5",
          "music.drumClosedHiHat": "6",
          "music.drumTambourine": "7",
          "music.drumHandClap": "8",
          "music.drumClaves": "9",
          "music.drumWoodBlock": "10",
          "music.drumCowbell": "11",
          "music.drumTriangle": "12",
          "music.drumBongo": "13",
          "music.drumConga": "14",
          "music.drumCabasa": "15",
          "music.drumGuiro": "16",
          "music.drumVibraslap": "17",
          "music.drumCuica": "18",
        },
      },
      {
        name: "BEATS",
        opcode: "math_number",
      },
    ],
  },
  music_restForBeats: {
    shape: "stack",
    category: "music",
    params: [
      {
        name: "BEATS",
        opcode: "math_number",
      },
    ],
  },
  music_playNoteForBeats: {
    shape: "stack",
    category: "music",
    params: [
      {
        name: "NOTE",
        opcode: "note",
      },
      {
        name: "BEATS",
        opcode: "math_number",
      },
    ],
  },
  music_setInstrument: {
    shape: "stack",
    category: "music",
    params: [
      {
        name: "INSTRUMENT",
        opcode: "music_menu_INSTRUMENT",
        type: DROPDOWN,
        options: {
          "music.instrumentPiano": "1",
          "music.instrumentElectricPiano": "2",
          "music.instrumentOrgan": "3",
          "music.instrumentGuitar": "4",
          "music.instrumentElectricGuitar": "5",
          "music.instrumentBass": "6",
          "music.instrumentPizzicato": "7",
          "music.instrumentCello": "8",
          "music.instrumentTrombone": "9",
          "music.instrumentClarinet": "10",
          "music.instrumentSaxophone": "11",
          "music.instrumentFlute": "12",
          "music.instrumentWoodenFlute": "13",
          "music.instrumentBassoon": "14",
          "music.instrumentChoir": "15",
          "music.instrumentVibraphone": "16",
          "music.instrumentMusicBox": "17",
          "music.instrumentSteelDrum": "18",
          "music.instrumentMarimba": "19",
          "music.instrumentSynthLead": "20",
          "music.instrumentSynthPad": "21",
        },
      },
    ],
  },
  music_changeTempo: {
    shape: "stack",
    category: "music",
    params: [
      {
        name: "TEMPO",
        opcode: "math_number",
      },
    ],
  },
  music_setTempo: {
    shape: "stack",
    category: "music",
    params: [
      {
        name: "TEMPO",
        opcode: "math_number",
      },
    ],
  },
  pen_clear: {
    shape: "stack",
    category: "pen",
    params: [],
  },
  pen_stamp: {
    shape: "stack",
    category: "pen",
    params: [],
  },
  pen_penDown: {
    shape: "stack",
    category: "pen",
    params: [],
  },
  pen_penUp: {
    shape: "stack",
    category: "pen",
    params: [],
  },
  pen_setPenColorToColor: {
    id: "pen.setColor",
    shape: "stack",
    category: "pen",
    params: [
      {
        name: "COLOR",
        opcode: "colour_picker",
      },
    ],
  },
  pen_changePenHueBy: {
    id: "pen.changeHue",
    shape: "stack",
    category: "pen",
    params: [
      {
        name: "HUE",
        opcode: "math_number",
      },
    ],
  },
  pen_setPenColorParamTo: {
    id: "pen.setColorParam",
    shape: "stack",
    category: "pen",
    params: [
      PEN_COLOR_PARAM_PARAM,
      {
        name: "VALUE",
        opcode: "math_number",
      },
    ],
  },
  pen_changePenColorParamBy: {
    id: "pen.changeColorParam",
    shape: "stack",
    category: "pen",
    params: [
      PEN_COLOR_PARAM_PARAM,
      {
        name: "VALUE",
        opcode: "math_number",
      },
    ],
  },
  pen_setPenHueToNumber: {
    id: "pen.setHue",
    shape: "stack",
    category: "pen",
    params: [
      {
        name: "HUE",
        opcode: "math_number",
      },
    ],
  },
  pen_changePenShadeBy: {
    id: "pen.changeShade",
    shape: "stack",
    category: "pen",
    params: [
      {
        name: "SHADE",
        opcode: "math_number",
      },
    ],
  },
  pen_setPenShadeToNumber: {
    id: "pen.setShade",
    shape: "stack",
    category: "pen",
    params: [
      {
        name: "SHADE",
        opcode: "math_number",
      },
    ],
  },
  pen_changePenSizeBy: {
    id: "pen.changeSize",
    shape: "stack",
    category: "pen",
    params: [
      {
        name: "SIZE",
        opcode: "math_number",
      },
    ],
  },
  pen_setPenSizeTo: {
    id: "pen.setSize",
    shape: "stack",
    category: "pen",
    params: [
      {
        name: "SIZE",
        opcode: "math_number",
      },
    ],
  },
  videoSensing_videoToggle: {
    shape: "stack",
    category: "video",
    params: [
      {
        name: "VIDEO_STATE",
        opcode: "videoSensing_menu_VIDEO_STATE",
        type: DROPDOWN,
        options: {
          "videoSensing.on": "on",
          "videoSensing.off": "off",
          "videoSensing.onFlipped": "on-flipped",
        },
      },
    ],
  },
  videoSensing_setVideoTransparency: {
    shape: "stack",
    category: "video",
    params: [
      {
        name: "TRANSPARENCY",
        opcode: "math_number",
      },
    ],
  },
  videoSensing_whenMotionGreaterThan: {
    shape: "hat",
    category: "video",
    params: [
      {
        name: "REFERENCE",
        opcode: "math_number",
      },
    ],
  },
  videoSensing_videoOn: {
    shape: "reporter",
    category: "video",
    params: [
      {
        name: "ATTRIBUTE",
        opcode: "videoSensing_menu_ATTRIBUTE",
        type: DROPDOWN,
        options: {
          "videoSensing.motion": "motion",
          "videoSensing.direction": "direction",
        },
      },
      {
        name: "SUBJECT",
        opcode: "videoSensing_menu_SUBJECT",
        type: DROPDOWN,
        options: {
          "videoSensing.stage": "Stage",
          "videoSensing.sprite": "this sprite",
        },
      },
    ],
  },
  faceSensing_goToPart: {
    shape: "stack",
    category: "faceSensing",
    params: [FACE_PART_PARAM],
  },
  faceSensing_pointInFaceTiltDirection: {
    shape: "stack",
    category: "faceSensing",
    params: [],
  },
  faceSensing_setSizeToFaceSize: {
    shape: "stack",
    category: "faceSensing",
    params: [],
  },
  faceSensing_whenTilted: {
    shape: "hat",
    category: "faceSensing",
    params: [
      {
        name: "DIRECTION",
        type: FIELD_DROPDOWN,
        options: {
          "faceSensing.left": "left",
          "faceSensing.right": "right",
        },
      },
    ],
  },
  faceSensing_whenSpriteTouchesPart: {
    shape: "hat",
    category: "faceSensing",
    params: [FACE_PART_PARAM],
  },
  faceSensing_whenFaceDetected: {
    shape: "hat",
    category: "faceSensing",
    params: [],
  },
  faceSensing_faceIsDetected: {
    id: "faceSensing.faceDetected",
    shape: "boolean",
    category: "faceSensing",
    params: [],
  },
  faceSensing_faceTilt: {
    shape: "reporter",
    category: "faceSensing",
    params: [],
  },
  faceSensing_faceSize: {
    shape: "reporter",
    category: "faceSensing",
    params: [],
  },
  text2speech_speakAndWait: {
    id: "text2speech.speakAndWaitBlock",
    shape: "stack",
    category: "tts",
    params: [
      {
        name: "WORDS",
        opcode: "text",
      },
    ],
  },
  text2speech_setVoice: {
    id: "text2speech.setVoiceBlock",
    shape: "stack",
    category: "tts",
    params: [
      {
        name: "VOICE",
        internal_field_name: "voices",
        opcode: "text2speech_menu_voices",
        type: DROPDOWN,
        options: {
          "text2speech.alto": "ALTO",
          "text2speech.tenor": "TENOR",
          "text2speech.squeak": "SQUEAK",
          "text2speech.giant": "GIANT",
          "text2speech.kitten": "KITTEN",
        },
      },
    ],
  },
  text2speech_setLanguage: {
    id: "text2speech.setLanguageBlock",
    shape: "stack",
    category: "tts",
    params: [
      {
        name: "LANGUAGE",
        internal_field_name: "languages",
        opcode: "text2speech_menu_languages",
        type: DROPDOWN,
        options: {
          // TODO
        },
      },
    ],
  },
  translate_getTranslate: {
    id: "translate.translateBlock",
    shape: "reporter",
    category: "translate",
    params: [
      {
        name: "WORDS",
        opcode: "text",
      },
      {
        name: "LANGUAGE",
        internal_field_name: "languages",
        opcode: "translate_menu_languages",
        type: DROPDOWN,
        options: {
          // TODO
        },
      },
    ],
  },
  translate_getViewerLanguage: {
    id: "translate.viewerLanguage",
    shape: "reporter",
    category: "translate",
    params: [],
  },
  makeymakey_whenMakeyKeyPressed: {
    id: "makeymakey.whenKeyPressed",
    shape: "hat",
    category: "makeymakey",
    params: [
      {
        name: "KEY",
        opcode: "makeymakey_menu_KEY",
        type: DROPDOWN,
        options: {
          EVENT_WHENKEYPRESSED_SPACE: "SPACE",
          EVENT_WHENKEYPRESSED_LEFT: "LEFT",
          EVENT_WHENKEYPRESSED_RIGHT: "RIGHT",
          EVENT_WHENKEYPRESSED_UP: "UP",
          EVENT_WHENKEYPRESSED_DOWN: "DOWN",
        },
        dynamicOptions: "keys",
      },
    ],
  },
  makeymakey_whenCodePressed: {
    id: "makeymakey.whenKeysPressedInOrder",
    shape: "hat",
    category: "makeymakey",
    params: [
      {
        name: "SEQUENCE",
        opcode: "makeymakey_menu_SEQUENCE",
        type: DROPDOWN,
        dynamicOptions: "makeymakeySequences",
      },
    ],
  },
  microbit_whenButtonPressed: {
    shape: "hat",
    category: "microbit",
    params: [MICROBIT_BUTTON_PARAM],
  },
  microbit_isButtonPressed: {
    shape: "boolean",
    category: "microbit",
    params: [MICROBIT_BUTTON_PARAM],
  },
  microbit_whenGesture: {
    shape: "hat",
    category: "microbit",
    params: [
      {
        name: "GESTURE",
        internal_field_name: "gestures",
        opcode: "microbit_menu_gestures",
        type: DROPDOWN,
        options: {
          "microbit.gesturesMenu.moved": "moved",
          "microbit.gesturesMenu.shaken": "shaken",
          "microbit.gesturesMenu.jumped": "jumped",
        },
      },
    ],
  },
  microbit_displaySymbol: {
    shape: "stack",
    category: "microbit",
    params: [
      {
        name: "MATRIX",
        opcode: "matrix",
        type: DROPDOWN, // matrix looks like a dropdown but not really
      },
    ],
  },
  microbit_displayText: {
    shape: "stack",
    category: "microbit",
    params: [
      {
        name: "TEXT",
        opcode: "text",
      },
    ],
  },
  microbit_displayClear: {
    id: "microbit.clearDisplay",
    shape: "stack",
    category: "microbit",
    params: [],
  },
  microbit_whenTilted: {
    shape: "hat",
    category: "microbit",
    params: [MICROBIT_TILT_DIRECTION_ANY_PARAM],
  },
  microbit_isTilted: {
    shape: "boolean",
    category: "microbit",
    params: [MICROBIT_TILT_DIRECTION_ANY_PARAM],
  },
  microbit_getTiltAngle: {
    id: "microbit.tiltAngle",
    shape: "reporter",
    category: "microbit",
    params: [
      {
        name: "DIRECTION",
        internal_field_name: "tiltDirection",
        opcode: "microbit_menu_tiltDirection",
        type: DROPDOWN,
        options: MICROBIT_TILT_DIRECTION_OPTIONS,
      },
    ],
  },
  microbit_whenPinConnected: {
    shape: "hat",
    category: "microbit",
    params: [
      {
        name: "PIN",
        internal_field_name: "touchPins",
        opcode: "microbit_menu_touchPins",
        type: DROPDOWN,
        options: {
          "raw:0": "0",
          "raw:1": "1",
          "raw:2": "2",
        },
      },
    ],
  },
  ev3_motorTurnClockwise: {
    shape: "stack",
    category: "ev3",
    params: [
      EV3_MOTOR_PORT_PARAM,
      {
        name: "TIME",
        opcode: "math_number",
      },
    ],
  },
  ev3_motorTurnCounterClockwise: {
    shape: "stack",
    category: "ev3",
    params: [
      EV3_MOTOR_PORT_PARAM,
      {
        name: "TIME",
        opcode: "math_number",
      },
    ],
  },
  ev3_motorSetPower: {
    shape: "stack",
    category: "ev3",
    params: [
      EV3_MOTOR_PORT_PARAM,
      {
        name: "POWER",
        opcode: "math_number",
      },
    ],
  },
  ev3_getMotorPosition: {
    shape: "reporter",
    category: "ev3",
    params: [EV3_MOTOR_PORT_PARAM],
  },
  ev3_whenButtonPressed: {
    shape: "hat",
    category: "ev3",
    params: [EV3_SENSOR_PORT_PARAM],
  },
  ev3_whenDistanceLessThan: {
    shape: "hat",
    category: "ev3",
    params: [
      {
        name: "DISTANCE",
        opcode: "math_number",
      },
    ],
  },
  ev3_whenBrightnessLessThan: {
    shape: "hat",
    category: "ev3",
    params: [
      {
        name: "DISTANCE",
        opcode: "math_number",
      },
    ],
  },
  ev3_buttonPressed: {
    shape: "boolean",
    category: "ev3",
    params: [EV3_SENSOR_PORT_PARAM],
  },
  ev3_getDistance: {
    shape: "reporter",
    category: "ev3",
    params: [],
  },
  ev3_getBrightness: {
    shape: "reporter",
    category: "ev3",
    params: [],
  },
  ev3_beep: {
    id: "ev3.beepNote",
    shape: "stack",
    category: "ev3",
    params: [
      {
        name: "NOTE",
        opcode: "note",
      },
      {
        name: "TIME",
        opcode: "math_number",
      },
    ],
  },
  wedo2_motorOn: {
    shape: "stack",
    category: "wedo",
    params: [WEDO2_MOTOR_ID_PARAM],
  },
  wedo2_motorOff: {
    shape: "stack",
    category: "wedo",
    params: [WEDO2_MOTOR_ID_PARAM],
  },
  wedo2_startMotorPower: {
    shape: "stack",
    category: "wedo",
    params: [
      WEDO2_MOTOR_ID_PARAM,
      {
        name: "POWER",
        opcode: "math_number",
      },
    ],
  },
  wedo2_setMotorDirection: {
    shape: "stack",
    category: "wedo",
    params: [
      WEDO2_MOTOR_ID_PARAM,
      {
        name: "MOTOR_DIRECTION",
        opcode: "wedo2_menu_MOTOR_DIRECTION",
        type: DROPDOWN,
        options: {
          "wedo2.motorDirection.forward": "this way",
          "wedo2.motorDirection.backward": "that way",
          "wedo2.motorDirection.reverse": "reverse",
        },
      },
    ],
  },
  wedo2_whenDistance: {
    shape: "hat",
    category: "wedo",
    params: [
      {
        name: "OP",
        opcode: "wedo2_menu_OP",
        type: DROPDOWN,
        options: {
          "raw:<": "<",
          "raw:>": ">",
        },
      },
      {
        name: "REFERENCE",
        opcode: "math_number",
      },
    ],
  },
  wedo2_getDistance: {
    shape: "reporter",
    category: "wedo",
    params: [],
  },
  wedo2_motorOnFor: {
    shape: "stack",
    category: "wedo",
    params: [
      WEDO2_MOTOR_ID_PARAM,
      {
        name: "DURATION",
        opcode: "math_number",
      },
    ],
  },
  wedo2_setLightHue: {
    shape: "stack",
    category: "wedo",
    params: [
      {
        name: "HUE",
        opcode: "math_number",
      },
    ],
  },
  wedo2_playNoteFor: {
    shape: "stack",
    category: "wedo",
    params: [],
  },
  wedo2_whenTilted: {
    shape: "hat",
    category: "wedo",
    params: [],
  },
  wedo2_isTilted: {
    shape: "boolean",
    category: "wedo",
    params: [
      {
        name: "TILT_DIRECTION_ANY",
        opcode: "wedo2_menu_TILT_DIRECTION_ANY",
        type: DROPDOWN,
        options: {
          "wedo2.tiltDirection.up": "up",
          "wedo2.tiltDirection.down": "down",
          "wedo2.tiltDirection.left": "left",
          "wedo2.tiltDirection.right": "right",
          "wedo2.tiltDirection.any": "any",
        },
      },
    ],
  },
  wedo2_getTiltAngle: {
    shape: "reporter",
    category: "wedo",
    params: [WEDO2_TILT_DIRECTION_PARAM],
  },
  gdxfor_whenGesture: {
    shape: "hat",
    category: "gdxfor",
    params: [
      {
        name: "GESTURE",
        internal_field_name: "gestureOptions",
        opcode: "gdxfor_menu_gestureOptions",
        type: DROPDOWN,
        options: {
          "gdxfor.shaken": "shaken",
          "gdxfor.startedFalling": "started falling",
          "gdxfor.turnedFaceUp": "turned face up",
          "gdxfor.turnedFaceDown": "turned face down",
        },
      },
    ],
  },
  gdxfor_whenForcePushedOrPulled: {
    shape: "hat",
    category: "gdxfor",
    params: [
      {
        name: "PUSH_PULL",
        internal_field_name: "pushPullOptions",
        opcode: "gdxfor_menu_pushPullOptions",
        type: DROPDOWN,
        options: {
          "gdxfor.pushed": "pushed",
          "gdxfor.pulled": "pulled",
        },
      },
    ],
  },
  gdxfor_getForce: {
    shape: "reporter",
    category: "gdxfor",
    params: [],
  },
  gdxfor_whenTilted: {
    shape: "hat",
    category: "gdxfor",
    params: [GDXFORD_TILT_ANY_PARAM],
  },
  gdxfor_isTilted: {
    shape: "boolean",
    category: "gdxfor",
    params: [GDXFORD_TILT_ANY_PARAM],
  },
  gdxfor_getTilt: {
    shape: "reporter",
    category: "gdxfor",
    params: [
      {
        name: "TILT",
        internal_field_name: "tiltOptions",
        opcode: "gdxfor_menu_tiltOptions",
        type: DROPDOWN,
        options: {
          "gdxfor.tiltDirectionMenu.front": "front",
          "gdxfor.tiltDirectionMenu.back": "back",
          "gdxfor.tiltDirectionMenu.left": "left",
          "gdxfor.tiltDirectionMenu.right": "right",
        },
      },
    ],
  },
  gdxfor_isFreeFalling: {
    shape: "boolean",
    category: "gdxfor",
    params: [],
  },
  gdxfor_getSpinSpeed: {
    id: "gdxfor.getSpin",
    shape: "reporter",
    category: "gdxfor",
    params: [GDXFORD_AXIS_PARAM],
  },
  gdxfor_getAcceleration: {
    shape: "reporter",
    category: "gdxfor",
    params: [GDXFORD_AXIS_PARAM],
  },
  boost_motorOnFor: {
    shape: "stack",
    category: "boost",
    params: [
      MOTOR_ID_PARAM,
      {
        name: "DURATION",
        opcode: "math_number",
      },
    ],
  },
  boost_motorOnForRotation: {
    shape: "stack",
    category: "boost",
    params: [
      MOTOR_ID_PARAM,
      {
        name: "ROTATION",
        opcode: "math_number",
      },
    ],
  },
  boost_motorOn: {
    shape: "stack",
    category: "boost",
    params: [MOTOR_ID_PARAM],
  },
  boost_motorOff: {
    shape: "stack",
    category: "boost",
    params: [MOTOR_ID_PARAM],
  },
  boost_setMotorPower: {
    shape: "stack",
    category: "boost",
    params: [
      MOTOR_ID_PARAM,
      {
        name: "POWER",
        opcode: "math_number",
      },
    ],
  },
  boost_setMotorDirection: {
    shape: "stack",
    category: "boost",
    params: [
      MOTOR_ID_PARAM,
      {
        name: "MOTOR_DIRECTION",
        opcode: "boost_menu_MOTOR_DIRECTION",
        type: DROPDOWN,
        options: {
          "boost.motorDirection.forward": "this way",
          "boost.motorDirection.backward": "that way",
          "boost.motorDirection.reverse": "reverse",
        },
      },
    ],
  },
  boost_getMotorPosition: {
    shape: "reporter",
    category: "boost",
    params: [
      {
        name: "MOTOR_REPORTER_ID",
        opcode: "boost_menu_MOTOR_REPORTER_ID",
        type: DROPDOWN,
        options: {
          "raw:A": "A",
          "raw:B": "B",
          "raw:C": "C",
          "raw:D": "D",
        },
      },
    ],
  },
  boost_whenColor: {
    shape: "hat",
    category: "boost",
    params: [COLOR_PARAM],
  },
  boost_seeingColor: {
    shape: "boolean",
    category: "boost",
    params: [COLOR_PARAM],
  },
  boost_whenTilted: {
    shape: "hat",
    category: "boost",
    params: [TILT_DIRECTION_ANY_PARAM],
  },
  boost_getTiltAngle: {
    shape: "reporter",
    category: "boost",
    params: [TILT_DIRECTION_PARAM],
  },
  boost_setLightHue: {
    shape: "stack",
    category: "boost",
    params: [
      {
        name: "HUE",
        opcode: "math_number",
      },
    ],
  },
  procedures_definition: {
    shape: "procdef",
    category: "custom",
    params: [
      {
        name: "custom_block",
        opcode: "procedures_prototype",
      },
    ],
    skipLocaleBuild: true,
  },
  "scratchblocks:control_else": {
    id: "CONTROL_ELSE",
    shape: "celse",
    category: "control",
  },
  "scratchblocks:end": {
    id: "scratchblocks:end",
    shape: "cend",
    category: "control",
  },
  "scratchblocks:ellipsis": {
    id: "scratchblocks:ellipsis",
    shape: "stack",
    category: "grey",
  },
};

const specialOpcodesMap = {};
for (const opcode in blocks_info) {
  const block = blocks_info[opcode];
  if (block.id) {
    specialOpcodesMap[block.id] = opcode;
  }
}
export const toOpcode = (str) => {
  if (!str) return "";
  if (str.includes(".")) {
    return str.replace(".", "_");
  } else if (specialOpcodesMap[str]) {
    return specialOpcodesMap[str];
  }
  return str.toLowerCase().replace("operators_", "operator_");
};
