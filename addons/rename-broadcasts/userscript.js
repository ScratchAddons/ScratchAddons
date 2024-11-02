export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;
  const Blockly = await addon.tab.traps.getBlockly();

  // editor-searchable-dropdowns relies on this value
  const RENAME_BROADCAST_MESSAGE_ID = "RENAME_BROADCAST_MESSAGE_ID";

  const BROADCAST_MESSAGE_TYPE = Blockly.BROADCAST_MESSAGE_VARIABLE_TYPE;

  const _dropdownCreate = Blockly.FieldVariable.dropdownCreate;
  Blockly.FieldVariable.dropdownCreate = function () {
    const options = _dropdownCreate.call(this);
    if (
      !addon.self.disabled &&
      this.defaultType_ === BROADCAST_MESSAGE_TYPE &&
      // Disable when workspace has no actual broadcast to rename
      this.sourceBlock_.workspace.getVariableTypes().includes("broadcast_msg")
    ) {
      options.push([msg("RENAME_BROADCAST"), RENAME_BROADCAST_MESSAGE_ID]);
    }
    return options;
  };

  const _onItemSelected = Blockly.FieldVariable.prototype.onItemSelected;
  Blockly.FieldVariable.prototype.onItemSelected = function (menu, menuItem) {
    const workspace = this.sourceBlock_.workspace;
    if (this.sourceBlock_ && workspace) {
      if (menuItem.getValue() === RENAME_BROADCAST_MESSAGE_ID) {
        promptRenameBroadcast(workspace, this.variable_);
        return;
      }
    }
    return _onItemSelected.call(this, menu, menuItem);
  };

  const resetVMCaches = () => {
    const blockContainers = new Set(vm.runtime.targets.map((i) => i.blocks));
    for (const blocks of blockContainers) {
      blocks.resetCache();
    }
  };

  const addUndoRedoHook = (callback) => {
    const eventQueue = Blockly.Events.FIRE_QUEUE_;
    // After a rename is emitted, some unrelated garbage events also get emitted
    // So we should trap the first event
    const undoItem = eventQueue[0];
    const originalRun = undoItem.run;
    undoItem.run = function (isRedo) {
      originalRun.call(this, isRedo);
      callback(isRedo);
    };
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
    // Rename in editor. Undo/redo will work automatically.
    workspace.renameVariableById(id, newName);

    // Rename in VM. Need to manually implement undo/redo.
    renameBroadcastInVM(id, newName);

    addUndoRedoHook((isRedo) => {
      if (isRedo) {
        renameBroadcastInVM(id, newName);
      } else {
        renameBroadcastInVM(id, oldName);
      }
    });
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
    workspace.deleteVariableById(oldId);
    Blockly.Events.setGroup(false);

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

    // Earlier editor updates are guaranteed to generate at least 1 event that we can hook as the
    // broadcast block must exist in the editor for the user to rename it.
    addUndoRedoHook((isRedo) => {
      applyVmEdits(isRedo);
    });
  };

  const promptRenameBroadcast = (workspace, variable) => {
    const modalTitle = msg("RENAME_BROADCAST_MODAL_TITLE");
    const oldName = variable.name;
    const id = variable.getId();
    const promptText = msg("RENAME_BROADCAST_TITLE", { name: oldName });
    const promptDefaultText = oldName;

    Blockly.prompt(
      promptText,
      promptDefaultText,
      function (newName) {
        newName = Blockly.Variables.trimName_(newName);
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
            if (field instanceof Blockly.FieldVariable) {
              field.menuGenerator_ = Blockly.FieldVariable.dropdownCreate;
            }
          }
        }
      }
    }
  };

  updateExistingMenuGenerators();
}
