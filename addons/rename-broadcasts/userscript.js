export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;
  const Blockly = await addon.tab.traps.getBlockly();

  // editor-searchable-dropdowns relies on this value
  const RENAME_BROADCAST_MESSAGE_ID = "RENAME_BROADCAST_MESSAGE_ID";

  const BROADCAST_MESSAGE_TYPE = Blockly.BROADCAST_MESSAGE_VARIABLE_TYPE;

  let FieldVariable;
  if (Blockly.registry) {
    // new Blockly
    FieldVariable = Blockly.registry.getClass(Blockly.registry.Type.FIELD, "field_variable");
  } else {
    FieldVariable = Blockly.FieldVariable;
  }
  const _dropdownCreate = FieldVariable.dropdownCreate;
  FieldVariable.dropdownCreate = function () {
    const options = _dropdownCreate.call(this);
    const workspace = this.sourceBlock_.workspace;
    let variableTypes;
    if (Blockly.registry)
      variableTypes = workspace.getVariableMap().getTypes(); // new Blockly
    else variableTypes = workspace.getVariableTypes();
    if (
      !addon.self.disabled &&
      (this.defaultType_ ?? this.getDefaultType()) === BROADCAST_MESSAGE_TYPE &&
      // Disable when workspace has no actual broadcast to rename
      variableTypes.includes(BROADCAST_MESSAGE_TYPE)
    ) {
      options.push([msg("RENAME_BROADCAST"), RENAME_BROADCAST_MESSAGE_ID]);
    }
    return options;
  };

  let onItemSelectedMethodName;
  if (Blockly.registry)
    onItemSelectedMethodName = "onItemSelected_"; // new Blockly
  else onItemSelectedMethodName = "onItemSelected";
  const _onItemSelected = FieldVariable.prototype[onItemSelectedMethodName];
  FieldVariable.prototype[onItemSelectedMethodName] = function (menu, menuItem) {
    const workspace = this.sourceBlock_.workspace;
    if (this.sourceBlock_ && workspace) {
      if (menuItem.getValue() === RENAME_BROADCAST_MESSAGE_ID) {
        promptRenameBroadcast(workspace, this.variable ?? this.variable_);
        return;
      }
    }
    return _onItemSelected.call(this, menu, menuItem);
  };

  // Custom event for undo/redo
  class RenameBroadcastEvent extends Blockly.Events.Abstract {
    constructor(workspace, callback) {
      super();
      this.type = "sa_broadcast_rename";
      this.workspaceId = workspace.id;
      this.callback = callback;
    }

    run(isRedo) {
      this.callback(isRedo);
    }
  }

  const resetVMCaches = () => {
    const blockContainers = new Set(vm.runtime.targets.map((i) => i.blocks));
    for (const blocks of blockContainers) {
      blocks.resetCache();
    }
  };

  const addUndoRedoHook = (workspace, callback) => {
    // On new Blockly, we can't access the event queue to modify the existing event.
    // Instead, we fire a new event, which works on both old and new Blockly.
    // The custom event should be in a group together with the actual Blockly events.
    Blockly.Events.fire(new RenameBroadcastEvent(workspace, callback));
  };

  const renameBroadcastInVM = (id, newName) => {
    // Editor's rename won't completely rename the variable.
    const vmVariable = vm.runtime.getTargetForStage().variables[id];
    vmVariable.name = newName;
    vmVariable.value = newName;

    // Update all references to the broadcast. Broadcasts won't work if these
    // don't match.
    const blockContainers = new Set(vm.runtime.targets.map((i) => i.blocks));
    for (const blockContainer of blockContainers) {
      for (const block of Object.values(blockContainer._blocks)) {
        const broadcastOption = block.fields && block.fields.BROADCAST_OPTION;
        if (broadcastOption && broadcastOption.id === id) {
          broadcastOption.value = newName;
        }
      }
    }

    resetVMCaches();
  };

  const renameBroadcast = (workspace, id, oldName, newName) => {
    Blockly.Events.setGroup(true);

    // Rename in editor. Undo/redo will work automatically.
    // Old Blockly's renameVariableById() creates a new group, so we need
    // to replace setGroup() with a no-op to prevent that.
    const _setGroup = Blockly.Events.setGroup;
    if (!Blockly.registry) Blockly.Events.setGroup = () => {};
    workspace.getVariableMap().renameVariableById(id, newName);
    if (!Blockly.registry) Blockly.Events.setGroup = _setGroup;

    // Rename in VM. Need to manually implement undo/redo.
    renameBroadcastInVM(id, newName);

    addUndoRedoHook(workspace, (isRedo) => {
      if (isRedo) {
        renameBroadcastInVM(id, newName);
      } else {
        renameBroadcastInVM(id, oldName);
      }
    });

    Blockly.Events.setGroup(false);
  };

  const mergeBroadcast = (workspace, oldId, oldName, newName) => {
    const newVmVariable = vm.runtime.getTargetForStage().lookupBroadcastByInputValue(newName);
    const newId = newVmVariable.id;

    // Merge in editor. Undo/redo will work automatically for this.
    // Use group so that everything here is undone/redone at the same time.
    Blockly.Events.setGroup(true);
    for (const block of workspace.getAllBlocks()) {
      for (const input of block.inputList) {
        for (const field of input.fieldRow) {
          if (field.name === "BROADCAST_OPTION" && field.getValue() === oldId) {
            field.setValue(newId);
          }
        }
      }
    }
    // Remove the broadcast from the editor so it doesn't appear in dropdowns.
    // Undo/redo will work automatically for this.
    workspace.getVariableMap().deleteVariableById(oldId);

    // Merge in VM to update sprites that aren't open. Need to manually implement undo/redo.
    // To figure out how to undo this operation, we first figure out which blocks we're
    // going to touch and keep hold of that list.
    const vmBlocksToUpdate = [];
    const blockContainers = new Set(vm.runtime.targets.map((i) => i.blocks));
    for (const blockContainer of blockContainers) {
      for (const block of Object.values(blockContainer._blocks)) {
        const broadcastOption = block.fields && block.fields.BROADCAST_OPTION;
        if (broadcastOption && broadcastOption.id === oldId) {
          vmBlocksToUpdate.push(block);
        }
      }
    }
    const applyVmEdits = (isRedo) => {
      const idToReplaceWith = isRedo ? newId : oldId;
      const nameToReplaceWith = isRedo ? newName : oldName;
      for (const block of vmBlocksToUpdate) {
        const broadcastOption = block.fields.BROADCAST_OPTION;
        broadcastOption.id = idToReplaceWith;
        broadcastOption.value = nameToReplaceWith;
      }
      resetVMCaches();
    };
    applyVmEdits(true);

    addUndoRedoHook(workspace, (isRedo) => {
      applyVmEdits(isRedo);
    });
    Blockly.Events.setGroup(false);
  };

  const promptRenameBroadcast = (workspace, variable) => {
    const modalTitle = msg("RENAME_BROADCAST_MODAL_TITLE");
    const oldName = variable.name;
    const id = variable.getId();
    const promptText = msg("RENAME_BROADCAST_TITLE", { name: oldName });
    const promptDefaultText = oldName;

    const blocksWrapper = document.querySelector("[class*='gui_blocks-wrapper_']");
    let reactInternalInstance = blocksWrapper[addon.tab.traps.getInternalKey(blocksWrapper)];
    while (!reactInternalInstance.stateNode?.ScratchBlocks) {
      reactInternalInstance = reactInternalInstance.child;
    }
    const blocksComponent = reactInternalInstance.stateNode;

    blocksComponent.handlePromptStart(
      promptText,
      promptDefaultText,
      function (newName) {
        newName = newName.trim();
        const nameIsEmpty = !newName;
        if (nameIsEmpty) {
          return;
        }

        const variableAlreadyExists = !!workspace.getVariable(newName, BROADCAST_MESSAGE_TYPE);
        if (variableAlreadyExists) {
          mergeBroadcast(workspace, id, oldName, newName);
        } else {
          renameBroadcast(workspace, id, oldName, newName);
        }
      },
      modalTitle,
      BROADCAST_MESSAGE_TYPE
    );
  };

  const updateExistingMenuGenerators = () => {
    const workspace = Blockly.getMainWorkspace();
    const flyout = workspace && workspace.getFlyout();
    if (workspace && flyout) {
      const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
      for (const block of allBlocks) {
        for (const input of block.inputList) {
          for (const field of input.fieldRow) {
            if (field instanceof FieldVariable) {
              field.menuGenerator_ = FieldVariable.dropdownCreate;
            }
          }
        }
      }
    }
  };

  updateExistingMenuGenerators();
}
