export default async function({ addon }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const { vm } = addon.tab.traps;

  const oldTouchingMenuInit = ScratchBlocks.Blocks.event_touchingobjectmenu.init;
  ScratchBlocks.Blocks.event_touchingobjectmenu.init = function() {
    if (addon.self.disabled || !addon.settings.get('addSpritesToMenu')) return oldTouchingMenuInit.call(this);
    this.jsonInit({
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TOUCHINGOBJECTMENU',
          options: [
            [ScratchBlocks.Msg.SENSING_TOUCHINGOBJECT_POINTER, '_mouse_'],
            [ScratchBlocks.Msg.SENSING_TOUCHINGOBJECT_EDGE, '_edge_'],
            ...Object.values(vm.runtime.targets)
              .filter(target => target.isOriginal && !target.isStage && target !== vm.editingTarget)
              .map(target => [target.sprite.name, target.sprite.name])
          ]
        }
      ],
      extensions: ['colours_event', 'output_string']
    });
  };

  const oldShow = ScratchBlocks.Flyout.prototype.show;
  ScratchBlocks.Flyout.prototype.show = function(xmlList) {
    if (!addon.self.disabled) {
      function addAfter(type, xml) {
        const index = xmlList.findIndex(i => i.getAttribute?.('type') === type);
        if (index > -1) {
          xmlList.splice(index + 1, 0, ScratchBlocks.Xml.textToDom(xml));
        }
      }

      const whenTouchingObject = '<block type="event_whentouchingobject"><value name="TOUCHINGOBJECTMENU"><shadow type="event_touchingobjectmenu"/></value></block>';
      addAfter('event_whenthisspriteclicked', whenTouchingObject);
      addAfter('event_whenstageclicked', whenTouchingObject);

      addAfter('control_wait_until', '<block type="control_while"/>');
      addAfter('control_repeat_until', '<block type="control_for_each"><value name="VALUE"><shadow type="math_whole_number"><field name="NUM">10</field></shadow></value></block>');

      addAfter('control_delete_this_clone', '<block type="control_incr_counter"/>');
      addAfter('control_incr_counter', '<block type="control_clear_counter"/>');
      addAfter('control_clear_counter', '<block type="control_get_counter"/>');
      addAfter('control_delete_this_clone', '<sep gap="36"/>');

      addAfter('sensing_loudness', '<block type="sensing_loud"/>');
    }
    return oldShow.call(this, xmlList);
  };

  let addSpritesToMenu = false;
  function updateBlocks() {
    const needAddSpritesToMenu = !addon.self.disabled && addon.settings.get('addSpritesToMenu');
    if (needAddSpritesToMenu !== addSpritesToMenu) {
      if (vm.editingTarget) vm.emitWorkspaceUpdate();
      addSpritesToMenu = needAddSpritesToMenu;
    }
  }

  function updateWorkspace() {
    const workspace = addon.tab.traps.getWorkspace();
    if (!workspace) return;
    updateBlocks();
    workspace.getToolbox().refreshSelection();
  }

  updateWorkspace();
  addon.self.addEventListener('disabled', updateWorkspace);
  addon.self.addEventListener('reenabled', updateWorkspace);
  addon.settings.addEventListener('change', updateBlocks);
}
