import { extensions, aliasExtensions, extensionList } from "./extensions.js";

// List of classes we're allowed to override.

export const overrideCategories = [
  "motion",
  "looks",
  "sound",
  "variables",
  "list",
  "events",
  "control",
  "sensing",
  "operators",
  "custom",
  "custom-arg",
  "extension",
  "grey",
  "obsolete",
  ...Object.keys(extensions),
  ...Object.keys(aliasExtensions),
];

const overrideShapes = ["hat", "cap", "stack", "boolean", "reporter", "ring", "cat"];

// languages that should be displayed right to left
export const rtlLanguages = ["ar", "ckb", "fa", "he"];

import { blocks_info } from "./blocks-info.js";

export const inputPat = /(%[a-zA-Z0-9](?:\.[a-zA-Z0-9]+)?)/;
const inputPatGlobal = new RegExp(inputPat.source, "g");
export const iconPat = /(@[a-zA-Z]+)/;

export const hexColorPat = /^#(?:[0-9a-fA-F]{3}){1,2}?$/;

export function hashSpec(spec) {
  return minifyHash(spec.replace(inputPatGlobal, " _ "));
}

export function minifyHash(hash) {
  return hash
    .replace(/_/g, " _ ")
    .replace(/ +/g, " ")
    .replace(/[,%?:]/g, "")
    .replace(/ß/g, "ss")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(". . .", "...")
    .replace(/^…$/, "...")
    .trim()
    .toLowerCase();
}

export const blocksById = {};
for (const opcode in blocks_info) {
  const def = blocks_info[opcode];
  if (def.skipLocaleBuild) {
    continue;
  }
  const id =
    def.id ||
    (extensionList.includes(def.category)
      ? opcode.replace("_", ".")
      : opcode.replace("operator_", "operators_").toUpperCase());
  const info = {
    id: id,
    shape: def.shape,
    category: def.category,
  };
  if (blocksById[info.id]) {
    throw new Error(`Duplicate ID: ${info.id}`);
  }
  blocksById[info.id] = info;
}

export const unicodeIcons = {
  "@greenFlag": "⚑",
  "@turnRight": "↻",
  "@turnLeft": "↺",
  "@addInput": "▸",
  "@delInput": "◂",
};

export const allLanguages = {};
function loadLanguage(code, language) {
  const blocksByHash = (language.blocksByHash = {});

  Object.keys(language.commands).forEach((blockId) => {
    const nativeSpec = language.commands[blockId];
    const block = blocksById[blockId];

    const nativeHash = hashSpec(nativeSpec);
    if (!blocksByHash[nativeHash]) {
      blocksByHash[nativeHash] = [];
    }
    blocksByHash[nativeHash].push(block);

    // fallback image replacement, for languages without aliases
    const m = iconPat.exec(nativeSpec);
    if (m) {
      const image = m[0];
      const hash = nativeHash.replace(hashSpec(image), unicodeIcons[image]);
      if (!blocksByHash[hash]) {
        blocksByHash[hash] = [];
      }
      blocksByHash[hash].push(block);
    }
  });

  language.nativeAliases = {};
  Object.keys(language.aliases).forEach((alias) => {
    const blockId = language.aliases[alias];
    const block = blocksById[blockId];
    if (block === undefined) {
      throw new Error(`Invalid alias '${blockId}'`);
    }
    const aliasHash = hashSpec(alias);
    if (!blocksByHash[aliasHash]) {
      blocksByHash[aliasHash] = [];
    }
    blocksByHash[aliasHash].push(block);

    if (!language.nativeAliases[blockId]) {
      language.nativeAliases[blockId] = [];
    }
    language.nativeAliases[blockId].push(alias);
  });

  // Some English blocks were renamed between Scratch 2 and Scratch 3. Wire them
  // into language.blocksByHash
  Object.keys(language.renamedBlocks || {}).forEach((alt) => {
    const id = language.renamedBlocks[alt];
    if (!blocksById[id]) {
      throw new Error(`Unknown ID: ${id}`);
    }
    const block = blocksById[id];
    const hash = hashSpec(alt);
    if (!language.blocksByHash[hash]) {
      language.blocksByHash[hash] = [];
    }
    language.blocksByHash[hash].push(block);
  });

  language.nativeDropdowns = {};
  Object.keys(language.dropdowns).forEach((name) => {
    const nativeName = language.dropdowns[name];
    language.nativeDropdowns[nativeName] = name;
  });

  language.code = code;
  allLanguages[code] = language;
}
export function loadLanguages(languages) {
  Object.keys(languages).forEach((code) => loadLanguage(code, languages[code]));
}

/*****************************************************************************/

function registerCheck(id, func) {
  if (!blocksById[id]) {
    throw new Error(`Unknown ID: ${id}`);
  }
  blocksById[id].accepts = func;
}

function specialCase(id, func) {
  if (!blocksById[id]) {
    throw new Error(`Unknown ID: ${id}`);
  }
  blocksById[id].specialCase = func;
}

function disambig(id1, id2, test) {
  registerCheck(id1, (_, children, lang) => {
    return test(children, lang);
  });
  registerCheck(id2, (_, children, lang) => {
    return !test(children, lang);
  });
}

disambig("OPERATORS_MATHOP", "SENSING_OF", (children, lang) => {
  // Operators if math function, otherwise sensing "attribute of" block
  const first = children[0];
  if (!first.isInput) {
    return;
  }
  const name = first.value;
  return lang.math.includes(name);
});

disambig("SOUND_CHANGEEFFECTBY", "LOOKS_CHANGEEFFECTBY", (children, lang) => {
  // Sound if sound effect, otherwise default to graphic effect
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value;
      for (const effect of lang.soundEffects) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true;
        }
      }
    }
  }
  return false;
});

disambig("SOUND_SETEFFECTO", "LOOKS_SETEFFECTTO", (children, lang) => {
  // Sound if sound effect, otherwise default to graphic effect
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value;
      for (const effect of lang.soundEffects) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true;
        }
      }
    }
  }
  return false;
});

disambig("DATA_LENGTHOFLIST", "OPERATORS_LENGTH", (children, _lang) => {
  // List block if dropdown, otherwise operators
  const last = children[children.length - 1];
  if (!last.isInput) {
    return;
  }
  return last.shape === "dropdown";
});

disambig("DATA_LISTCONTAINSITEM", "OPERATORS_CONTAINS", (children, _lang) => {
  // List block if dropdown, otherwise operators
  const first = children[0];
  if (!first.isInput) {
    return;
  }
  return first.shape === "dropdown";
});

disambig("faceSensing.goToPart", "MOTION_GOTO", (children, lang) => {
  // Face sensing if face part, otherwise default to motion block
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value;
      for (const effect of lang.faceParts) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true;
        }
      }
    }
  }
  return false;
});

disambig("microbit.whenGesture", "gdxfor.whenGesture", (children, lang) => {
  for (const child of children) {
    if (child.shape === "dropdown") {
      const name = child.value;
      // Yes, "when shaken" gdxfor block exists. But microbit is more common.
      for (const effect of lang.microbitWhen) {
        if (minifyHash(effect) === minifyHash(name)) {
          return true;
        }
      }
    }
  }
  return false;
});

// This block does not need disambiguation in English;
// however, many other languages do require that.
disambig("ev3.buttonPressed", "microbit.isButtonPressed", (children, _lang) => {
  for (const child of children) {
    if (child.shape === "dropdown") {
      // EV3 "button pressed" block uses numeric identifier
      // and does not support "any".
      switch (minifyHash(child.value)) {
        case "1":
        case "2":
        case "3":
        case "4":
          return true;
        default:
      }
    }
  }
  return false;
});

specialCase("CONTROL_STOP", (_, children, lang) => {
  // Cap block unless argument is "other scripts in sprite"
  const last = children[children.length - 1];
  if (!last.isInput) {
    return;
  }
  const value = last.value;
  if (lang.osis.includes(value)) {
    return { ...blocksById.CONTROL_STOP, shape: "stack" };
  }
});

export function lookupHash(hash, info, children, languages, categoryOverride = null) {
  for (const lang of languages) {
    if (Object.prototype.hasOwnProperty.call(lang.blocksByHash, hash)) {
      const collisions = lang.blocksByHash[hash];
      for (let block of collisions) {
        if (info.shape === "reporter" && block.shape !== "reporter" && block.shape !== "ring") {
          continue;
        }
        if (info.shape === "boolean" && block.shape !== "boolean") {
          continue;
        }
        if (collisions.length > 1) {
          // If category override is provided, prioritize matching blocks
          if (categoryOverride) {
            if (block.category !== categoryOverride) {
              continue;
            }
          } else {
            // Only check in case of collision;
            // perform "disambiguation"
            if (block.accepts && !block.accepts(info, children, lang)) {
              continue;
            }
          }
        }
        if (block.specialCase) {
          block = block.specialCase(info, children, lang) || block;
        }
        return { type: block, lang: lang };
      }
    }
  }
  // If no match with category override, try again without it
  if (categoryOverride) {
    return lookupHash(hash, info, children, languages, null);
  }
}

export function lookupDropdown(name, languages) {
  for (const lang of languages) {
    if (Object.prototype.hasOwnProperty.call(lang.nativeDropdowns, name)) {
      return lang.nativeDropdowns[name];
    }
  }
}

export function applyOverrides(info, overrides) {
  const originalCategory = info.category;
  const originalShape = info.shape;
  for (const name of overrides) {
    if (hexColorPat.test(name)) {
      info.color = name;
      info.category = "";
    } else if (overrideCategories.includes(name)) {
      info.category = name;
    } else if (overrideShapes.includes(name)) {
      info.shape = name;
    } else if (name === "+" || name === "-") {
      info.diff = name;
    } else if (name === "reset") {
      // TODO
      info.categoryIsDefault = false;
      info.isReset = true;
    }
  }
  info.categoryIsDefault = info.category === originalCategory;
  info.shapeIsDefault = info.shape === originalShape;
}

export function blockName(block) {
  const words = [];
  for (const child of block.children) {
    if (!child.isLabel) {
      return;
    }
    words.push(child.value);
  }
  return words.join(" ");
}

export function getSortedParameters(children, blockId, language) {
  const params = children.filter((child) => child.isInput || child.isBlock || child.isScript);
  if (params.length === 0 || !language || !language.commands || !language.commands[blockId]) {
    return params;
  }

  const template = language.commands[blockId];
  const matches = template.match(/%(\d+)/g);
  if (!matches) {
    // No placeholders in template; return in order
    return params;
  }

  const indices = matches.map((placeholder) => parseInt(placeholder.slice(1), 10) - 1);
  const maxIndex = Math.max(...indices);
  const result = new Array(maxIndex + 1);
  indices.forEach((idx, i) => {
    if (i < params.length && idx >= 0 && idx < result.length) {
      result[idx] = params[i];
    }
  });

  // Fill in any missing parameters (not in the template, e.g. for c-blocks)
  result.push(...params.filter((p) => !result.includes(p)));

  return result.filter((p) => p !== undefined);
}
