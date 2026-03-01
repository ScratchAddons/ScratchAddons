import extraAliases from "./extra_aliases.js";
import { blocks_info, toOpcode } from "./blocks-info.js";
import { extensionList } from "./extensions.js";

const soundEffects = ["SOUND_EFFECTS_PITCH", "SOUND_EFFECTS_PAN"];
const microbitWhen = ["microbit.gesturesMenu.moved", "microbit.gesturesMenu.shaken", "microbit.gesturesMenu.jumped"];
const osis = ["CONTROL_STOP_OTHER"];

const translateKey = (raw, key) => {
  const result = raw.mappings[key] || raw.extensionMappings[key];
  if (!result) {
    return;
  }
  return fixup(key, result);
};

const lookupEachIn = (raw) => (items) => {
  const output = [];
  for (const key of items) {
    const result = translateKey(raw, key);
    if (!result) {
      continue;
    }
    output.push(result);
  }
  return output;
};

const buildLocale = (code, rawLocale) => {
  const listFor = lookupEachIn(rawLocale);

  const aliases = extraAliases[code];

  const procDef = translateKey(rawLocale, "PROCEDURES_DEFINITION");

  const locale = {
    commands: {},
    dropdowns: {},
    soundEffects: listFor(soundEffects),
    microbitWhen: listFor(microbitWhen),
    osis: listFor(osis),
    definePrefix: /(.*)%1/
      .exec(procDef)[1]
      .trim()
      .split(/ /g)
      .filter((x) => !!x),
    defineSuffix: /%1(.*)/
      .exec(procDef)[1]
      .trim()
      .split(/ /g)
      .filter((x) => !!x),
    math: listFor(Object.keys(blocks_info.operator_mathop.params[0].options)),
    aliases: aliases || {},
  };

  for (const opcode in blocks_info) {
    const command = blocks_info[opcode];
    if (command.skipLocaleBuild || command.id?.startsWith("scratchblocks:")) {
      continue;
    }
    for (const param of command.params || []) {
      for (const optionId in param.options || {}) {
        if (optionId in locale.dropdowns) {
          continue;
        }
        if (optionId.startsWith("raw:")) {
          const rawText = optionId.slice("raw:".length);
          locale.dropdowns[optionId] = rawText;
          continue;
        }
        const result = translateKey(rawLocale, optionId);
        if (!result) {
          console.warn(`Missing translation for ${optionId} in locale ${code}`);
          continue;
        }
        locale.dropdowns[optionId] = result;
      }
    }
    const id =
      command.id ||
      (extensionList.includes(command.category)
        ? opcode.replace("_", ".")
        : opcode.replace("operator_", "operators_").toUpperCase());
    const result = translateKey(rawLocale, id);
    if (!result) {
      console.warn(`Missing translation for ${id} in locale ${code}`);
      continue;
    }
    locale.commands[id] = result;
  }

  locale.commands["scratchblocks:ellipsis"] = ". . .";
  if (code === "en") {
    locale.osis.push("other scripts in stage");
    locale.renamedBlocks = {
      "say %1 for %2 secs": "LOOKS_SAYFORSECS",
      "think %1 for %2 secs": "LOOKS_THINKFORSECS",
      "play sound %1": "SOUND_PLAY",
      "wait %1 secs": "CONTROL_WAIT",
      clear: "pen.clear",
    };
    locale.commands["scratchblocks:end"] = "end";
  }

  return locale;
};

const fixup = (key, value) => {
  const variables = (blocks_info[toOpcode(key)]?.params || []).map((p) => p.name);
  value = value.replace(/\[[^\]]+\]/g, (key) => `%${variables.indexOf(key.slice(1, -1)) + 1}`);

  value = value.trim();

  switch (key) {
    case "EVENT_WHENFLAGCLICKED":
      return value.replace("%1", "@greenFlag");
    case "MOTION_TURNLEFT":
      return value.replace("%1", "@turnLeft").replace("%2", "%1");
    case "MOTION_TURNRIGHT":
      return value.replace("%1", "@turnRight").replace("%2", "%1");
    case "CONTROL_STOP":
      return value + " %1";
    default:
      return value;
  }
};

export function getLocale(code, reduxState, blockly) {
  return buildLocale(code, {
    code: code,
    mappings: blockly.ScratchMsgs.locales[code],
    extensionMappings: reduxState.locales.messagesByLocale[code],
  });
}
