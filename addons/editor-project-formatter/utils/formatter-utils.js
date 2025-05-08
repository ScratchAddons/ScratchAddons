import Cast from "../utils/cast.js";
import DebuggerConsole from "../../debugger/debugger-module.js";

/**
 * @typedef {Object} Rule
 * @property  {string} name - Name of the rule.
 * @property  {string} id - ID of the rule
 * @property  {string} description - Description of the rule.
 * @property  {"notice"|"warn"|"error"} level - Error level of the rule.
 * @property  {boolean|null} enabled - Enables the rule when created. It's `false` by default.
 * @property {?Option[]} opts - (Optional) Options for the rule. <br> Used to alter the behavour of the rule by the user.
 */

/**
 * @typedef {"string"|"number"|"positive_int"|"int"|"boolean"|"select"|"color"} OptionType
 */

/**
 * @typedef {Object} OptionValues
 * @property {?string} name - Name of the value (optional).
 * @property {string} id - ID of the value.
 */

/**
 * @typedef {Object} Option
 * @property {string} name - Name of the option.
 * @property {string} id - ID of the option.
 * @property {OptionType} type - Type of the option.
 * @property {string} default - Default value of the option.
 * @property {?OptionValues[]} values - Available values to select. Only use with "select".
 */

const DEFAULT_COMMENT_SIZE = 200;

/**Checks if the block belongs to the "Debugger" category. */
function isDebuggerBlock(block) {
  const DEBUGGER_BLOCKS = [
    "\u200B\u200Bbreakpoint\u200B\u200B",
    "\u200B\u200Blog\u200B\u200B %s",
    "\u200B\u200Bwarn\u200B\u200B %s",
    "\u200B\u200Berror\u200B\u200B %s",
  ];

  try {
    const proccode = block?.getProcCode() ?? block.mutation.proccode;

    return DEBUGGER_BLOCKS.includes(proccode);
  } catch {
    return false;
  }
}

/**
 * Legal characters for the unique ID.
 * Should be all on a US keyboard.  No XML special characters or control codes.
 * @private
 */
const soup_ = "!#%()*+,-./:;=?@[]^_`{|}~" + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generate a unique ID, from Blockly.  This should be globally unique.
 * 87 characters ^ 20 length > 128 bits (better than a UUID).
 * @return {string} A globally unique ID string.
 */
export const uid = function () {
  const length = 20;
  const soupLength = soup_.length;
  const id = [];
  for (let i = 0; i < length; i++) {
    id[i] = soup_.charAt(Math.random() * soupLength);
  }
  return id.join("");
};

/**Utilities for the formatter. */
export default class FormatterUtils {
  /**@type {Rule[]} Rule Options. */
  #ruleOptions;
  formatErrors;

  constructor(vm, addon, console, msg) {
    this.vm = vm;
    this.runtime = vm.runtime;
    this.addon = addon;
    this.console = console;

    this.customRules = {};

    this.ignoredItems = new Set();
    this.storage = null;
    this.formatErrors = [];
    this.mainWorkspace = this.addon.tab.traps.getBlockly().then((ScratchBlocks) => ScratchBlocks.getMainWorkspace());

    this.#ruleOptions = this.createRuleRegistry(
      {
        name: "Griffpatch Style",
        level: "error",
        id: "griffpatch-style",
        description:
          "Makes your projects look more like griffpatch's projects.\nExamples include UPPERCASE global variables/lists and vice-versa, Sprite names must be in Title Case, costumes and sound names must be in lowercase and avoid spaces (Excluding the Stage).",
        enabled: true,
      },
      { name: "Test", id: "test", description: "Test", level: "notice", enabled: true },
      {
        name: "Special Starter Characters for Local Variables",
        level: "error",
        id: "local-var-startswith-special-char",
        description: "Forces local variables to start with a special character (~, _, -).",
        enabled: false,
        opts: {
          name: "Starter Character",
          id: "start_char",
          type: "select",
          values: [
            {
              text: 'Underscore ("_")',
              id: "_",
            },
            {
              text: 'Tilde ("~")',
              id: "~",
            },
            {
              text: 'Dash ("-")',
              id: "-",
            },
          ],
          default: "_",
        },
      },
      {
        name: "Avoid Capitalized Custom Blocks",
        level: "error",
        id: "custom-block-no-capitalized",
        description: "Makes sure that custom blocks aren't capitalized.",
        enabled: false,
      }
    );

    this.addon.tab.redux.initialize();

    this.addon.tab.redux.addEventListener("statechanged", (e) => {
      // Saving states
      const START_MANUAL_UPDATING = "scratch-gui/project-state/START_MANUAL_UPDATING";
      const START_AUTO_UPDATING = "scratch-gui/project-state/START_AUTO_UPDATING";
      const START_UPDATING_BEFORE_CREATING_COPY = "scratch-gui/project-state/START_UPDATING_BEFORE_CREATING_COPY";
      const START_UPDATING_BEFORE_CREATING_NEW = "scratch-gui/project-state/START_UPDATING_BEFORE_CREATING_NEW";

      const savedStates = [
        START_MANUAL_UPDATING,
        START_AUTO_UPDATING,
        START_UPDATING_BEFORE_CREATING_COPY,
        START_UPDATING_BEFORE_CREATING_NEW,
      ];

      const { action } = e.detail;
      if (action) {
        if (savedStates.includes(action.type) && this.addon.settings.get("save-with-project")) {
          this.console.log(e.detail);
          this.saveConfigToProject();
        }
      }
    });
  }

  /** Creates a new rule registry.
   * @param {Rule[]} rules - List of rules as parameters.
   * @returns {Rule[]} The new rule registry.
   */
  createRuleRegistry(...rules) {
    let ruleRegistry = new Set();

    for (const rule of rules) {
      if (rule?.enabled === null || rule?.enabled === undefined) {
        rule.enabled = false;
      }
      ruleRegistry.add(JSON.stringify(rule));
    }

    return [...ruleRegistry].map((v) => JSON.parse(v));
  }

  loadConfigFromComment() {
    const comment = this.findConfigCommentInStage();
    if (comment) {
      this.loadConfig(comment.text);
    } else {
      this.loadConfig();
    }
    this.logToDebugger("test", null, "warn");
  }

  loadConfig(config) {
    let parsed_config;
    if (config) {
      const match = config.match(/formatter-config:\/\/(.*?)\/\/:formatter-config/);
      parsed_config = match[1];
    } else {
      parsed_config = null;
    }
    this.console.log("loading config:", JSON.parse(parsed_config));

    this.storage = parsed_config ? JSON.parse(parsed_config) : null;

    if (this.storage) {
      this.ignoredItems = new Set(this.storage.ignoredItems) ?? this.ignoredItems;
      this.#ruleOptions = this.storage.ruleOptions ?? this.#ruleOptions;
      this.customRules = this.storage.customRules ?? this.customRules;
    }
  }

  findConfigCommentInStage() {
    const stage = this.runtime.getTargetForStage();

    if (stage?.comments) {
      for (const comment of Object.values(stage.comments)) {
        if (/formatter-config:\/\/.+\/\/:formatter-config/.test(comment.text)) {
          return comment;
        }
      }
    }

    return null;
  }

  /**Saves the formatter configuration into a comment. */
  saveConfigToProject() {
    const CONFIG_COMMENT_TEXT = `Project Formatter Configuration.\n\nYou can move, resize and minimize this comment, but don't edit it by hand unless you actually know what you're doing.\nThis comment can be deleted to reset the formatter configuration.\n\nformatter-config://${this.generateConfig()}//:formatter-config`;

    const stage = this.runtime.getTargetForStage();
    const comment = this.findConfigCommentInStage();
    if (!comment) {
      stage.createComment(uid(), null, CONFIG_COMMENT_TEXT, 50, 50, 635, 465, false);
      this.console.log("created new comment");
    } else {
      if (comment.text !== CONFIG_COMMENT_TEXT) {
        comment.text = CONFIG_COMMENT_TEXT;
      } else {
        this.console.info("There was no change on the formatter configuration.");
        return;
      }
    }

    this.runtime.emitProjectChanged();
    this.console.log(this.vm.editingTarget.isStage);
    if (this.vm.editingTarget.isStage) {
      this.console.log("update stage workspace");
      this.vm.emitWorkspaceUpdate();
    }

    this.console.info("saved editor formatter config");
    this.loadConfigFromComment();
  }

  generateConfig() {
    return JSON.stringify({
      ruleOptions: this.#ruleOptions,
      customRules: this.customRules,
      ignoredItems: [...this.ignoredItems],
    });
  }

  getRuleByID(id) {
    try {
      return this.#ruleOptions.find((rule) => rule.id === id);
    } catch {
      return null;
    }
  }

  async logToDebugger(msg, thread, level) {
    const enabledAddons = await this.addon.self.getEnabledAddons("codeEditor");
    if (this.addon.settings.get("debugger-support") && enabledAddons.includes("debugger")) {
      DebuggerConsole.addLog(msg, thread, level === "notice" ? "log" : level);
    }
  }

  /** Rules of the formatter. */
  get rules() {
    return this.#ruleOptions;
  }
  set rules({ id, level, enabled }) {
    const rule = this.#ruleOptions.find((r) => r.id === id);
    if (rule) {
      rule.enabled = enabled;
      rule.level = level;
    } else {
      console.error(`Rule with ID ${id} not found.`);
    }
  }

  getLogic(str, opts) {
    let codeLine = Cast.toString(str);
    const logicCodeLineArray = codeLine.split(" ");
    let boolResult = false;
    let result = null;

    // Check for each spaces
    for (const line of logicCodeLineArray) {
      // Check if it's a boolean
      if (/<([^>]+)>/g.test(line)) {
        // Is it a primitive boolean value?
        if (line === "<true>") {
          boolResult = true;
        } else if (line === "<false>") {
          boolResult = false;
          // Otherwise, it's an argument/option
        } else {
          const optsArray = Object.values(opts).map((value) => Cast.toBoolean(value));
          const boolArgs = codeLine.match(/<([^<>]+)>/g);
          for (const boolVal of boolArgs) {
            if (Cast.toBoolean(Object.keys(opts).indexOf(boolVal.replace(/[<>]/g, "")) === boolArgs.indexOf(boolVal))) {
              boolResult = optsArray[boolArgs.indexOf(boolVal)];
            }
          }
        }
      } else {
        // Tenary operator logic
        if (line === "if") {
          continue;
        } else if (line === "else") {
          if (!boolResult) {
            result = logicCodeLineArray.slice(logicCodeLineArray.indexOf(line) + 1).join(" ");
            break;
          }
        } else if (boolResult === undefined) {
          continue;
        } else if (boolResult) {
          result = line;
          break;
        }
      }
    }

    return result;
  }
  getCustomBlocks() {
    const targets = this.runtime.targets;
    const customBlocks = [];

    for (const target of targets) {
      const blocks = target.blocks._blocks;
      if (blocks) {
        for (const block of blocks) {
          if (block?.opcode === "procedures_call" && !isDebuggerBlock(block)) {
            customBlocks.push({
              name: this.formatCustomBlock(block),
              id: block.id,
            });
          }
        }
      }
    }

    return customBlocks.length > 0 ? customBlocks : [];
  }
  getVariables() {
    const stage = this.runtime.getTargetForStage();
    const targets = this.runtime.targets;

    const globalVars = Object.values(stage.variables)
      .filter((v) => v.type !== "list")
      .map((v) => ({ name: v.name, id: v.id }));

    const allVars = targets.filter((t) => t.isOriginal).map((t) => t.variables);
    const localVars = allVars
      .map((v) => Object.values(v))
      .map((v) =>
        // prettier-ignore
        v.filter((v) => v.type !== "list" && !globalVars.map((obj) => obj.name).includes(v.name)).map((v) => ({ name: v.name, id: v.id }))
      )
      .flat(1);

    const variables = {
      local: localVars,
      global: globalVars,
    };

    return variables;
  }

  getLists() {
    const stage = this.runtime.getTargetForStage();
    const targets = this.runtime.targets;

    const globalLists = Object.values(stage.variables)
      .filter((v) => v.type === "list")
      .map((v) => ({ name: v.name, id: v.id }));

    const allLists = targets.filter((t) => t.isOriginal).map((t) => t.variables);
    const localLists = allLists
      .map((v) => Object.values(v))
      .map((v) =>
        // prettier-ignore
        v.filter(
            (v) =>
              v.type === "list" && !globalLists.map((obj) => obj.name).includes(v.name)
          ).map((v) => ({ tenamext: v.name, id: v.id }))
      )
      .flat(1);

    const lists = {
      local: localLists,
      global: globalLists,
    };

    return lists;
  }

  checkFormatRule(ruleID, val, type, { isGlobal = false }) {
    const rule = this.getRuleByID(ruleID);

    if (ignoreList.has(val.id)) return;
    if (rule.enabled) {
      switch (rule.id) {
        case "griffpatch-style": {
          // prettier-ignore
          const isValidName = isGlobal ? val.text === val.text.toUpperCase() : val.text === val.text.toLowerCase()
          if (!isValidName) {
            this.formatErrors.push({
              type: type,
              level: rule.level,
              subject: val.text,
              msg: "",
            });
          }
          break;
        }
        default:
          this.console.error(`Couldn't find rule "${rule.id}"`);
          break;
      }
    }
  }

  lookupVarList(variable, isList) {
    if (isList) {
      return this.vm.editingTarget.lookupOrCreateList(variable.id, variable.name);
    } else {
      return this.vm.editingTarget.lookupOrCreateVariable(variable.id, variable.name);
    }
  }

  /**
   * Formats a variable using a rule.
   * @param {string} rule The rule used to format the variable name.
   * @param { {name: string, id: string}} targetVariable The target variable to format the name of.
   * @param {boolean} isList Is the variable a list?
   * @param {object} opts Optional options.
   */
  _formatVariable(rule, targetVariable, isList, { isGlobal = false }) {
    const targets = this.runtime.targets;
    const stage = this.runtime.getTargetForStage();
    if (isGlobal) {
      for (const variable of Object.values(stage.variables)) {
        if (variable.id === targetVariable.id)
          this.mainWorkspace.renameVariableById(variable.id, this.formatRule(rule, variable.name, variable.id, opts));
      }
    } else {
      for (const target of targets) {
        if (target.isSprite()) {
          const variable = this.lookupVarList(isList);
          if (variable.id in stage.variables) return;
          // @ts-ignore
          try {
            this.mainWorkspace.renameVariableById(
              variable.id,
              this.formatRule(rule, targetVariable.name, targetVariable.id, opts)
            );
          } catch {}
        }
      }
    }
  }

  _formatVariables() {
    const variables = this.getVariables();
    for (const variable of variables.local) {
      const variableData = { name: variable.text, id: variable.value };
      this._formatVariable(
        "griffpatch-style",
        variableData,
        false,
        {
          isGlobal: false,
        },
        util
      );
    }
    for (const variable of variables.global) {
      const variableData = { name: variable.text, id: variable.value };
      this._formatVariable("griffpatch-style", variableData, false, {
        isGlobal: true,
      });
    }
  }

  _formatLists(util) {
    const lists = this.getLists();
    for (const list of lists.local) {
      const listData = { name: list.text, id: list.value };
      // Since list are just like variables, we can also use this function to format list names too.
      this._formatVariable(
        "griffpatch-style",
        listData,
        true,
        {
          isGlobal: false,
        },
        util
      );
    }
    for (const list of lists.global) {
      const listData = { name: list.text, id: list.value };
      this._formatVariable(
        "griffpatch-style",
        listData,
        true,
        {
          isGlobal: true,
        },
        util
      );
    }
  }

  formatRule(ruleID, val, valID, { isGlobal = false }) {
    const rule = this.getRuleByID(ruleID);

    if (ignoreList.has(valID)) return val;

    if (rules[rule].enabled) {
      switch (rule) {
        case "griffpatch-style": {
          return isGlobal ? val.toUpperCase() : val.toLowerCase();
        }
        case "camel-case-only":
          // prettier-ignore
          return val.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
        case "customNoCapitalized":
          // prettier-ignore
          return val.charAt(0).toLowerCase() + val.slice(1);
      }
    } else {
      return val;
    }
  }

  _checkSpriteFormatting() {
    const targets = this.runtime.targets.filter((t) => t.isSprite()).map((t) => ({ text: t.sprite.name, value: t.id }));
    console.log("checking sprites");
    for (const target of targets) {
      // Format check
      this.checkFormatRule("camelCaseOnly", target, "sprite");
      this.checkCustomFormatRules(target, "sprite");
    }
  }
  formatCustomBlock(block) {
    const mutation = block.mutation;
    const args = JSON.parse(mutation.argumentnames);

    let i = 0;
    const name = mutation.proccode.replace(/%[snb]/g, (match) => {
      let value = args[i++];
      if (match === "%s") return `[${value}]`;
      if (match === "%n") return `(${value})`;
      if (match === "%b") return `<${value}>`;
      return match;
    });
    return name;
  }

  _checkCustomBlockFormatting() {
    const blocks = !(this.getCustomBlocks().length > 0) ? [] : this.getCustomBlocks();

    console.log("checking custom blocks");
    for (const block in blocks) {
      if (!ignoreList.has(blocks[block].value)) {
        // prettier-ignore
        this.checkFormatRule("customNoCapitalized", blocks[block].text, "custom_block");
        // prettier-ignore
        this.checkFormatRule("camelCaseOnly", blocks[block].text, "custom_block");
        this.checkCustomFormatRules(blocks[block].text, "custom_block");
      }
    }
  }

  _checkVariableFormatting() {
    const variables = this.getVariables();

    // Local variable format check
    console.log("checking local variables");
    for (const variable of variables.local) {
      this.checkFormatRule("griffpatch-style", variable, "variable", {
        isGlobal: false,
      });
      this.checkFormatRule("camelCaseOnly", variable, "variable");
      this.checkCustomFormatRules(variable, "variable");
    }

    // Global variable format check
    console.log("checking global variables");
    for (const variable of variables.global) {
      this.checkFormatRule("griffpatch-style", variable, "variable", {
        isGlobal: true,
      });
      this.checkFormatRule("camelCaseOnly", variable, "variable");
      this.checkCustomFormatRules(variable, "variable");
    }
  }

  _checkListFormatting() {
    const lists = this.getLists();

    // Local variable format check
    console.log("checking local variables");
    for (const list of lists.local) {
      this.checkFormatRule("griffpatch-style", list, "list", {
        isGlobal: false,
      });
      this.checkFormatRule("camelCaseOnly", list, "list");
      this.checkCustomFormatRules(list, "list");
    }

    // Global variable format check
    console.log("checking global variables");
    for (const list of lists.global) {
      this.checkFormatRule("griffpatch-style", list, "list", {
        isGlobal: true,
      });
      this.checkFormatRule("camelCaseOnly", list, "list");
      this.checkCustomFormatRules(list, "list");
    }
  }

  checkFormatting() {
    this.formatErrors = [];

    this._checkSpriteFormatting();
    this._checkVariableFormatting();
    this._checkListFormatting();
    this._checkCustomBlockFormatting();

    return this.formatErrors;
  }

  /**Formats the project according to the enabled rules
   * @param {boolean} cleanUpOrphans Cleans up all orphans (not only reporters) if enabled.
   */
  formatProject(cleanUpOrphans) {
    // prettier-ignore
    this.console.log("formatting project...")
    this._formatVariables();
    this._formatLists();
    this.console.info("formatting completed");

    this.addon.tab.traps.getBlockly().then((ScratchBlocks) => {
      const oldCleanUpFunc = ScratchBlocks.WorkspaceSvg.prototype.cleanUp;
      const self = this;
      ScratchBlocks.WorkspaceSvg.prototype.cleanUp = function () {
        oldCleanUpFunc.call(this);
        if (cleanUpOrphans) {
          self.cleanUpOrphans();
        }
      };
    });
  }
}
