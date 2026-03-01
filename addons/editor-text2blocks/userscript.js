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
  const smsg = addon.tab.scratchMessage;

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

    // 初始化TabManager
    const tabManager = new TabManager(addon, content, "sa-text2blocks-tabs-container");

    // 创建Code tab
    const textarea = document.createElement("textarea");
    textarea.className = addon.tab.scratchClass("prompt_variable-name-text-input", {
      others: "sa-text2blocks-textarea",
    });
    tabManager.createTab(msg("code"), "code-tab", textarea);

    // 创建Variables tab
    const variablesPanel = document.createElement("div");
    variablesPanel.className = addon.tab.scratchClass("sa-text2blocks-variables-panel", {
      others: "sa-text2blocks-variables-content",
    });
    tabManager.createTab(msg("variables"), "variables-tab", variablesPanel);

    // 创建Issues tab
    const issuesPanel = document.createElement("div");
    issuesPanel.className = addon.tab.scratchClass("sa-text2blocks-issues-panel", {
      others: "sa-text2blocks-issues-content",
    });
    tabManager.createTab(msg("issues"), "issues-tab", issuesPanel);

    // 切换到code-tab
    tabManager.switchTab("code-tab");

    // 用于记录变量映射选择
    const variableMappings = new Map(); // key: variableName, value: { type: 'new' | 'existing', data: {...} }

    // 创建按钮行
    const buttonRow = document.createElement("div");
    buttonRow.className = addon.tab.scratchClass("prompt_button-row");

    // 解析按钮
    const parseButton = document.createElement("button");
    parseButton.textContent = msg("parse-button");
    parseButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-text2blocks-button" });

    // 应用按钮
    const applyButton = document.createElement("button");
    applyButton.textContent = msg("apply-button");
    applyButton.className = addon.tab.scratchClass("prompt_ok-button", { others: "sa-text2blocks-button" });
    applyButton.disabled = true; // 初始禁用，直到解析成功

    buttonRow.append(parseButton, applyButton);
    content.append(buttonRow);

    // 监听textarea文本变化
    textarea.addEventListener("input", () => {
      // 文本变化时禁用应用按钮
      applyButton.disabled = true;
      // 允许重新解析
      parseButton.disabled = false;
    });

    const target = vm.runtime.getEditingTarget();
    const text2blocks = new Text2Blocks(target, vm.runtime, Blockly.utils.genUid, workspace);

    // 更新Variables Panel的函数
    function updateVariablesPanel() {
      // 清空现有内容
      variablesPanel.innerHTML = "";

      if (text2blocks.variableNames.size === 0 && text2blocks.listNames.size === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = msg("no-variables-lists");
        emptyMsg.style.color = "var(--editorDarkMode-input-transparentText, rgba(255, 255, 255, 0.4))";
        variablesPanel.appendChild(emptyMsg);
        return;
      }

      // 显示Variables
      if (text2blocks.variableNames.size > 0) {
        const varTitle = document.createElement("h3");
        varTitle.textContent = msg("variables");
        varTitle.style.marginBottom = "10px";
        varTitle.style.color = "var(--editorDarkMode-page-text, #ffffff)";
        variablesPanel.appendChild(varTitle);

        const varTable = createVariablesTable(Array.from(text2blocks.variableNames), "variable");
        variablesPanel.appendChild(varTable);
      }

      // 显示Lists
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

    // 更新Issues Panel的函数
    function updateIssuesPanel() {
      // 清空现有内容
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

      // 错误消息生成函数
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

      // 显示Errors
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

      // 显示Warnings
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

    // 创建表格的函数
    function createVariablesTable(names, type) {
      const table = document.createElement("table");
      table.className = "sa-text2blocks-table";

      // 创建表头
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

      // 创建表体
      const tbody = document.createElement("tbody");
      for (const name of names) {
        const row = createVariableRow(name, type);
        tbody.appendChild(row);
      }
      table.appendChild(tbody);

      return table;
    }

    // 创建表格行的函数
    function createVariableRow(name, type) {
      const row = document.createElement("tr");

      // 第一列：变量/列表名称
      const nameCell = document.createElement("td");
      nameCell.className = "sa-text2blocks-table-name-col";
      const nameLabel = document.createElement("span");
      nameLabel.textContent = name;
      nameCell.appendChild(nameLabel);
      row.appendChild(nameCell);

      // 第二列：操作选择
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

      actionSelect.value = "new"; // 默认选择"Create new"
      actionCell.appendChild(actionSelect);
      row.appendChild(actionCell);

      // 第三列：配置
      const configCell = document.createElement("td");
      configCell.className = "sa-text2blocks-table-config-col";
      const configContainer = document.createElement("div");
      configContainer.className = "sa-text2blocks-config-container";

      // 初始显示创建新变量的配置
      const initialConfigContent = createNewVarConfig(name, type);
      configContainer.appendChild(initialConfigContent);
      configCell.appendChild(configContainer);
      row.appendChild(configCell);

      // 操作下拉菜单变化事件
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

    // 创建新变量配置的UI
    function createNewVarConfig(name, type) {
      const container = document.createElement("div");
      container.className = "sa-text2blocks-config-container";

      // 输入框：自定义新名称
      const input = document.createElement("input");
      input.type = "text";
      input.className = "sa-text2blocks-input";
      input.placeholder = msg("new-name-placeholder", { name });
      input.value = "";

      // 作用域选择
      const scopeSelect = document.createElement("select");
      scopeSelect.className = "sa-text2blocks-select";

      const optionSprite = document.createElement("option");
      optionSprite.value = "sprite";
      optionSprite.textContent = smsg("gui.gui.variableScopeOptionSpriteOnly");
      scopeSelect.appendChild(optionSprite);

      const optionGlobal = document.createElement("option");
      optionGlobal.value = "global";
      optionGlobal.textContent = smsg("gui.gui.variableScopeOptionAllSprites");
      scopeSelect.appendChild(optionGlobal);

      scopeSelect.value = "sprite"; // 默认选择"For this sprite"

      // 监听变化
      function updateMapping() {
        const customName = input.value.trim() || name; // 留空则使用原名
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

      // 初始化映射
      updateMapping();

      container.appendChild(input);
      container.appendChild(scopeSelect);
      return container;
    }

    // 创建使用已有变量配置的UI
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
        option.dataset.variableId = varObj.id; // 存储变量ID
        existingSelect.appendChild(option);
      }

      // 初始化映射（使用第一个已有变量）
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

      // 初始化映射
      if (existingVariables.length > 0) {
        updateMapping();
      }

      container.appendChild(existingSelect);
      return container;
    }

    // 解析按钮事件
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

        // 如果有errors，禁用apply按钮；否则启用
        if (text2blocks.errors.length > 0) {
          applyButton.disabled = true;
        } else {
          applyButton.disabled = false;
        }

        // 自动切换到Issues tab如果有问题，否则切换到Variables tab如果有变量
        if (text2blocks.errors.length > 0 || text2blocks.warnings.length > 0) {
          tabManager.switchTab("issues-tab");
        } else if (text2blocks.variableNames.size > 0 || text2blocks.listNames.size > 0) {
          tabManager.switchTab("variables-tab");
        }
      } catch (error) {
        console.log("Error parsing text:", error);
        applyButton.disabled = true; // 禁用应用按钮
        alert("Parse failed: " + error.message);
      }
    });

    // 应用按钮事件
    applyButton.addEventListener("click", async () => {
      if (text2blocks.warnings.length > 0) {
        if (
          !(await addon.tab.confirm(msg("warnings-title"), msg("warnings-confirm-content"), { useEditorClasses: true }))
        ) {
          return;
        }
      }

      try {
        // 准备最终的变量映射表：原始名称 -> {name, id}
        const finalVariableMappings = new Map();
        const stage = vm.runtime.getTargetForStage();

        // 首先，为所有新建变量创建它们，获得ID后再记录映射
        for (const [originalName, mapping] of variableMappings) {
          if (mapping.type === "new") {
            const { name: newName, varType, scope } = mapping.data;
            const variableType = varType === "list" ? "list" : ""; // "" 为普通变量

            // 生成唯一的变量ID
            const variableId = Blockly.utils.genUid();

            let targetForVar;
            let isCloud = false;

            if (scope === "sprite") {
              // 角色变量：在当前sprite上创建
              targetForVar = target;
              isCloud = false;
            } else if (scope === "global") {
              // 全局变量：在stage上创建
              targetForVar = stage;
              isCloud = false;
            } else if (scope === "cloud") {
              // TODO: 云变量暂未实现
              console.warn(`[TODO] Cloud variable "${newName}" is not yet supported`);
              continue;
            }

            // 创建变量/列表
            targetForVar.createVariable(variableId, newName, variableType, isCloud);

            finalVariableMappings.set(originalName, {
              name: newName,
              id: variableId,
            });
          } else if (mapping.type === "existing") {
            // 直接记录已有变量的映射
            finalVariableMappings.set(originalName, {
              name: mapping.data.mappedTo,
              id: mapping.data.mappedToId,
            });
          }
        }

        // 应用变量映射，替换块中的变量引用
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
