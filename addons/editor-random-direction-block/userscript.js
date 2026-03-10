export default async function ({ addon, console, msg }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const runtime = await addon.tab.traps.vm.runtime;

  function extendPointTowardsMenu(menuOptions) {
    if (!addon.self.disabled && addon.settings.get("randomDirection")) {
      if (!menuOptions.find((option) => option[1] === "_random_")) {
        menuOptions.splice(1, 0, [ScratchBlocks.Msg.MOTION_POINTTOWARDS_RANDOM, "_random_"]);
      }
    }
    return menuOptions;
  }
  function extendSwitchCostumeMenu(menuOptions) {
    if (addon.self.disabled) return menuOptions;
    if (addon.settings.get("nextCostume")) {
      if (!menuOptions.find((option) => option[1] === "next costume")) {
        menuOptions.push([msg("next-costume"), "next costume"]);
      }
    }
    if (addon.settings.get("previousCostume")) {
      if (!menuOptions.find((option) => option[1] === "previous costume")) {
        menuOptions.push([msg("previous-costume"), "previous costume"]);
      }
    }
    return menuOptions;
  }
  function extendSpriteMenu(menuOptions) {
    if (!addon.self.disabled && addon.settings.get("sameSprite")) {
      const currentSprite = runtime.getEditingTarget();
      if (!currentSprite || currentSprite.isStage) return menuOptions;
      const spriteName = currentSprite.getName();
      if (!menuOptions.find((option) => option[1] === spriteName)) {
        const insertIndex = menuOptions.findIndex((option) => option[1] === "_mouse_") + 1;
        menuOptions.splice(insertIndex, 0, [spriteName, spriteName]);
      }
    }
    return menuOptions;
  }

  let modifiedBlocks = [];
  function setBlock(opcode, func) {
    modifiedBlocks.push(opcode);
    const block = ScratchBlocks.Blocks[opcode];
    const originalInit = block.init;
    block.init = function (...args) {
      const originalJsonInit = this.jsonInit;
      this.jsonInit = function (obj) {
        const originalOptionsMenu = obj.args0[0].options;
        obj.args0[0].options = function (...args) {
          return func(originalOptionsMenu.call(this, ...args));
        };
        return originalJsonInit.call(this, obj);
      };
      originalInit.call(this, ...args);
    };
  }
  setBlock("motion_pointtowards_menu", extendSpriteMenu);
  setBlock("motion_pointtowards_menu", extendPointTowardsMenu);
  setBlock("looks_costume", extendSwitchCostumeMenu);
  setBlock("motion_goto_menu", extendSpriteMenu);
  setBlock("motion_glideto_menu", extendSpriteMenu);
  setBlock("control_create_clone_of_menu", extendSpriteMenu);
  setBlock("sensing_touchingobjectmenu", extendSpriteMenu);
  setBlock("sensing_distancetomenu", extendSpriteMenu);
  setBlock("sensing_of_object_menu", extendSpriteMenu);

  const updateExistingBlocks = () => {
    const workspace = addon.tab.traps.getWorkspace();
    const flyout = workspace && workspace.getFlyout();
    if (workspace && flyout) {
      const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
      for (const block of allBlocks) {
        if (!modifiedBlocks.includes(block.type)) continue;
        const input = block.inputList[0];
        if (!input) continue;
        const field = input.fieldRow.find((i) => i && typeof i.menuGenerator_ === "function");
        if (!field) continue;

        const originalMenuGenerator = field.menuGenerator_;
        switch (block.type) {
          case "motion_pointtowards_menu": {
            field.menuGenerator_ = function (...args) {
              return extendPointTowardsMenu(originalMenuGenerator.call(this, ...args));
            };
            break;
          }
          case "looks_costume": {
            field.menuGenerator_ = function (...args) {
              return extendSwitchCostumeMenu(originalMenuGenerator.call(this, ...args));
            };
            break;
          }
          default: {
            field.menuGenerator_ = function (...args) {
              return extendSpriteMenu(originalMenuGenerator.call(this, ...args));
            };
          }
        }
      }
    }
  };

  updateExistingBlocks();
  addon.settings.addEventListener("change", updateExistingBlocks);
  addon.self.addEventListener("disabled", updateExistingBlocks);
  addon.self.addEventListener("reenabled", updateExistingBlocks);
}
