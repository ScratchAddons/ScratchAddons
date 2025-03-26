import Cast from "./cast.js";

/**
 * @typedef {Object} Rule
 * @property  {string} name - Name of the rule.
 * @property  {string} id - ID of the rule
 * @property  {string} description - Description of the rule.
 * @property  {boolean|null} [enabled=false] - Enables the rule when created. It's `false` by default.
 */

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
const uid = function () {
  const length = 20;
  const soupLength = soup_.length;
  const id = [];
  for (let i = 0; i < length; i++) {
    id[i] = soup_.charAt(Math.random() * soupLength);
  }
  return id.join("");
};

export default class FormatterUtils {
  #ruleOptions;

  constructor(vm, customRules, addonSettings, addonID) {
    this.vm = vm;
    this.runtime = vm.runtime;
    this.addonSettings = addonSettings;
    this.addonID = addonID;

    this.customRules = customRules;

    this.ignoredItems = new Set();
    this.storage = null;

    this.#ruleOptions = this.createRuleRegistry(
      {
        name: "Griffpatch Style",
        id: "griffpatch-style",
        description:
          "Makes your projects look more like griffpatch's projects.\nExamples include UPPERCASE global variables/lists and vice-versa, Sprite names must be in Title Case, costumes and sound names must be in lowercase and avoid spaces (Excluding the Stage).",
        enabled: true,
      },
      { name: "Test", id: "test", description: "Test", enabled: true },
      {
        name: "Special Starter Characters for Local Variables",
        id: "local-var-startswith-special-char",
        description: "Forces local variables to start with a special character (~, _, -).",
        enabled: false,
      },
      {
        name: "Avoid Capitalized Custom Blocks",
        id: "custom-block-no-capitalized",
        description: "Makes sure that custom blocks aren't capitalized.",
        enabled: false,
      },
      // Create Multiple Test Rules
      ...Array(20)
        .fill()
        .map(() => ({
          name: uid(),
          id: uid(),
          description: uid(),
          enabled: false,
        }))
    );
  }

  /** Creates a new rule registry.
   * @param {Rule[]} rules - Parameters for the function.
   * @returns {Rule[]} The new rule registry.
   */
  createRuleRegistry(...rules) {
    let ruleRegistry = new Set();

    for (const rule of rules) {
      if (rule?.enabled) {
        rule.enabled = this.setRuleEnabled(rule.enabled, rule.id);
      } else {
        rule.enabled = false;
      }
      ruleRegistry.add(JSON.stringify(rule));
    }

    return [...ruleRegistry].map((v) => JSON.parse(v));
  }

  loadStorage() {
    this.storage = JSON.parse(localStorage.getItem("sa-formatter-settings"));
    if (this.storage) {
      this.ignoredItems = new Set(this.storage.ignoredItems);
      this.#ruleOptions = this.storage.map((rule) => {
        return {
          name: rule.name,
          id: rule.id,
          description: rule.description,
          enabled: this.addonSettings.get("formatter-settings-to-menu")
            ? rule.enabled
            : this.addonSettings.get(rule.id),
        };
      });
    }
  }

  /**Toggles a rule if the "formatter settings in menu" addon setting is disabled. Otherwise, it will fallback to the addon setting.
   * @param {boolean} expectedOutput - The expected output to set.
   * @param {string} ruleID - The setting ID of the rule.
   */
  setRuleEnabled(expectedOutput, ruleID) {
    console.log(this.addonSettings.get("formatter-settings-to-menu") ? expectedOutput : ruleID);
    return this.addonSettings.get("formatter-settings-to-menu") ? expectedOutput : this.addonSettings.get(ruleID);
  }

  generateConfig() {
    return JSON.stringify({
      ruleOptions: this.#ruleOptions,
      customRules: this.customRules,
      ignoredItems: this.ignoredItems,
    });
  }

  saveToStorage() {
    localStorage.setItem("sa-formatter-settings", this.generateConfig());
  }

  /**Get all rules. */
  get rules() {
    return this.#ruleOptions;
  }
  /**Enable/disable a rule. */
  set rules({ id, enabled }) {
    const rule = this.#ruleOptions.find((r) => r.id === id);
    if (rule) {
      rule.enabled = enabled;
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
    const targets = runtime.targets;
    const customBlocks = [];

    for (const target of targets) {
      const blocks = target.blocks._blocks;
      for (const blockId in blocks) {
        const block = blocks[blockId];
        if (block.opcode === "procedures_prototype") {
          customBlocks.push({
            text: this.formatCustomBlock(block),
            value: block.id,
          });
        }
      }
    }

    return customBlocks.length > 0 ? customBlocks : [];
  }
  getVariables() {
    const stage = runtime.getTargetForStage();
    const targets = runtime.targets;

    const globalVars = Object.values(stage.variables)
      .filter((v) => v.type !== "list")
      .map((v) => ({ text: v.name, value: v.id }));

    const allVars = targets.filter((t) => t.isOriginal).map((t) => t.variables);
    const localVars = allVars
      .map((v) => Object.values(v))
      .map((v) =>
        // prettier-ignore
        v.filter(
            (v) =>
              v.type !== "list" && !globalVars.map((obj) => obj.text).includes(v.name)
          ).map((v) => ({ text: v.name, value: v.id }))
      )
      .flat(1);

    const variables = {
      local: localVars,
      global: globalVars,
    };

    return variables;
  }

  getLists() {
    const stage = runtime.getTargetForStage();
    const targets = runtime.targets;

    const globalLists = Object.values(stage.variables)
      .filter((v) => v.type === "list")
      .map((v) => ({ text: v.name, value: v.id }));

    const allLists = targets.filter((t) => t.isOriginal).map((t) => t.variables);
    const localLists = allLists
      .map((v) => Object.values(v))
      .map((v) =>
        // prettier-ignore
        v.filter(
            (v) =>
              v.type === "list" && !globalLists.map((obj) => obj.text).includes(v.name)
          ).map((v) => ({ text: v.name, value: v.id }))
      )
      .flat(1);

    const lists = {
      local: localLists,
      global: globalLists,
    };

    return lists;
  }

  checkFormatRule(rule, val, type, opts = {}) {
    if (ignoreList.has(val.value)) return;
    if (rules[rule].enabled) {
      let str = Cast.toString(rules[rule].regex);
      if (str.startsWith("if")) {
        str = this.getLogic(str, opts);
      }

      const regex = new RegExp(str.split("/")[1], str.split("/")[2]);
      regex.lastIndex = 0;

      switch (rule) {
        case "griffpatchStyle": {
          // prettier-ignore
          const isValidName = Cast.toBoolean(opts.isGlobal) ? val.text === val.text.toUpperCase() : val.text === val.text.toLowerCase()
          if (!isValidName) {
            this.formatErrors.push({
              type: type,
              level: rules[rule].level,
              subject: val.text,
              msg: Scratch.translate(
                Cast.toString(rules[rule].msg).replace(/\{([^}]+)\}/g, (e) => {
                  console.log(e);
                  if (e === "{isGlobal}") {
                    return opts.isGlobal ? "UPPERCASE" : "lowercase";
                  } else {
                    return val.text;
                  }
                })
              ),
            });
          }
          break;
        }
        default:
          if (!regex.test(val)) {
            this.formatErrors.push({
              type: type,
              level: rules[rule].level,
              subject: val.text,
              msg: Scratch.translate(Cast.toString(rules[rule].msg).replace(/\{([^}]+)\}/g, val)),
            });
          }
          break;
      }
    }
  }

  findVar(variable, isList, util) {
    if (isList) {
      return util.target.lookupOrCreateList(variable.id, variable.name);
    } else {
      return util.target.lookupOrCreateVariable(variable.id, variable.name);
    }
  }

  /**
   * Formats a variable using a rule.
   * @param {string} rule The rule used to format the variable name.
   * @param { {name: string, id: string}} targetVariable The target variable to format the name of.
   * @param {boolean} isList Is the variable a list?
   * @param {object} opts Optional options.
   */
  _formatVariable(rule, targetVariable, isList, opts, util) {
    const targets = runtime.targets;
    const stage = runtime.getTargetForStage();
    if (opts.isGlobal) {
      for (const variable of Object.values(stage.variables)) {
        if (variable.id === targetVariable.id)
          try {
            workspace.renameVariableById(variable.id, this.formatRule(rule, variable.name, variable.id, opts));
          } catch {}
      }
    } else {
      for (const target of targets) {
        if (target.isSprite()) {
          target.lookupOrCreateList;
          const variable = this.findVar(isList, util);
          if (variable.id in stage.variables) return;
          // @ts-ignore
          try {
            workspace.renameVariableById(
              variable.id,
              this.formatRule(rule, targetVariable.name, targetVariable.id, opts)
            );
          } catch {}
        }
      }
    }
  }

  _formatVariables(util) {
    const variables = this.getVariables();
    for (const variable of variables.local) {
      const variableData = { name: variable.text, id: variable.value };
      this._formatVariable(
        "griffpatchStyle",
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
      this._formatVariable(
        "griffpatchStyle",
        variableData,
        false,
        {
          isGlobal: true,
        },
        util
      );
    }
  }

  _formatLists(util) {
    const lists = this.getLists();
    for (const list of lists.local) {
      const listData = { name: list.text, id: list.value };
      // Since list are just like variables, we can also use this function to format list names too.
      this._formatVariable(
        "griffpatchStyle",
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
        "griffpatchStyle",
        listData,
        true,
        {
          isGlobal: true,
        },
        util
      );
    }
  }

  formatRule(rule, val, valID, opts = {}) {
    if (ignoreList.has(valID)) return val;
    if (rules[rule].enabled) {
      switch (rule) {
        case "griffpatchStyle": {
          const { isGlobal } = opts;
          return isGlobal ? val.toUpperCase() : val.toLowerCase();
        }
        case "camelCaseOnly":
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

  checkCustomFormatRules(val, type) {
    if (ignoreList.has(val.value)) return;
    for (const rule in customRules) {
      if (
        (customRules[rule].enabled && customRules[rule].scopes.includes(type)) ||
        customRules[rule].scopes.includes("all")
      ) {
        let str = Cast.toString(rules[rule].regex);

        const regex = new RegExp(str.split("/")[1], str.split("/")[2]);
        if (!regex.test(val.text)) {
          this.formatErrors.push({
            type: type,
            level: customRules[rule].level,
            subject: val.text,
            msg: Scratch.translate(Cast.toString(rules[rule].msg).replace(/\{([^}]+)\}/g, val)),
          });
        }
      }
    }
  }

  _checkSpriteFormatting() {
    const targets = runtime.targets.filter((t) => t.isSprite()).map((t) => ({ text: t.sprite.name, value: t.id }));
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
      this.checkFormatRule("griffpatchStyle", variable, "variable", {
        isGlobal: false,
      });
      this.checkFormatRule("camelCaseOnly", variable, "variable");
      this.checkCustomFormatRules(variable, "variable");
    }

    // Global variable format check
    console.log("checking global variables");
    for (const variable of variables.global) {
      this.checkFormatRule("griffpatchStyle", variable, "variable", {
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
      this.checkFormatRule("griffpatchStyle", list, "list", {
        isGlobal: false,
      });
      this.checkFormatRule("camelCaseOnly", list, "list");
      this.checkCustomFormatRules(list, "list");
    }

    // Global variable format check
    console.log("checking global variables");
    for (const list of lists.global) {
      this.checkFormatRule("griffpatchStyle", list, "list", {
        isGlobal: true,
      });
      this.checkFormatRule("camelCaseOnly", list, "list");
      this.checkCustomFormatRules(list, "list");
    }
  }

  checkFormatting() {
    if (!isEditor) return;
    this.formatErrors = [];

    this._checkSpriteFormatting();
    this._checkVariableFormatting();
    this._checkListFormatting();
    this._checkCustomBlockFormatting();

    return this.formatErrors;
  }

  formatProject(util) {
    if (!isEditor) return;
    // prettier-ignore
    if (confirm("!~~~WARNING~~~! \n\n This will format the entire project according to the enabled rules. \n\n This process is irreversible and might break the entire project. \n Do you want to proceed?")){
      console.log("formatting project...")
      this._formatVariables(util)
      this._formatLists(util)
      console.info("formatting completed")
    }

    this._formatVariables(util);
    this._formatLists(util);
  }

  checkFormatttingBlock() {
    this.formatErrors = [];

    this._checkSpriteFormatting();
    this._checkVariableFormatting();
    this._checkCustomBlockFormatting();
  }
}
