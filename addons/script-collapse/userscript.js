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

  function click(e) {
    if (e.button === 2) {
      let block = e.target.closest("[data-id]");
      let isBackground = !block && e.target.closest("svg.blocklySvg");
      if (block && !isBackground) {
        let id = block.dataset.id;
        setTimeout(() => {
          if (!document.querySelector("div.blocklyWidgetDiv")) return;

          let menu = document.querySelector("div.blocklyWidgetDiv").querySelector("div.blocklyContextMenu");

          if (!menu) return;

          block = Blockly.getMainWorkspace().getBlockById(id);

          let isCollapsed = block.collapsed_;

          if (block.startHat_ || block.type == "procedures_call" || block.outputShape_) return; //Collapsing for these are broke...

          menu.insertAdjacentHTML(
            "beforeend",
            `<div id="sa-script-collapse" class="goog-menuitem s3dev-mi" role="menuitem" style="user-select: none; border-top: 1px solid hsla(0, 0%, 0%, 0.15);">
  <div class="goog-menuitem-content" style="user-select: none;">${isCollapsed ? m("expand") : m("collapse")}</div>
</div>`
          );

          let menuItem = menu.querySelector("#sa-script-collapse");

          menuItem.addEventListener("click", () => {
            isCollapsed = !isCollapsed;
            block.setCollapsed(isCollapsed);
            menu.remove();
            if (isCollapsed) cache.push(block.id);
            else {
              if (cache.includes(block.id)) {
                //Just to be sure...
                cache.splice(cache.indexOf(block.id), 1);
              }
            }
          });
        }, 0);
      }
    }
  }

  document.addEventListener("mousedown", click, true);

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
