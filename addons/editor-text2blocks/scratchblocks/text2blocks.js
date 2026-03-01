import { blocks_info } from "./blocks-info.js";
import { DROPDOWN, FIELD_DROPDOWN, BOOLEAN, SCRIPT } from "./type-enum.js";
import { blockName, hashSpec } from "./blocks.js";
import { parse } from "./syntax.js";

// Error code constants
export const ErrorCodes = {
  // Procedure errors
  INVALID_PROCCODE: "INVALID_PROCCODE",
  PROCCODE_WITH_CONTROL_CHARS: "PROCCODE_WITH_CONTROL_CHARS",
  DUPLICATE_PROC_DEFINITION: "DUPLICATE_PROC_DEFINITION",
  PROC_PROTOTYPE_NOT_FOUND: "PROC_PROTOTYPE_NOT_FOUND",
  PROC_CALL_UNDEFINED: "PROC_CALL_UNDEFINED",

  // Block errors
  UNKNOWN_BLOCK: "UNKNOWN_BLOCK",
  BLOCK_NOT_AVAILABLE: "BLOCK_NOT_AVAILABLE",
  SHAPE_OVERRIDE_NOT_ALLOWED: "SHAPE_OVERRIDE_NOT_ALLOWED",
  CATEGORY_OVERRIDE_NOT_ALLOWED: "CATEGORY_OVERRIDE_NOT_ALLOWED",

  // Parameter errors
  PARAM_COUNT_MISMATCH: "PARAM_COUNT_MISMATCH",
  TYPE_MISMATCH: "TYPE_MISMATCH",
  FINAL_BLOCK_NOT_END: "FINAL_BLOCK_NOT_END",

  // Validation warnings
  MENU_NOT_FOUND: "MENU_NOT_FOUND",
  VALUE_NOT_FOUND: "VALUE_NOT_FOUND",
  NOTE_VALUE_OUT_OF_RANGE: "NOTE_VALUE_OUT_OF_RANGE",
  VARIABLE_NOT_FOUND: "VARIABLE_NOT_FOUND",
  CLONE_OF_MYSELF_INVALID_FOR_STAGE: "CLONE_OF_MYSELF_INVALID_FOR_STAGE",
  SENSING_OF_STAGE_INVALID_PROPERTY: "SENSING_OF_STAGE_INVALID_PROPERTY",
  SENSING_OF_SPRITE_INVALID_PROPERTY: "SENSING_OF_SPRITE_INVALID_PROPERTY",
};

export class Text2Blocks {
  constructor(target, runtime, genId, workspace) {
    this.target = target;
    this.runtime = runtime;
    this.stage = runtime.getTargetForStage();
    this.genId = genId;
    this.workspace = workspace;

    this.blockJson = [];
    this.variableNames = new Set();
    this.listNames = new Set();
    this.errors = [];
    this.warnings = [];
  }

  // Check if a block is available for the current target
  checkBlockAvailability(opcode) {
    // Determine if the target is the stage
    const isStage = this.target.isStage;

    if (isStage && opcode.startsWith("motion_")) {
      return false;
    }

    // Blocks available only to sprites
    const spriteOnlyBlocks = new Set([
      "control_deletethisclone",
      "control_startasclone",
      "faceSensing_goToPart",
      "faceSensing_pointInFaceTiltDirection",
      "faceSensing_setSizeToFaceSize",
      "faceSensing_whenSpriteTouchesPart",
      "looks_changesizeby",
      "looks_costumenumbername",
      "looks_goforwardbackwardlayers",
      "looks_gotofrontback",
      "looks_hide",
      "looks_nextcostume",
      "looks_say",
      "looks_sayforsecs",
      "looks_setsizeto",
      "looks_show",
      "looks_size",
      "looks_switchcostumeto",
      "looks_think",
      "looks_thinkforsecs",
      "pen_changePenColorParamBy",
      "pen_changePenSizeBy",
      "pen_penDown",
      "pen_penUp",
      "pen_setPenColorParamTo",
      "pen_setPenColorToColor",
      "pen_setPenSizeTo",
      "pen_stamp",
      "sensing_coloristouchingcolor",
      "sensing_distanceto",
      "sensing_setdragmode",
      "sensing_touchingcolor",
      "sensing_touchingobject",
      // "event_whenthisspriteclicked", // Scratch handles this based on target type
    ]);

    // Blocks available only to the stage
    const stageOnlyBlocks = new Set([
      "looks_switchbackdroptoandwait",
      // "event_whenstageclicked" // Scratch handles this based on target type
    ]);

    // Check sprite-only blocks
    if (spriteOnlyBlocks.has(opcode)) {
      return !isStage;
    }

    // Check stage-only blocks
    if (stageOnlyBlocks.has(opcode)) {
      return isStage;
    }

    // Other blocks are available by default
    return true;
  }

  applyVariableMappings(variableMappings) {
    if (!variableMappings || variableMappings.size === 0) {
      return this.blockJson;
    }

    // Iterate all blocks and replace variable references
    for (const block of this.blockJson) {
      // Handle variable name for data_variable block
      if (block.opcode === "data_variable") {
        const currentVarName = block.fields.VARIABLE?.value;
        if (currentVarName && variableMappings.has(currentVarName)) {
          const varMapping = variableMappings.get(currentVarName);
          block.fields.VARIABLE.value = varMapping.name;
          if (varMapping.id) {
            block.fields.VARIABLE.id = varMapping.id;
          }
        }
        continue;
      }

      // Handle list name for data_listcontents block
      if (block.opcode === "data_listcontents") {
        const currentListName = block.fields.LIST?.value;
        if (currentListName && variableMappings.has(currentListName)) {
          const listMapping = variableMappings.get(currentListName);
          block.fields.LIST.value = listMapping.name;
          if (listMapping.id) {
            block.fields.LIST.id = listMapping.id;
          }
        }
        continue;
      }

      for (const fieldName in block.fields) {
        const field = block.fields[fieldName];
        if (field.variableType === "list" || field.variableType === "broadcast_msg" || field.variableType === "") {
          const currentName = field.value;
          if (currentName && variableMappings.has(currentName)) {
            const mapping = variableMappings.get(currentName);
            field.value = mapping.name;
            if (mapping.id) {
              field.id = mapping.id;
            }
          }
        }
      }
    }

    return this.blockJson;
  }

  text2blocks(text, languages = []) {
    this.variableNames.clear();
    this.listNames.clear();
    this.errors = [];
    this.warnings = [];

    const self = this;
    const blocks_json = [];
    const blockMap = new Map(); // id -> block mapping for fast lookup
    const procDefinitions = new Map(); // proccode -> {argumentids, argumentnames, argumentdefaults, warp} mapping to store custom block definitions

    const workspaceCustomBlocks = collectWorkspaceProcedureDefinitions();

    const doc = parse(text, languages, workspaceCustomBlocks);
    // TODO: remove --- DEBUG ---
    console.log("Parsed document:", doc);

    for (const script of doc.scripts) {
      collectProcedureDefinitions(script.blocks);
    }

    for (const script of doc.scripts) {
      processScript(script.blocks, null, true);
    }

    this.blockJson = blocks_json;

    // Add block to JSON and Map
    function addBlock(block) {
      blocks_json.push(block);
      blockMap.set(block.id, block);
    }

    // Find block by ID
    function findBlockById(blockId) {
      return blockMap.get(blockId);
    }

    // Validate whether a dynamic value is valid (by type)
    function validateDynamicValue(value, type) {
      const target = self.target;
      const stage = self.stage;

      try {
        switch (type) {
          case "sprites": {
            for (const t of self.runtime.targets || []) {
              if (t.isStage || !t.isOriginal) continue;
              if (t.sprite.name === value) return true;
            }
            return false;
          }

          case "sounds": {
            return target.getSounds().some((s) => s.name === value);
          }

          case "costumes": {
            return target.getCostumes().some((c) => c.name === value);
          }

          case "backdrops": {
            return stage.getCostumes().some((c) => c.name === value);
          }

          case "messages": {
            return Object.values({ ...target.variables, ...stage.variables }).some(
              (variable) => variable.type === "broadcast_msg" && variable.name === value
            );
          }

          case "keys": {
            return value === "enter" || value.length === 1;
          }

          // Variables and lists are handled elsewhere; allow by default here
          case "variables":
          case "lists":
          case "targetVariables":
          default:
            return true; // Unknown types allowed by default
        }
      } catch (error) {
        console.error(`Error validating dynamic value "${value}" for type "${type}":`, error);
        return true; // On error, allow by default
      }
    }

    // Validate target variable (used by sensing_of blocks)
    function validateTargetVariable(value, targetName) {
      const stage = self.stage;

      try {
        // If targetName is _stage_, check stage variables
        if (targetName === "_stage_") {
          return Object.values(stage.variables || {}).some(
            (variable) => variable.type === "" && variable.name === value
          );
        }

        // Otherwise, find the specified sprite
        if (self.runtime.getSpriteTargetByName(targetName)) {
          return Object.values(self.runtime.getSpriteTargetByName(targetName).variables || {}).some(
            (variable) => variable.type === "" && variable.name === value
          );
        }

        return false;
      } catch (error) {
        console.error(`Error validating target variable "${value}" for target "${targetName}":`, error);
        return true; // On error, allow by default
      }
    }

    // Collect all procedures_prototype definitions
    function collectProcedureDefinitions(blocks) {
      for (const block of blocks) {
        // Find procedures_definition blocks
        if (block.info?.opcode === "procedures_definition") {
          // procedures_prototype is in parameters[0]
          const prototypeBlock = block.parameters?.[0];

          if (prototypeBlock && prototypeBlock.info?.opcode === "procedures_prototype") {
            // Generate proccode and related info
            const proccode_parts = [];
            const argument_ids = [];
            const argument_names = [];
            const argument_defaults = [];

            for (const child of prototypeBlock.children) {
              if (child.isLabel) {
                proccode_parts.push(child.value.replace("%", "\\%"));
              } else if (child.isBlock) {
                const argument_id = self.genId();
                proccode_parts.push(child.isBoolean ? "%b" : "%s");
                argument_defaults.push(child.isBoolean ? "false" : "");
                argument_ids.push(argument_id);
                argument_names.push(blockName(child));
              }
            }

            const proccode = proccode_parts.join(" ");

            // scratch-vm#2577
            if (
              [
                "__proto__",
                "constructor",
                "hasOwnProperty",
                "isPrototypeOf",
                "propertyIsEnumerable",
                "toLocaleString",
                "toString",
                "valueOf",
              ].includes(proccode)
            ) {
              self.errors.push(`Invalid proccode: "${proccode}"`);
            }
            // https://en.scratch-wiki.info/wiki/Undefined_Hat_Block
            if (/[\x00-\x1F]/.test(proccode)) {
              self.errors.push(`Invalid proccode (contains control characters): "${proccode}"`);
            }

            if (procDefinitions.has(proccode)) {
              self.warnings.push(`Duplicate procedure definition for proccode: "${proccode}"`);
              continue;
            }

            const prototypeMutation = {
              tagName: "mutation",
              children: [],
              proccode: proccode,
              argumentids: JSON.stringify(argument_ids),
              argumentnames: JSON.stringify(argument_names),
              argumentdefaults: JSON.stringify(argument_defaults),
              warp: "false",
            };

            const callMutation = {
              tagName: "mutation",
              children: [],
              proccode: proccode,
              argumentids: JSON.stringify(argument_ids),
              warp: "false",
            };

            procDefinitions.set(proccode, {
              argumentids: argument_ids,
              argumentnames: argument_names,
              argumentdefaults: argument_defaults,
              warp: "false",
              prototypeMutation: prototypeMutation,
              callMutation: callMutation,
            });
          }
        }
      }
    }

    // Collect procedures_definition from the Blockly workspace, return in customBlocksByHash format
    function collectWorkspaceProcedureDefinitions() {
      const customBlocksByHash = {};

      const topBlocks = self.workspace.getTopBlocks();
      for (const block of topBlocks) {
        if (block.type !== "procedures_definition") {
          continue;
        }

        const childBlocks = block.childBlocks || (block.getChildren && block.getChildren());
        if (!childBlocks || childBlocks.length === 0) {
          continue;
        }

        const prototypeBlock = childBlocks[0];
        if (prototypeBlock.type !== "procedures_prototype") {
          continue;
        }

        const mutationDom = prototypeBlock.mutationToDom && prototypeBlock.mutationToDom();
        if (!mutationDom) {
          continue;
        }

        const proccode = mutationDom.getAttribute("proccode");
        const argumentnames = JSON.parse(mutationDom.getAttribute("argumentnames") || "[]");

        if (!proccode) {
          continue;
        }

        // Compute hash, same method as in recogniseStuff
        const hash = hashSpec(proccode);

        // Check if already defined (avoid duplicates)
        if (customBlocksByHash[hash]) {
          continue;
        }

        // Store in the format expected by recogniseStuff
        customBlocksByHash[hash] = {
          spec: proccode,
          names: argumentnames,
        };

        // Also store into procDefinitions for later text2blocks processing
        const argumentids = JSON.parse(mutationDom.getAttribute("argumentids") || "[]");
        const argumentdefaults = JSON.parse(mutationDom.getAttribute("argumentdefaults") || "[]");
        const warp = mutationDom.getAttribute("warp") || "false";

        const prototypeMutation = {
          tagName: "mutation",
          children: [],
          proccode: proccode,
          argumentids: JSON.stringify(argumentids),
          argumentnames: JSON.stringify(argumentnames),
          argumentdefaults: JSON.stringify(argumentdefaults),
          warp: warp,
        };

        const callMutation = {
          tagName: "mutation",
          children: [],
          proccode: proccode,
          argumentids: JSON.stringify(argumentids),
          warp: warp,
        };

        procDefinitions.set(proccode, {
          argumentids: argumentids,
          argumentnames: argumentnames,
          argumentdefaults: argumentdefaults,
          warp: warp,
          prototypeMutation: prototypeMutation,
          callMutation: callMutation,
        });
      }

      return customBlocksByHash;
    }

    // Validate whether parameter type is compatible with input type
    function validateParameterType(param, info, parentOpcode) {
      // Parameters of procedures_call are always blocks, no special validation needed
      if (parentOpcode === "procedures_call") {
        return true;
      }

      if (info.type === FIELD_DROPDOWN) {
        if (!param.isInput) {
          self.errors.push({
            code: ErrorCodes.TYPE_MISMATCH,
            params: { parentOpcode, inputName: info.name, expected: "value", got: param.shape },
          });
          return false;
        }
      } else if (info.type === DROPDOWN) {
        if (param.isScript) {
          self.errors.push({
            code: ErrorCodes.TYPE_MISMATCH,
            params: { parentOpcode, inputName: info.name, expected: "value", got: "script" },
          });
          return false;
        }
      } else if (info.type === BOOLEAN) {
        if (param.isScript) {
          self.errors.push({
            code: ErrorCodes.TYPE_MISMATCH,
            params: { parentOpcode, inputName: info.name, expected: "boolean block", got: "script" },
          });
          return false;
        }
        if (!param.isBoolean) {
          self.errors.push({
            code: ErrorCodes.TYPE_MISMATCH,
            params: {
              parentOpcode,
              inputName: info.name,
              expected: "boolean block",
              got: param.info?.shape || "unknown",
            },
          });
          return false;
        }
      } else if (info.type === SCRIPT) {
        if (!param.isScript) {
          self.errors.push({
            code: ErrorCodes.TYPE_MISMATCH,
            params: { parentOpcode, inputName: info.name, expected: "script", got: param.info?.shape || "unknown" },
          });
          return false;
        }
      } else {
        if (param.isScript) {
          self.errors.push({
            code: ErrorCodes.TYPE_MISMATCH,
            params: { parentOpcode, inputName: info.name, expected: "reporter block", got: "script" },
          });
          return false;
        }
        if (param.isCommand) {
          self.errors.push({
            code: ErrorCodes.TYPE_MISMATCH,
            params: { parentOpcode, inputName: info.name, expected: "reporter block", got: "command block" },
          });
          return false;
        }
      }

      return true;
    }

    // Recursively process block parameters
    function processParameter(param, info, parentBlockId, parentOpcode) {
      // Validate parameter type
      if (!validateParameterType(param, info, parentOpcode)) {
        return null;
      }

      let shadow_block_id = null;
      let input_block_id = null;
      let variableType = null;

      // Handle nested blocks, including boolean, reporter blocks, and scripts
      if (param.isBlock) {
        const nestedBlockId = processBlock(param, parentBlockId, false);
        input_block_id = nestedBlockId;
      } else if (param.isScript) {
        const nestedScriptId = processScript(param.blocks, parentBlockId, false);
        input_block_id = nestedScriptId;
      }

      if (info.type === FIELD_DROPDOWN) {
        let value = param.value;

        // If menu exists, it's a static dropdown (identified in paintBlock)
        if (param.menu) {
          const staticValue = info.options?.[param.menu];
          if (staticValue !== undefined) {
            value = staticValue;
          } else if (!info.dynamicOptions) {
            self.warnings.push({
              code: ErrorCodes.MENU_NOT_FOUND,
              params: { menu: param.menu, parentOpcode, inputName: info.name },
            });
          }
        } else if (info.dynamicOptions) {
          // menu null means dynamic menu, use param.value directly
          // Validate the value
          if (!validateDynamicValue(param.value, info.dynamicOptions)) {
            self.warnings.push({
              code: ErrorCodes.VALUE_NOT_FOUND,
              params: { value: param.value, expectedType: info.dynamicOptions, parentOpcode, inputName: info.name },
            });
          }
          value = param.value;

          if (info.dynamicOptions === "variables") {
            variableType = "";
          } else if (info.dynamicOptions === "lists") {
            variableType = "list";
          }
        }

        return {
          type: "field",
          fieldName: info.name,
          value: value,
          variableType: variableType,
        };
      } else if (info.type === DROPDOWN) {
        const input_id = self.genId();
        shadow_block_id = input_id;

        let value = param.value;
        if (param.isBlock) {
          value = Object.values(info.options || {})[0] || ""; // TODO: Is this handling reasonable?
          if (info.opcode === "control_create_clone_of_menu" && self.target.isStage) {
            value = self.runtime.targets.find((t) => !t.isStage)?.getName() || ""; // Stage cannot use _myself_
          }
        } else {
          // If menu exists, it's a static dropdown (identified in paintBlock)
          if (param.menu) {
            const staticValue = info.options?.[param.menu];
            if (staticValue !== undefined) {
              value = staticValue;
            } else if (!info.dynamicOptions) {
              self.warnings.push({
                code: ErrorCodes.MENU_NOT_FOUND,
                params: { menu: param.menu, parentOpcode, inputName: info.name },
              });
            }
          } else if (info.dynamicOptions) {
            // menu null means dynamic menu, use param.value directly
            // Validate the value
            if (!validateDynamicValue(param.value, info.dynamicOptions)) {
              self.warnings.push({
                code: ErrorCodes.VALUE_NOT_FOUND,
                params: { value: param.value, expectedType: info.dynamicOptions, parentOpcode, inputName: info.name },
              });
            }
            value = param.value;

            if (info.dynamicOptions === "messages") {
              variableType = "broadcast_msg";
            }
          }
        }

        addBlock({
          id: input_id,
          opcode: info.opcode,
          fields: {
            [info.internal_field_name || info.name]: {
              name: info.internal_field_name || info.name,
              value: value,
              variableType: variableType,
            },
          },
          inputs: {},
          parent: parentBlockId,
          next: null,
          shadow: true,
          topLevel: false,
        });
      } else if (info.opcode === "procedures_prototype") {
      } else if (info.type !== BOOLEAN && info.type !== SCRIPT) {
        // Reporter-type round input
        const input_id = self.genId();
        shadow_block_id = input_id;
        const field_name =
          info.opcode === "text"
            ? "TEXT"
            : info.opcode === "colour_picker"
              ? "COLOUR"
              : info.opcode === "note"
                ? "NOTE"
                : "NUM";
        let value;
        if (param.isBlock) {
          value = info.opcode === "text" ? "" : info.opcode === "colour_picker" ? "#000000" : 0;
        } else {
          value = param.value;
          if (info.opcode === "note" && (value < 0 || value > 130)) {
            self.warnings.push({
              code: ErrorCodes.NOTE_VALUE_OUT_OF_RANGE,
              params: { value, min: 0, max: 130, parentOpcode, inputName: info.name },
            });
          } else if (info.opcode === "colour_picker") {
            if (param.isColor) {
              if (value.length === 4) {
                // Convert short format #RGB to #RRGGBB
                value = "#" + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
              }
            } else {
              self.errors.push({
                code: ErrorCodes.TYPE_MISMATCH,
                params: { parentOpcode, inputName: info.name, expected: "color value", got: param.shape },
              });
            }
          }
        }
        addBlock({
          id: input_id,
          opcode: info.opcode,
          fields: {
            [field_name]: {
              name: field_name,
              value: value,
            },
          },
          inputs: {},
          parent: parentBlockId,
          next: null,
          shadow: true,
          topLevel: false,
        });
      }

      return {
        type: "input",
        inputName: info.name,
        block: input_block_id || shadow_block_id,
        shadow: shadow_block_id,
      };
    }

    // Recursively process a single block
    function processBlock(block, parentBlockId = null, isTopLevel = false) {
      if (block.isComment) {
        return null;
      }

      if (block.info.shapeIsDefault === false) {
        self.errors.push({ code: ErrorCodes.SHAPE_OVERRIDE_NOT_ALLOWED, params: { hash: block.info.hash } });
        return null;
      }
      if (
        block.info.categoryIsDefault === false &&
        block.info.category !== "variables" &&
        block.info.category !== "list"
      ) {
        self.errors.push({ code: ErrorCodes.CATEGORY_OVERRIDE_NOT_ALLOWED, params: { hash: block.info.hash } });
        return null;
      }

      const opcode = block.info?.opcode;
      if (!opcode) {
        self.errors.push({ code: ErrorCodes.UNKNOWN_BLOCK, params: { hash: block.info.hash } });
        return null;
      }

      // Check whether the block is available for the current target
      if (!self.checkBlockAvailability(opcode)) {
        const targetType = self.target.isStage ? "stage" : "sprite";
        self.errors.push({ code: ErrorCodes.BLOCK_NOT_AVAILABLE, params: { opcode, targetType } });
        return null;
      }

      const block_id = self.genId();

      const block_json = {
        id: block_id,
        opcode: opcode,
        fields: {},
        inputs: {},
        parent: parentBlockId,
        next: null,
        shadow: opcode === "procedures_prototype" ? true : false,
        topLevel: isTopLevel,
      };

      if (opcode === "procedures_prototype") {
        // Regenerate proccode for lookup
        const proccode_parts = [];
        let argIndex = 0;
        for (const child of block.children) {
          if (child.isLabel) {
            proccode_parts.push(child.value.replace("%", "\\%"));
          } else if (child.isBlock) {
            proccode_parts.push(child.isBoolean ? "%b" : "%s");
          }
        }
        const proccode = proccode_parts.join(" ");
        const procDef = procDefinitions.get(proccode);

        if (procDef) {
          // Use prototypeMutation from procDefinitions
          block_json.mutation = procDef.prototypeMutation;

          // Process inputs using argumentids from procDef
          argIndex = 0;
          for (const child of block.children) {
            if (child.isBlock) {
              const param_id = processBlock(child, block_id, false);
              const argId = procDef.argumentids[argIndex];
              block_json.inputs[argId] = {
                block: param_id,
                shadow: param_id,
                name: argId,
              };
              argIndex++;
            }
          }
        } else {
          self.errors.push({ code: ErrorCodes.PROC_PROTOTYPE_NOT_FOUND, params: { proccode } });
        }
      } else if (opcode === "argument_reporter_string_number" || opcode === "argument_reporter_boolean") {
        // Set shadow based on parent block type: true if parent is procedures_prototype, else false
        const parentBlock = findBlockById(parentBlockId);
        block_json.shadow = parentBlock && parentBlock.opcode === "procedures_prototype";
        block_json.fields["VALUE"] = {
          name: "VALUE",
          value: blockName(block),
        };
      } else if (opcode === "procedures_call") {
        // Handle custom block calls
        const proccode = block.info.call;
        const procDef = procDefinitions.get(proccode);

        if (!procDef) {
          self.errors.push({ code: ErrorCodes.PROC_CALL_UNDEFINED, params: { proccode } });
          return null;
        }

        // Validate parameter count
        if (procDef.argumentids.length !== block.parameters.length) {
          self.errors.push({
            code: ErrorCodes.PARAM_COUNT_MISMATCH,
            params: { proccode, expected: procDef.argumentids.length, got: block.parameters.length },
          });
          return null;
        }

        // Use callMutation from procDefinitions
        block_json.mutation = procDef.callMutation;

        // Process parameters
        for (let i = 0; i < procDef.argumentids.length; i++) {
          const param = block.parameters[i];
          const argId = procDef.argumentids[i];
          const argName = procDef.argumentnames[i];

          // TODO: Validate parameter types

          // Infer parameter type (from procDef.argumentdefaults)
          const isBoolean = procDef.argumentdefaults[i] === "false";
          const paramInfo = {
            name: argName,
            type: isBoolean ? BOOLEAN : null,
            opcode: isBoolean ? null : "text",
          };

          const result = processParameter(param, paramInfo, block_id, opcode);

          block_json.inputs[argId] = {
            block: result.block,
            shadow: result.shadow,
            name: argId,
          };
        }
      } else {
        const params_info = blocks_info[opcode]?.params || [];
        if (params_info.length !== block.parameters.length) {
          self.errors.push({
            code: ErrorCodes.PARAM_COUNT_MISMATCH,
            params: { opcode, expected: params_info.length, got: block.parameters.length },
          });
          return null;
        }
        let param_index = 0;
        for (const param_info of params_info) {
          const param = block.parameters[param_index];

          const result = processParameter(param, param_info, block_id, opcode);

          // If parameter validation fails, return null
          if (result === null) {
            return null;
          }

          if (result.type === "field") {
            block_json.fields[result.fieldName] = {
              name: result.fieldName,
              value: result.value,
              variableType: result.variableType,
            };
          } else if (result.type === "input") {
            block_json.inputs[result.inputName] = {
              block: result.block,
              shadow: result.shadow,
              name: result.inputName,
            };
          }

          param_index++;
        }
      }

      // Special block checks
      // control_create_clone_of: when target is stage, _myself_ is not allowed
      if (opcode === "control_create_clone_of") {
        const isStage = self.target.isStage || false;
        const cloneOption = block_json.inputs["CLONE_OPTION"]?.shadow;
        if (isStage && cloneOption) {
          const shadowBlock = findBlockById(cloneOption);
          if (shadowBlock?.fields?.CLONE_OPTION?.value === "_myself_") {
            self.warnings.push({ code: ErrorCodes.CLONE_OF_MYSELF_INVALID_FOR_STAGE, params: {} });
          }
        }
      }

      // sensing_of: validate OBJECT and PROPERTY combinations
      if (opcode === "sensing_of") {
        const propertyValue = block_json.fields["PROPERTY"]?.value;
        const objectInput = block_json.inputs["OBJECT"]?.shadow;

        if (propertyValue && objectInput) {
          const objectBlock = findBlockById(objectInput);
          const objectValue = objectBlock?.fields?.OBJECT?.value;

          if (objectValue === "_stage_") {
            // When OBJECT is _stage_, PROPERTY only allows backdrop #, backdrop name, volume, or stage variables
            const allowedForStage = ["backdrop #", "backdrop name", "volume"];
            if (!allowedForStage.includes(propertyValue)) {
                // Check if it's a stage variable
              if (!validateTargetVariable(propertyValue, "_stage_")) {
                self.warnings.push({
                  code: ErrorCodes.SENSING_OF_STAGE_INVALID_PROPERTY,
                  params: { property: propertyValue, allowed: allowedForStage.join(", ") },
                });
              }
            }
          } else {
            // When OBJECT is not _stage_, backdrop # and backdrop name are not allowed
            const disallowedForSprite = ["backdrop #", "backdrop name"];
            if (disallowedForSprite.includes(propertyValue)) {
              self.warnings.push({
                code: ErrorCodes.SENSING_OF_SPRITE_INVALID_PROPERTY,
                params: { property: propertyValue, objectValue },
              });
            } else if (objectValue) {
              // Check if it's a target sprite's variable
              if (!validateTargetVariable(propertyValue, objectValue)) {
                self.warnings.push({
                  code: ErrorCodes.VARIABLE_NOT_FOUND,
                  params: { variable: propertyValue, targetSprite: objectValue },
                });
              }
            }
          }
        }
      }

      // Special case for data_variable and data_listcontents
      if (opcode === "data_variable") {
        const varName = blockName(block);
        self.variableNames.add(varName);
        block_json.fields["VARIABLE"] = {
          name: "VARIABLE",
          value: varName,
          variableType: "",
        };
      } else if (opcode === "data_listcontents") {
        const listName = blockName(block);
        self.listNames.add(listName);
        block_json.fields["LIST"] = {
          name: "LIST",
          value: listName,
          variableType: "list",
        };
      }

      addBlock(block_json);
      return block_id;
    }

    // Recursively process a script (a sequence of blocks)
    function processScript(blocksList, parentBlockId = null, isTopLevel = true) {
      let firstBlockId = null;
      let previousBlockId = null;

      for (let i = 0; i < blocksList.length; i++) {
        const block = blocksList[i];
        if (block.isComment) {
          continue;
        }

        const blockId = processBlock(block, parentBlockId, isTopLevel && i === 0);

        // If block processing fails, skip this block
        if (!blockId) {
          continue;
        }

        if (!firstBlockId) {
          firstBlockId = blockId;
        }

        if (previousBlockId) {
          const prevBlock = findBlockById(previousBlockId);
          if (prevBlock) {
            prevBlock.next = blockId;
          }
        }

        // Check if the current block is final but not the last in the script
        if (i < blocksList.length - 1) {
          if (block.isFinal) {
            self.errors.push({
              code: ErrorCodes.FINAL_BLOCK_NOT_END,
              params: { opcode: block.info?.opcode },
            });
          }
        }

        if (previousBlockId && !isTopLevel) {
          const currentBlock = findBlockById(blockId);
          if (currentBlock) {
            currentBlock.parent = previousBlockId;
          }
        }

        previousBlockId = blockId;
      }

      return firstBlockId;
    }
  }
}
