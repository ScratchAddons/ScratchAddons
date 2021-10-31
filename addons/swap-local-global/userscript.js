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

    const oldVmVariable = getVmVariable(id);
    // oldMonitorState is an instance of https://github.com/LLK/scratch-vm/blob/develop/src/engine/monitor-record.js or undefined
    const oldMonitorState = vm.runtime._monitorState.get(id);
    const workspace = oldBlocklyVariable.workspace;
    ScratchBlocks.Events.setGroup(true);
    try {
      workspace.variableMap_.deleteVariable(oldBlocklyVariable);
      workspace.createVariable(name, type, id, newLocal, /* isCloud */ false);
    } finally {
      ScratchBlocks.Events.setGroup(false);
    }

    // The VM typically won't be notified of workspace updates until a setTimeout(fn, 0)
    // We force it to be notified immediately to make changes safe while the project is running
    ScratchBlocks.Events.fireNow_();
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
      let newMonitorState = oldMonitorState;
      if (newLocal) {
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

  addon.tab.createBlockContextMenu((items, block) => {
    if (!addon.self.disabled && block.getCategory() === "data" || block.getCategory() === "data-lists") {
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
