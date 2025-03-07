import { enableContextMenuSeparators, addSeparator } from "../../libraries/common/cs/blockly-context-menu.js";

export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  const getTargetName = (target) => {
    if (target.isStage) {
      // Stage always has an internal name of "Stage", but we want a translatable name
      return ScratchBlocks.ScratchMsgs.translate("SENSING_OF_STAGE", "Stage");
    }
    return target.getName();
  };

  const getTargetsThatUseVariable = (id) =>
    vm.runtime.targets
      .filter((target) => target.isOriginal)
      .filter((target) =>
        Object.values(target.blocks._blocks).find(
          (block) =>
            (block.fields.LIST && block.fields.LIST.id === id) ||
            (block.fields.VARIABLE && block.fields.VARIABLE.id === id)
        )
      );

  // https://github.com/scratchfoundation/scratch-vm/blob/7c6f1e44fb0a9b0d0279225cd4c62fbe59b6af54/src/engine/blocks.js#L388-L394
  const getTargetsWithLocalVariableNamed = (name, type) =>
    vm.runtime.targets.filter((target) => target.isOriginal && target.lookupVariableByNameAndType(name, type, true));

  const getVmVariable = (id) => vm.editingTarget.lookupVariableById(id);
  const isStageSelected = () => vm.editingTarget.isStage;

  const createVariable = (workspace, ...args) => {
    if (ScratchBlocks.registry) {
      // new Blockly
      // https://github.com/scratchfoundation/scratch-blocks/blob/91c8b63/src/variables.ts#L126-L137
      const VariableModel = ScratchBlocks.registry.getClass(
        ScratchBlocks.registry.Type.VARIABLE_MODEL,
        ScratchBlocks.registry.DEFAULT
      );
      const variable = new VariableModel(workspace, ...args);
      workspace.getVariableMap().addVariable(variable);
      ScratchBlocks.Events.fire(new (ScratchBlocks.Events.get(ScratchBlocks.Events.VAR_CREATE))(variable));
    } else {
      workspace.createVariable(...args);
    }
  };

  const deleteVariableWithoutDeletingBlocks = (workspace, variable) => {
    // variable can be an ID or an actual Blockly variable object
    if (typeof variable === "string") {
      variable = workspace.getVariableMap().getVariableById(variable);
    }
    if (ScratchBlocks.registry) {
      // new Blockly: can't use deleteVariable() because it also deletes references
      // https://github.com/google/blockly/blob/fa4fce5/core/variable_map.ts#L288-L294
      const variableMap = workspace.getVariableMap().variableMap;
      const variablesOfType = variableMap.get(variable.getType());
      if (variablesOfType && variablesOfType.has(variable.getId())) {
        variablesOfType.delete(variable.getId());
        ScratchBlocks.Events.fire(new (ScratchBlocks.Events.get(ScratchBlocks.Events.VAR_DELETE))(variable));
        if (variablesOfType.size === 0) {
          variableMap.delete(variable.getType());
        }
      }
    } else {
      workspace.getVariableMap().deleteVariable(variable);
    }
  };

  const syncBlockVariableNameWithActualVariableName = (workspace, id) => {
    const variable = workspace.getVariableMap().getVariableById(id);
    for (const block of workspace.getAllBlocks()) {
      block.updateVarName(variable);
    }
  };

  let _undoRedoPreserveStateCallback = null;
  const finishUndoRedoState = () => {
    if (_undoRedoPreserveStateCallback) {
      _undoRedoPreserveStateCallback();
      _undoRedoPreserveStateCallback = null;
    }
  };

  // https://github.com/scratchfoundation/scratch-blocks/blob/0d6012df1e18e66d82c1247f1f6d772a719982a7/core/variable_events.js#L194
  const customUndoVarDelete = function (forward) {
    const workspace = this.getEventWorkspace_();
    if (forward) {
      _undoRedoPreserveStateCallback = beginPreservingState(workspace, this.varId);
      deleteVariableWithoutDeletingBlocks(workspace, this.varId);
    } else {
      createVariable(workspace, this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
      finishUndoRedoState();
    }
  };

  // https://github.com/scratchfoundation/scratch-blocks/blob/0d6012df1e18e66d82c1247f1f6d772a719982a7/core/variable_events.js#L131
  const customUndoVarCreate = function (forward) {
    const workspace = this.getEventWorkspace_();
    if (forward) {
      createVariable(workspace, this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
      finishUndoRedoState();
    } else {
      _undoRedoPreserveStateCallback = beginPreservingState(workspace, this.varId);
      deleteVariableWithoutDeletingBlocks(workspace, this.varId);
    }
  };

  const flushBlocklyEventQueue = () => {
    if (ScratchBlocks.registry) {
      // new Blockly: we can't call fireNow() because it isn't exported,
      // but we can wait until the events have been fired
      // see https://github.com/google/blockly/blob/fa4fce5/core/events/utils.ts#L113-L115
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 0);
        });
      });
    } else {
      ScratchBlocks.Events.fireNow_();
    }
  };

  const beginPreservingState = (workspace, id) => {
    // oldMonitorState is an instance of https://github.com/scratchfoundation/scratch-vm/blob/develop/src/engine/monitor-record.js or undefined
    const oldMonitorState = vm.runtime._monitorState.get(id);
    const oldVmVariable = getVmVariable(id);
    return async () => {
      await flushBlocklyEventQueue();

      const newVmVariable = getVmVariable(id);
      if (newVmVariable) {
        newVmVariable.value = oldVmVariable.value;
      }

      // Update the variable monitor (state is maintained separately)
      if (oldMonitorState) {
        if (oldMonitorState.visible) {
          vm.runtime.monitorBlocks.changeBlock({
            id,
            element: "checkbox",
            value: true,
          });
        }
        const isLocal = !vm.runtime.getTargetForStage().variables[id];
        let newMonitorState = oldMonitorState;
        if (isLocal) {
          const target = vm.editingTarget;
          newMonitorState = newMonitorState.set("targetId", target.id);
          newMonitorState = newMonitorState.set("spriteName", target.getName());
        } else {
          newMonitorState = newMonitorState.set("targetId", null);
          newMonitorState = newMonitorState.set("spriteName", null);
        }
        if (newVmVariable.name !== oldVmVariable.name) {
          const monitorBlocks = vm.runtime.monitorBlocks;
          const block = monitorBlocks.getBlock(id);
          if (block) {
            newMonitorState = newMonitorState.set("params", monitorBlocks._getBlockParams(block));
          }
        }
        vm.runtime.requestAddMonitor(newMonitorState);
      }

      if (newVmVariable.name !== oldVmVariable.name) {
        syncBlockVariableNameWithActualVariableName(workspace, id);
      }
    };
  };

  const convertVariable = async (oldBlocklyVariable, newLocal, newCloud) => {
    const CLOUD_PREFIX = "☁ ";

    const name = oldBlocklyVariable.name;
    const id = oldBlocklyVariable.getId();
    const type = oldBlocklyVariable.type;
    const isLocal = oldBlocklyVariable.isLocal;
    const isCloud = oldBlocklyVariable.isCloud;
    if (isLocal === newLocal && isCloud === newCloud) {
      return;
    }

    // Cloud variables must always be global
    if (newCloud && newLocal) {
      alert(msg("cant-convert-cloud"));
      return;
    }

    const editingTarget = vm.editingTarget;
    if (isLocal !== newLocal) {
      if (newLocal) {
        // Stage cannot have local variables
        if (isStageSelected()) {
          alert(msg("cant-convert-stage"));
          return;
        }
        // Variables used by unfocused sprites cannot be made local
        // That includes cases where the variable is used by multiple sprites and where it's only used by an unfocused sprite
        const targets = getTargetsThatUseVariable(id);
        if (!targets.every((i) => i === editingTarget)) {
          if (targets.length > 1) {
            alert(
              msg("cant-convert-to-local", {
                sprites: targets.map(getTargetName).join(", "),
              })
            );
          } else {
            alert(
              msg("cant-convert-used-elsewhere", {
                sprite: getTargetName(targets[0]),
              })
            );
          }
          return;
        }
      } else {
        // Global variables must not conflict with any local variables
        const targets = getTargetsWithLocalVariableNamed(name, type).filter((target) => target !== editingTarget);
        if (targets.length > 0) {
          alert(
            msg("cant-convert-conflict", {
              sprites: targets.map(getTargetName).join(", "),
            })
          );
          return;
        }
      }
    }

    let newName = name;
    if (isCloud !== newCloud) {
      if (newCloud) {
        newName = CLOUD_PREFIX + name;
      } else if (name.startsWith(CLOUD_PREFIX)) {
        newName = name.replace(CLOUD_PREFIX, "");
      }
    }

    const workspace = oldBlocklyVariable.workspace;
    const finishPreservingState = beginPreservingState(workspace, id);

    ScratchBlocks.Events.setGroup(true);
    try {
      deleteVariableWithoutDeletingBlocks(workspace, oldBlocklyVariable);
      createVariable(workspace, newName, type, id, newLocal, newCloud);
    } finally {
      ScratchBlocks.Events.setGroup(false);
    }

    // 2 items will be added to the queue: a variable create and delete
    // We override their undo handlers to make undo/redo work properly
    await flushBlocklyEventQueue();
    const stack = workspace.undoStack_;
    const createEvent = stack[stack.length - 1];
    const deleteEvent = stack[stack.length - 2];
    if (
      createEvent instanceof ScratchBlocks.Events.VarCreate &&
      deleteEvent instanceof ScratchBlocks.Events.VarDelete
    ) {
      createEvent.run = customUndoVarCreate;
      deleteEvent.run = customUndoVarDelete;
    }

    finishPreservingState();
  };

  const canUserUseCloudVariables = () => {
    const blocksWrapper = document.querySelector('[class^="gui_blocks-wrapper_"]');
    let internalNode = blocksWrapper[addon.tab.traps.getInternalKey(blocksWrapper)];
    while (true) {
      if (!internalNode) {
        return false;
      }
      const canUseCloud = internalNode.stateNode?.props?.canUseCloud;
      if (typeof canUseCloud === "boolean") {
        return canUseCloud;
      }
      internalNode = internalNode.child;
    }
  };

  const addMoreOptionsToPrompt = async (variable) => {
    if (addon.self.disabled) {
      return;
    }

    const promptBody = await addon.tab.waitForElement('[class^="prompt_body_"]');

    const headerTitle = promptBody.parentElement.querySelector('[class^="modal_header-item_"]');
    if (headerTitle) {
      if (variable.type === "") {
        headerTitle.textContent = msg("edit-variable-header");
      } else {
        headerTitle.textContent = msg("edit-list-header");
      }
    }

    const root = document.createElement("div");
    addon.tab.displayNoneWhileDisabled(root);

    const createLabeledInput = (text, value) => {
      const outer = document.createElement("label");
      const input = document.createElement("input");
      if (value === "checkbox") {
        input.type = "checkbox";
      } else {
        input.name = "variableScopeOption";
        input.type = "radio";
        input.value = value;
      }
      outer.appendChild(input);
      const label = document.createElement("span");
      label.textContent = text;
      outer.appendChild(label);
      return {
        outer,
        label,
        input,
      };
    };
    const promptDisabledClass = addon.tab.scratchClass("prompt_disabled-label");

    const noLocalsInStageSection = document.createElement("div");
    noLocalsInStageSection.className = addon.tab.scratchClass("prompt_info-message", "prompt_cloud-option", {
      others: "sa-swap-local-global-stage",
    });
    noLocalsInStageSection.appendChild(
      Object.assign(document.createElement("span"), {
        textContent: addon.tab.scratchMessage("gui.gui.variablePromptAllSpritesMessage"),
      })
    );

    const scopeSection = document.createElement("div");
    scopeSection.className = addon.tab.scratchClass("prompt_options-row", "prompt_cloud-option");
    const forAllSprites = createLabeledInput(
      addon.tab.scratchMessage("gui.gui.variableScopeOptionAllSprites"),
      "global"
    );
    const forThisSpriteOnly = createLabeledInput(
      addon.tab.scratchMessage("gui.gui.variableScopeOptionSpriteOnly"),
      "local"
    );
    forAllSprites.input.checked = !variable.isLocal;
    forThisSpriteOnly.input.checked = variable.isLocal;
    scopeSection.appendChild(forAllSprites.outer);
    scopeSection.appendChild(forThisSpriteOnly.outer);

    const cloudSection = document.createElement("div");
    cloudSection.className = addon.tab.scratchClass("prompt_cloud-option");
    const cloudCheckbox = createLabeledInput(addon.tab.scratchMessage("gui.gui.cloudVariableOption"), "checkbox");
    cloudCheckbox.input.checked = variable.isCloud;
    if (!vm.runtime.canAddCloudVariable() && !variable.isCloud) {
      cloudCheckbox.input.disabled = true;
      cloudSection.classList.add(promptDisabledClass);
    }
    cloudSection.appendChild(cloudCheckbox.outer);
    const updateDisabledInputs = () => {
      const thisSpriteOnlyDisabled = cloudCheckbox.input.checked;
      forThisSpriteOnly.input.disabled = thisSpriteOnlyDisabled;
      forThisSpriteOnly.label.classList.toggle(promptDisabledClass, thisSpriteOnlyDisabled);
      if (thisSpriteOnlyDisabled) {
        forAllSprites.input.click();
      }
    };
    cloudCheckbox.input.addEventListener("change", updateDisabledInputs);
    updateDisabledInputs();

    let isAnythingConfigurable = false;
    if (isStageSelected()) {
      root.appendChild(noLocalsInStageSection);
    } else {
      isAnythingConfigurable = true;
      root.appendChild(scopeSection);
    }
    if (variable.type === "" && canUserUseCloudVariables()) {
      isAnythingConfigurable = true;
      root.appendChild(cloudSection);
    }
    if (isAnythingConfigurable) {
      root.prepend(
        Object.assign(document.createElement("div"), {
          textContent: msg("edit"),
          className: "sa-swap-local-global-hint",
        })
      );
    }
    promptBody.insertBefore(root, promptBody.lastChild);

    return {
      isLocal: () => forThisSpriteOnly.input.checked,
      isCloud: () => cloudCheckbox.input.checked,
    };
  };

  const blocksWrapper = document.querySelector("[class*='gui_blocks-wrapper_']");
  let reactInternalInstance = blocksWrapper[addon.tab.traps.getInternalKey(blocksWrapper)];
  while (!reactInternalInstance.stateNode?.ScratchBlocks) {
    reactInternalInstance = reactInternalInstance.child;
  }
  const blocksInstance = reactInternalInstance.stateNode;
  const Blocks = blocksInstance.constructor;
  const originalHandlePromptStart = Blocks.prototype.handlePromptStart;
  const newHandlePromptStart = function (message, defaultValue, callback, optTitle, optVarType) {
    const isRename = !!defaultValue;
    if (!addon.self.disabled && isRename) {
      const workspace = addon.tab.traps.getWorkspace();
      const variable = workspace.getVariableMap().getVariable(defaultValue, optVarType);
      let prompt;
      addMoreOptionsToPrompt(variable).then((result) => (prompt = result));
      const originalCallback = callback;
      callback = (...args) => {
        originalCallback(...args);
        if (prompt) {
          convertVariable(variable, prompt.isLocal(), prompt.isCloud());
        }
      };
    }
    originalHandlePromptStart.call(this, message, defaultValue, callback, optTitle, optVarType);
  };
  Blocks.prototype.handlePromptStart = newHandlePromptStart;
  if (ScratchBlocks.registry) {
    // new Blockly
    ScratchBlocks.ScratchVariables.setPromptHandler(newHandlePromptStart.bind(blocksInstance));
  } else {
    ScratchBlocks.prompt = newHandlePromptStart.bind(blocksInstance);
  }

  enableContextMenuSeparators(addon.tab);
  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (!addon.self.disabled && block.type.startsWith("data_")) {
        const variable = block.workspace.getVariableById(block.getVars()[0]);
        if (variable) {
          if (items.length > 0) {
            if (items[0].text === ScratchBlocks.ScratchMsgs.translate("RENAME_VARIABLE")) {
              items[0].text = msg("edit-variable-option");
            } else if (items[0].text === ScratchBlocks.ScratchMsgs.translate("RENAME_LIST")) {
              items[0].text = msg("edit-list-option");
            }
          }
          items.push(
            addSeparator({
              enabled: true,
              separator: true,
              text: msg(`to-${variable.isLocal ? "global" : "local"}`),
              callback: () => convertVariable(variable, !variable.isLocal, variable.isCloud),
            })
          );
        }
      }
      return items;
    },
    {
      flyout: true,
      blocks: true,
    }
  );
}
