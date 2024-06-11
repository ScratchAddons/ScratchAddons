import doCleanUp from "./doCleanup.js";

export default async function ({ addon, console, msg }) {
  const blockly = await addon.tab.traps.getBlockly();
  const getWorkspace = () => blockly.mainWorkspace;

  let originalMsg = blockly.Msg.CLEAN_UP;
  addon.self.addEventListener("disabled", () => (blockly.Msg.CLEAN_UP = m("clean-plus")));
  addon.self.addEventListener("reenabled", () => (blockly.Msg.CLEAN_UP = originalMsg));

  const oldCleanUpFunc = blockly.WorkspaceSvg.prototype.cleanUp;

  blockly.WorkspaceSvg.prototype.cleanUp = function () {
    if (addon.self.disabled) return oldCleanUpFunc.call(this);
    doCleanUp(null, getWorkspace, msg);
  };

  addon.tab.createBlockContextMenu(
    (items, block) => {
      items.push({
        enabled: true,
        text: m("make-space"),
        _isDevtoolsFirstItem: true,
        callback: () => {
          doCleanUp(block, getWorkspace, msg);
        },
        separator: true,
      });
      return items;
    },
    { blocks: true }
  );
}
