import doCleanUp from "./doCleanup.js";

export default async function ({ addon, console, msg, safeMsg: m }) {
  const blockly = await addon.tab.traps.getBlockly();
  const getWorkspace = () => blockly.getMainWorkspace();

  let originalMsg = blockly.Msg.CLEAN_UP;
  addon.self.addEventListener("disabled", () => (blockly.Msg.CLEAN_UP = originalMsg));
  addon.self.addEventListener("reenabled", () => (blockly.Msg.CLEAN_UP = m("clean-plus")));
  blockly.Msg.CLEAN_UP = m("clean-plus");

  const oldCleanUpFunc = blockly.WorkspaceSvg.prototype.cleanUp;
  blockly.WorkspaceSvg.prototype.cleanUp = function () {
    if (addon.self.disabled) return oldCleanUpFunc.call(this);
    doCleanUp(null, getWorkspace, msg);
  };

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;
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
