export default async function ({ addon, global, cons, msg }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  function appendRandomOption(menuOptions) {
    if (!addon.self.disabled) {
      if (!menuOptions.find((option) => option[1] === "_random_"))
        menuOptions.push([ScratchBlocks.Msg.MOTION_POINTTOWARDS_RANDOM, "_random_"]);
    }
    return menuOptions;
  }

  const block = ScratchBlocks.Blocks["motion_pointtowards_menu"];
  const originalInit = block.init;
  block.init = function (...args) {
    const originalJsonInit = this.jsonInit;
    this.jsonInit = function (obj) {
      const originalOptionsMenu = obj.args0[0].options;
      obj.args0[0].options = function (...args) {
        return appendRandomOption(originalOptionsMenu.call(this, ...args));
      };
      return originalJsonInit.call(this, obj);
    };
    return originalInit.call(this, ...args);
  };

  const updateExistingBlocks = () => {
    const workspace = Blockly.getMainWorkspace();
    const flyout = workspace && workspace.getFlyout();
    if (workspace && flyout) {
      const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
      for (const block of allBlocks) {
        if (block.type !== "motion_pointtowards_menu") {
          continue;
        }
        const input = block.inputList[0];
        if (!input) {
          continue;
        }
        const field = input.fieldRow.find((i) => i && typeof i.menuGenerator_ === "function");
        if (!field) {
          continue;
        }
        const originalMenuGenerator = field.menuGenerator_;

        field.menuGenerator_ = function (...args) {
          return appendRandomOption(originalMenuGenerator.call(this, ...args));
        };
      }
    }
  };

  updateExistingBlocks();
  addon.settings.addEventListener("change", updateExistingBlocks);
  addon.self.addEventListener("disabled", updateExistingBlocks);
  addon.self.addEventListener("reenabled", updateExistingBlocks);
}
