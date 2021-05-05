export default async function ({ addon, console, safeMsg: m }) {
  let cache = [];
  /*
  For some reason the collapse state of the blocks is not stored . . . this means that when you
  switch to different sprites the blocks expand themselves. Fix by storing collapsed block id's.
  */

  let eventGroup = {
    //Stores the last event group for detecting workspace reload
    id: null,
    eventList: [],
  };
  
  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (block.startHat_ || block.type == "procedures_call" || block.outputShape_) return; //Collapsing for these are broke...
      items.push({
        enabled: true,
        seperator: true,
        text: block.collapsed_ ? m("expand") : m("collapse"),
        callback: () => {
          block.setCollapsed(!block.collapsed_);
          if (block.collapsed_) cache.push(block.id);
          else {
            if (cache.includes(block.id)) {
              //Just to be sure...
              cache.splice(cache.indexOf(block.id), 1);
            }
          }
        }
      });
    }, {
      workspace: false,
      blocks: true,
      flyout: false
    }
  );

  function workspaceChange(e) {
    if (eventGroup.id !== e.group) {
      eventGroup.eventList.length = 0;
      eventGroup.id = e.group;
    }

    eventGroup.eventList.push(e);

    if (!eventGroup.eventList.every((ev) => ev.recordUndo === false) || eventGroup.eventList.length === 0) return;

    let collapsedBlocks = Blockly.getMainWorkspace()
      .getAllBlocks()
      .filter((block) => cache.includes(block.id));

    for (let block of collapsedBlocks) {
      block.setCollapsed(true);
    }
  }

  await addon.tab.traps.getBlockly();

  Blockly.getMainWorkspace().addChangeListener(workspaceChange);
}
