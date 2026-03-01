import { Text2Blocks } from "./scratchblocks/text2blocks.js";
import { getLocale } from "./scratchblocks/build-locales.js";
import { loadLanguages } from "./scratchblocks/blocks.js";
import { TabManager } from "./tab-manager.js";

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const workspace = addon.tab.traps.getWorkspace();
  const vm = addon.tab.traps.vm;
  const redux = addon.tab.redux;
  const userLang = redux.state.locales.locale;

  loadLanguages({
    en: getLocale("en", redux.state, Blockly),
    ...(userLang !== "en" ? { [userLang]: getLocale(userLang, redux.state, Blockly) } : {}),
  });

  const editorMenu = document.querySelector("[class^=menu-bar_main-menu_]");
  const devider = document.createElement("div");
  devider.className = addon.tab.scratchClass("divider_divider", "menu-bar_divider");
  editorMenu.appendChild(devider);

  const menuItem = document.createElement("div");
  menuItem.className = addon.tab.scratchClass("menu-bar_menu-bar-item", "menu-bar_no-offset", "menu-bar_hoverable");
  menuItem.textContent = msg("main");
  editorMenu.appendChild(menuItem);

  menuItem.addEventListener("click", async () => {
    const modal = addon.tab.createModal(msg("main"), {
      isOpen: true,
      useEditorClasses: true,
    });

    const { container, content, closeButton, remove } = modal;

    closeButton.addEventListener("click", remove);

    container.classList.add("sa-text2blocks-modal-container");
    content.style.height = "100%";

    // Initialize TabManager
    const tabManager = new TabManager(addon, content, "sa-text2blocks-tabs-container");

    // Create Code tab
    const textarea = document.createElement("textarea");
    textarea.className = addon.tab.scratchClass("prompt_variable-name-text-input", {
      others: "sa-text2blocks-textarea",
    });
    tabManager.createTab(msg("code"), "code-tab", textarea);

    // Create Variables tab
    const variablesPanel = document.createElement("div");
    variablesPanel.className = addon.tab.scratchClass("sa-text2blocks-variables-panel", {
      others: "sa-text2blocks-variables-content",
    });
    tabManager.createTab(msg("variables"), "variables-tab", variablesPanel);

    // Create Issues tab
    const issuesPanel = document.createElement("div");
    issuesPanel.className = addon.tab.scratchClass("sa-text2blocks-issues-panel", {
      others: "sa-text2blocks-issues-content",
    });
    tabManager.createTab(msg("issues"), "issues-tab", issuesPanel);

    // Switch to code tab
    tabManager.switchTab("code-tab");

    // Used to record variable mapping selections
    const variableMappings = new Map(); // key: variableName, value: { type: 'new' | 'existing', data: {...} }

    // Create button row
    const buttonRow = document.createElement("div");
    buttonRow.className = addon.tab.scratchClass("prompt_button-row");

    // Parse button
    const parseButton = document.createElement("button");
    parseButton.textContent = msg("parse-button");
    parseButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-text2blocks-button" });

    // Apply button
    const applyButton = document.createElement("button");
    applyButton.textContent = msg("apply-button");
    applyButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-text2blocks-button" });
    applyButton.disabled = true; // Initially disabled until parse succeeds

    buttonRow.append(parseButton, applyButton);
    content.append(buttonRow);

    // Listen for textarea input changes
    textarea.addEventListener("input", () => {
      // Disable apply button on text change
      applyButton.disabled = true;
      // Allow re-parse
      parseButton.disabled = false;
    });

    const target = vm.runtime.getEditingTarget();
    const text2blocks = new Text2Blocks(target, vm.runtime, Blockly.utils.genUid, workspace);

    // Function to update Variables panel
    function updateVariablesPanel() {
      // Clear existing content
      variablesPanel.innerHTML = "";

      if (text2blocks.variableNames.size === 0 && text2blocks.listNames.size === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = msg("no-variables-lists");
        emptyMsg.style.color = "var(--editorDarkMode-input-transparentText, rgba(255, 255, 255, 0.4))";
        variablesPanel.appendChild(emptyMsg);
        return;
      }

      // Show Variables
      if (text2blocks.variableNames.size > 0) {
        const varTitle = document.createElement("h3");
        varTitle.textContent = msg("variables");
        varTitle.style.marginBottom = "10px";
        varTitle.style.color = "var(--editorDarkMode-page-text, #ffffff)";
        variablesPanel.appendChild(varTitle);

        const varTable = createVariablesTable(Array.from(text2blocks.variableNames), "variable");
        variablesPanel.appendChild(varTable);
      }

      // Show Lists
      if (text2blocks.listNames.size > 0) {
        const listTitle = document.createElement("h3");
        listTitle.textContent = msg("lists");
        listTitle.style.marginBottom = "10px";
        listTitle.style.marginTop = "20px";
        listTitle.style.color = "var(--editorDarkMode-page-text, #ffffff)";
        variablesPanel.appendChild(listTitle);

        const listTable = createVariablesTable(Array.from(text2blocks.listNames), "list");
        variablesPanel.appendChild(listTable);
      }
    }

    // Function to update Issues panel
    function updateIssuesPanel() {
      // Clear existing content
      issuesPanel.innerHTML = "";

      const hasErrors = text2blocks.errors.length > 0;
      const hasWarnings = text2blocks.warnings.length > 0;

      if (!hasErrors && !hasWarnings) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = msg("no-issues");
        emptyMsg.style.color = "var(--editorDarkMode-input-transparentText, rgba(255, 255, 255, 0.4))";
        issuesPanel.appendChild(emptyMsg);
        return;
      }

      // Function to format error messages
      function formatErrorMessage(error) {
        const { code, params } = error;
        const p = params || {};

        switch (code) {
          case "INVALID_PROCCODE":
            return `Invalid proccode: "${p.proccode}"`;
          case "PROCCODE_WITH_CONTROL_CHARS":
            return `Invalid proccode (contains control characters): "${p.proccode}"`;
          case "TYPE_MISMATCH":
            return `Type mismatch for ${p.parentOpcode}.${p.inputName}: expected ${p.expected}, got ${p.got}`;
          case "PARAM_COUNT_MISMATCH":
            return `Parameter count mismatch: expected ${p.expected}, got ${p.got}${
              p.opcode ? ` for block ${p.opcode}` : p.proccode ? ` for procedure "${p.proccode}"` : ""
            }`;
          case "UNKNOWN_BLOCK":
            return `Unknown block (hash: ${p.hash})`;
          case "BLOCK_NOT_AVAILABLE":
            return `Block "${p.opcode}" is not available for ${p.targetType}`;
          case "SHAPE_OVERRIDE_NOT_ALLOWED":
            return `Shape override not allowed for block (hash: ${p.hash})`;
          case "CATEGORY_OVERRIDE_NOT_ALLOWED":
            return `Category override not allowed for block (hash: ${p.hash})`;
          case "PROC_PROTOTYPE_NOT_FOUND":
            return `Procedure prototype not found for: "${p.proccode}"`;
          case "PROC_CALL_UNDEFINED":
            return `Procedure call refers to undefined procedure: "${p.proccode}"`;
          case "FINAL_BLOCK_NOT_END":
            return `Final block (${p.opcode}) must be at the end`;
          case "MENU_NOT_FOUND":
            return `Menu "${p.menu}" not found for ${p.parentOpcode}.${p.inputName}`;
          case "VALUE_NOT_FOUND":
            return `Value "${p.value}" not found in ${p.expectedType} for ${p.parentOpcode}.${p.inputName}`;
          case "NOTE_VALUE_OUT_OF_RANGE":
            return `Note value "${p.value}" out of range (${p.min}-${p.max}) for ${p.parentOpcode}.${p.inputName}`;
          case "VARIABLE_NOT_FOUND":
            return `Variable "${p.variable}" not found${
              p.targetSprite ? ` in sprite "${p.targetSprite}"` : " in stage"
            }`;
          case "CLONE_OF_MYSELF_INVALID_FOR_STAGE":
            return `Block "control_create_clone_of" cannot use "_myself_" option when target is stage`;
          case "SENSING_OF_STAGE_INVALID_PROPERTY":
            return `Block "sensing_of" with stage: PROPERTY can only be ${p.allowed}`;
          case "SENSING_OF_SPRITE_INVALID_PROPERTY":
            return `Block "sensing_of" with sprite "${p.objectValue}": PROPERTY "${p.property}" is only available for stage`;
          case "DUPLICATE_PROC_DEFINITION":
            return `Duplicate procedure definition for: "${p.proccode}"`;
          default:
            return `${code}${p ? ": " + JSON.stringify(p) : ""}`;
        }
      }

      // Show Errors
      if (hasErrors) {
        const errorTitle = document.createElement("h3");
        errorTitle.textContent = msg("errors");
        errorTitle.style.marginBottom = "10px";
        errorTitle.style.color = "#ff6b6b";
        issuesPanel.appendChild(errorTitle);

        const errorList = document.createElement("ul");
        errorList.style.color = "var(--editorDarkMode-page-text, #ffffff)";
        errorList.style.marginBottom = "20px";
        for (const error of text2blocks.errors) {
          const li = document.createElement("li");
          li.textContent = formatErrorMessage(error);
          li.style.marginBottom = "8px";
          errorList.appendChild(li);
        }
        issuesPanel.appendChild(errorList);
      }

      // Show Warnings
      if (hasWarnings) {
        const warningTitle = document.createElement("h3");
        warningTitle.textContent = msg("warnings");
        warningTitle.style.marginBottom = "10px";
        warningTitle.style.color = "#ffd166";
        issuesPanel.appendChild(warningTitle);

        const warningList = document.createElement("ul");
        warningList.style.color = "var(--editorDarkMode-page-text, #ffffff)";
        for (const warning of text2blocks.warnings) {
          const li = document.createElement("li");
          li.textContent = formatErrorMessage(warning);
          li.style.marginBottom = "8px";
          warningList.appendChild(li);
        }
        issuesPanel.appendChild(warningList);
      }
    }

    // Function to create variables/lists table
    function createVariablesTable(names, type) {
      const table = document.createElement("table");
      table.className = "sa-text2blocks-table";

      // Create table header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      const nameHeader = document.createElement("th");
      nameHeader.textContent = msg("name");
      nameHeader.className = "sa-text2blocks-table-name-col";

      const actionHeader = document.createElement("th");
      actionHeader.textContent = msg("action");
      actionHeader.className = "sa-text2blocks-table-action-col";

      const configHeader = document.createElement("th");
      configHeader.textContent = msg("configuration");
      configHeader.className = "sa-text2blocks-table-config-col";

      headerRow.appendChild(nameHeader);
      headerRow.appendChild(actionHeader);
      headerRow.appendChild(configHeader);
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create table body
      const tbody = document.createElement("tbody");
      for (const name of names) {
        const row = createVariableRow(name, type);
        tbody.appendChild(row);
      }
      table.appendChild(tbody);

      return table;
    }

    // Function to create a table row
    function createVariableRow(name, type) {
      const row = document.createElement("tr");

      // Column 1: variable/list name
      const nameCell = document.createElement("td");
      nameCell.className = "sa-text2blocks-table-name-col";
      const nameLabel = document.createElement("span");
      nameLabel.textContent = name;
      nameCell.appendChild(nameLabel);
      row.appendChild(nameCell);

      // Column 2: action selection
      const actionCell = document.createElement("td");
      actionCell.className = "sa-text2blocks-table-action-col";
      const actionSelect = document.createElement("select");
      actionSelect.className = "sa-text2blocks-select";

      const optionNew = document.createElement("option");
      optionNew.value = "new";
      optionNew.textContent = msg("create-new");
      actionSelect.appendChild(optionNew);

      const optionExisting = document.createElement("option");
      optionExisting.value = "existing";
      optionExisting.textContent = msg("use-existing");
      actionSelect.appendChild(optionExisting);

      actionSelect.value = "new"; // Default to "Create new"
      actionCell.appendChild(actionSelect);
      row.appendChild(actionCell);

      // Column 3: configuration
      const configCell = document.createElement("td");
      configCell.className = "sa-text2blocks-table-config-col";
      const configContainer = document.createElement("div");
      configContainer.className = "sa-text2blocks-config-container";

      // Initially show create-new-variable config
      const initialConfigContent = createNewVarConfig(name, type);
      configContainer.appendChild(initialConfigContent);
      configCell.appendChild(configContainer);
      row.appendChild(configCell);

      // Action dropdown change event
      actionSelect.addEventListener("change", () => {
        configContainer.innerHTML = "";
        if (actionSelect.value === "new") {
          const newVarConfig = createNewVarConfig(name, type);
          configContainer.appendChild(newVarConfig);
        } else if (actionSelect.value === "existing") {
          const existingVarConfig = createExistingVarConfig(name, type);
          configContainer.appendChild(existingVarConfig);
        }
      });

      return row;
    }

    // Create UI for new variable configuration
    function createNewVarConfig(name, type) {
      const container = document.createElement("div");
      container.className = "sa-text2blocks-config-container";

      // Input: custom new name
      const input = document.createElement("input");
      input.type = "text";
      input.className = "sa-text2blocks-input";
      input.placeholder = msg("new-name-placeholder", { name });
      input.value = "";

      // Scope selection
      const scopeSelect = document.createElement("select");
      scopeSelect.className = "sa-text2blocks-select";

      const optionSprite = document.createElement("option");
      optionSprite.value = "sprite";
      optionSprite.textContent = addon.tab.scratchMessage("gui.gui.variableScopeOptionSpriteOnly");
      scopeSelect.appendChild(optionSprite);

      const optionGlobal = document.createElement("option");
      optionGlobal.value = "global";
      optionGlobal.textContent = addon.tab.scratchMessage("gui.gui.variableScopeOptionAllSprites");
      scopeSelect.appendChild(optionGlobal);

      scopeSelect.value = "sprite"; // Default to "For this sprite"

      // Listen for changes
      function updateMapping() {
        const customName = input.value.trim() || name; // Use original name if left empty
        const scope = scopeSelect.value;
        console.log(`[TODO] Create new ${type} "${customName}" with scope: ${scope}`);
        variableMappings.set(name, {
          type: "new",
          data: {
            name: customName,
            varType: type,
            scope: scope,
          },
        });
        console.log("Variable mappings updated:", variableMappings);
      }

      input.addEventListener("change", updateMapping);
      input.addEventListener("input", updateMapping);
      scopeSelect.addEventListener("change", updateMapping);

      // Initialize mapping
      updateMapping();

      container.appendChild(input);
      container.appendChild(scopeSelect);
      return container;
    }

    // Create UI for mapping to existing variable
    function createExistingVarConfig(name, type) {
      const container = document.createElement("div");
      container.className = "sa-text2blocks-config-container";

      const existingSelect = document.createElement("select");
      existingSelect.className = "sa-text2blocks-select";

      const existingVariables = getVariablesOfTarget(target, type);
      for (const varObj of existingVariables) {
        const option = document.createElement("option");
        option.value = varObj.name;
        option.textContent = varObj.name;
        option.dataset.variableId = varObj.id; // store variable ID
        existingSelect.appendChild(option);
      }

      // Initialize mapping (use first existing variable)
      function updateMapping() {
        const selectedVar = existingSelect.value;
        const selectedOption = existingSelect.options[existingSelect.selectedIndex];
        const variableId = selectedOption.dataset.variableId;
        console.log(`Map "${name}" to existing ${type} "${selectedVar}" (id: ${variableId})`);
        variableMappings.set(name, {
          type: "existing",
          data: {
            name: name,
            varType: type,
            mappedTo: selectedVar,
            mappedToId: variableId,
          },
        });
        console.log("Variable mappings updated:", variableMappings);
      }

      existingSelect.addEventListener("change", updateMapping);

      // Initialize mapping (use first existing variable)
      if (existingVariables.length > 0) {
        updateMapping();
      }

      container.appendChild(existingSelect);
      return container;
    }

    // Parse button event
    parseButton.addEventListener("click", async () => {
      try {
        const text = textarea.value;
        text2blocks.text2blocks(text, userLang !== "en" ? [userLang, "en"] : ["en"]);
        console.log("Converted blocks JSON:", text2blocks.blockJson);
        console.log("Variable names:", text2blocks.variableNames);
        console.log("List names:", text2blocks.listNames);
        console.log("Errors:", text2blocks.errors);
        console.log("Warnings:", text2blocks.warnings);
        updateVariablesPanel();
        updateIssuesPanel();

        // Disable apply if errors exist; otherwise enable
        if (text2blocks.errors.length > 0) {
          applyButton.disabled = true;
        } else {
          applyButton.disabled = false;
        }

        // Auto-switch to Issues tab if issues exist, else Variables tab if variables exist
        if (text2blocks.errors.length > 0 || text2blocks.warnings.length > 0) {
          tabManager.switchTab("issues-tab");
        } else if (text2blocks.variableNames.size > 0 || text2blocks.listNames.size > 0) {
          tabManager.switchTab("variables-tab");
        }
      } catch (error) {
        console.log("Error parsing text:", error);
        applyButton.disabled = true; // Disable apply button
        alert("Parse failed: " + error.message);
      }
    });

    // Apply button event
    applyButton.addEventListener("click", async () => {
      if (text2blocks.warnings.length > 0) {
        if (
          !(await addon.tab.confirm(msg("warnings-title"), msg("warnings-confirm-content"), { useEditorClasses: true }))
        ) {
          return;
        }
      }

      try {
        // Prepare final variable mapping: originalName -> {name, id}
        const finalVariableMappings = new Map();
        const stage = vm.runtime.getTargetForStage();

        // First create all new variables to obtain IDs before recording mappings
        for (const [originalName, mapping] of variableMappings) {
          if (mapping.type === "new") {
            const { name: newName, varType, scope } = mapping.data;
            const variableType = varType === "list" ? "list" : ""; // "" indicates a normal variable

            // Generate a unique variable ID
            const variableId = Blockly.utils.genUid();

            let targetForVar;
            let isCloud = false;

            if (scope === "sprite") {
              // Sprite-scoped variable: create on current sprite
              targetForVar = target;
              isCloud = false;
            } else if (scope === "global") {
              // Global variable: create on stage
              targetForVar = stage;
              isCloud = false;
            } else if (scope === "cloud") {
              // TODO: cloud variables not implemented yet
              console.warn(`[TODO] Cloud variable "${newName}" is not yet supported`);
              continue;
            }

            // Create variable/list
            targetForVar.createVariable(variableId, newName, variableType, isCloud);

            finalVariableMappings.set(originalName, {
              name: newName,
              id: variableId,
            });
          } else if (mapping.type === "existing") {
            // Directly record mapping for existing variable
            finalVariableMappings.set(originalName, {
              name: mapping.data.mappedTo,
              id: mapping.data.mappedToId,
            });
          }
        }

        // Apply variable mappings, replace variable references in blocks
        text2blocks.applyVariableMappings(finalVariableMappings);

        await vm.shareBlocksToTarget(text2blocks.blockJson, target.id);
        vm.emitWorkspaceUpdate();
        vm.emitTargetsUpdate();
        workspace.updateToolbox(redux.state.scratchGui.toolbox.toolboxXML);
        workspace.toolboxRefreshEnabled_ = true;
        remove();
      } catch (error) {
        console.log("Error applying blocks:", error);
        alert("Apply failed: " + error.message);
      }
    });
  });

  function getVariablesOfTarget(target, type = "variable") {
    type = type === "list" ? "list" : "";
    return Array.from(
      new Set([
        ...Object.values(target.variables).filter((v) => v.type === type),
        ...Object.values(vm.runtime.getTargetForStage().variables).filter((v) => v.type === type),
      ])
    );
  }

  addon.self.addEventListener("disabled", () => {
    devider.hidden = true;
    menuItem.style.display = "none";
  });
  addon.self.addEventListener("reenabled", () => {
    devider.hidden = false;
    menuItem.style.display = "flex";
  });
}
