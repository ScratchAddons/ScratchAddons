export default async function ({ addon, msg, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  const getTargetName = (target) => {
    if (target.isStage) {
      // Stage always has an internal name of "Stage"
      return msg('stage');
    }
    return target.getName();
  };

  const getTargetsThatUseVariable = (id) => vm.runtime.targets
    .filter((target) => target.isOriginal)
    .filter((target) => Object.values(target.blocks._blocks).find((block) => (
      (block.fields.LIST && block.fields.LIST.id === id) ||
      (block.fields.VARIABLE && block.fields.VARIABLE.id === id)
    )));

  const getVmVariable = (id) => vm.editingTarget.variables[id] || vm.runtime.getTargetForStage().variables[id];
  const isStageSelected = () => vm.editingTarget.isStage;

  const deleteVariableWithoutDeletingBlocks = (workspace, variable) => {
    // variable can be an ID or an actual Blockly variable object
    if (typeof variable === 'string') {
      variable = workspace.getVariableById(variable);
    }
    workspace.variableMap_.deleteVariable(variable);
  };

  let _undoRedoPreserveStateCallback = null;
  const finishUndoRedoState = () => {
    if (_undoRedoPreserveStateCallback) {
      _undoRedoPreserveStateCallback();
      _undoRedoPreserveStateCallback = null;
    }
  };

  // https://github.com/LLK/scratch-blocks/blob/0d6012df1e18e66d82c1247f1f6d772a719982a7/core/variable_events.js#L194
  const customUndoVarDelete = function (forward) {
    const workspace = this.getEventWorkspace_();
    if (forward) {
      _undoRedoPreserveStateCallback = beginPreservingState(this.varId);
      deleteVariableWithoutDeletingBlocks(workspace, this.varId);
    } else {
      workspace.createVariable(this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
      finishUndoRedoState();
    }
  };

  // https://github.com/LLK/scratch-blocks/blob/0d6012df1e18e66d82c1247f1f6d772a719982a7/core/variable_events.js#L131
  const customUndoVarCreate = function (forward) {
    const workspace = this.getEventWorkspace_();
    if (forward) {
      workspace.createVariable(this.varName, this.varType, this.varId, this.isLocal, this.isCloud);
      finishUndoRedoState();
    } else {
      _undoRedoPreserveStateCallback = beginPreservingState(this.varId);
      deleteVariableWithoutDeletingBlocks(workspace, this.varId);
    }
  };

  const flushBlocklyEventQueue = () => ScratchBlocks.Events.fireNow_();

  const beginPreservingState = (id) => {
    // oldMonitorState is an instance of https://github.com/LLK/scratch-vm/blob/develop/src/engine/monitor-record.js or undefined
    const oldMonitorState = vm.runtime._monitorState.get(id);
    const oldVmVariable = getVmVariable(id);
    return () => {
      flushBlocklyEventQueue();

      const newVmVariable = getVmVariable(id);
      if (newVmVariable) {
        newVmVariable.value = oldVmVariable.value;
      }

      if (oldMonitorState) {
        if (oldMonitorState.visible) {
          vm.runtime.monitorBlocks.changeBlock({
            id,
            element: 'checkbox',
            value: true
          });
        }
        const isLocal = !vm.runtime.getTargetForStage().variables[id];
        let newMonitorState = oldMonitorState;
        if (isLocal) {
          const target = vm.editingTarget;
          newMonitorState = newMonitorState.set('targetId', target.id)
          newMonitorState = newMonitorState.set('spriteName', target.getName());
        } else {
          newMonitorState = newMonitorState.set('targetId', null);
          newMonitorState = newMonitorState.set('spriteName', null);
        }
        vm.runtime.requestAddMonitor(newMonitorState);
      }
    };
  };

  const convert = (oldBlocklyVariable) => {
    const name = oldBlocklyVariable.name;
    const id = oldBlocklyVariable.getId();
    const type = oldBlocklyVariable.type;
    const isCloud = oldBlocklyVariable.isCloud;

    // Cloud variables must always be global
    if (isCloud) {
      alert(msg('cant-convert-cloud'));
      return;
    }

    const newLocal = !oldBlocklyVariable.isLocal;
    if (newLocal) {
      // Stage cannot have local variables
      if (isStageSelected()) {
        alert(msg('cant-convert-stage'));
        return;
      }
      // Variables used by unfocused sprites cannot be made local
      // That includes cases where the variable is used by multiple sprites and where it's only used by an unfocused sprite
      const targets = getTargetsThatUseVariable(id);
      if (!targets.every((i) => i === vm.editingTarget)) {
        if (targets.length > 1) {
          alert(msg('cant-convert-to-local', {
            sprites: targets.map(getTargetName).join(', ')
          }))
        } else {
          alert(msg('cant-convert-used-elsewhere', {
            sprite: getTargetName(targets[0])
          }));
        }
        return;
      }
    }

    const finishPreservingState = beginPreservingState(id);

    const workspace = oldBlocklyVariable.workspace;
    ScratchBlocks.Events.setGroup(true);
    try {
      deleteVariableWithoutDeletingBlocks(workspace, oldBlocklyVariable);
      workspace.createVariable(name, type, id, newLocal, /* isCloud */ false);
    } finally {
      ScratchBlocks.Events.setGroup(false);
    }

    // 2 items will be added to the queue: a variable create and delete
    // override their undo handlers to make undo/redo work properly
    flushBlocklyEventQueue();
    const stack = workspace.undoStack_;
    const createEvent = stack[stack.length - 1];
    const deleteEvent = stack[stack.length - 2];
    if (
      (createEvent instanceof ScratchBlocks.Events.VarCreate) &&
      (deleteEvent instanceof ScratchBlocks.Events.VarDelete)
    ) {
      createEvent.run = customUndoVarCreate;
      deleteEvent.run = customUndoVarDelete;
    }

    finishPreservingState();
  };

  addon.tab.createBlockContextMenu((items, block) => {
    if (!addon.self.disabled && (block.getCategory() === "data" || block.getCategory() === "data-lists")) {
      const variable = block.workspace.getVariableById(block.getVars()[0]);
      if (variable) {
        items.push({
          enabled: true,
          separator: true,
          text: msg(`to-${variable.isLocal ? 'global' : 'local'}`),
          callback: () => convert(variable)
        });
      }
    }
    return items;
  }, {
    flyout: true,
    blocks: true
  });
}
