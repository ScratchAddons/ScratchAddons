export default async function ({ addon, msg }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();

  let defaultKeys = null;
  function appendKeys(keys, enableShiftKeys) {
    if (!defaultKeys) {
      defaultKeys = [...keys];
    }
    if (!addon.self.disabled) {
      keys.push(
        ...[
          ["-", "-"],
          [",", ","],
          [".", "."],
        ],
      );
      keys.splice(5, 0, [msg("enter-key"), "enter"]);
      if (addon.settings.get("experimentalKeys")) {
        keys.push(
          ...[
            ["`", "`"],
            ["=", "="],
            ["[", "["],
            ["]", "]"],
            ["\\", "\\"],
            [";", ";"],
            ["'", "'"],
            ["/", "/"],
          ],
        );
      }
      if (enableShiftKeys && addon.settings.get("shiftKeys")) {
        keys.push(
          ...[
            ["!", "!"],
            ["@", "@"],
            ["#", "#"],
            ["$", "$"],
            ["%", "%"],
            ["^", "^"],
            ["&", "&"],
            ["*", "*"],
            ["(", "("],
            [")", ")"],
            ["_", "_"],
            ["+", "+"],
            ["{", "{"],
            ["}", "}"],
            ["|", "|"],
            [":", ":"],
            ['"', '"'],
            ["?", "?"],
            ["<", "<"],
            [">", ">"],
            ["~", "~"],
          ],
        );
      }
    }
    return keys;
  }

  for (const opcode of ["sensing_keyoptions", "event_whenkeypressed"]) {
    const block = ScratchBlocks.Blocks[opcode];
    const originalInit = block.init;
    block.init = function (...args) {
      const originalJsonInit = this.jsonInit;
      this.jsonInit = function (obj) {
        appendKeys(obj.args0[0].options, opcode === "event_whenkeypressed");
        return originalJsonInit.call(this, obj);
      };
      return originalInit.call(this, ...args);
    };
  }

  const updateExistingBlocks = () => {
    const workspace = Blockly.getMainWorkspace();
    const flyout = workspace && workspace.getFlyout();
    if (workspace && flyout) {
      const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
      for (const block of allBlocks) {
        if (block.type !== "event_whenkeypressed" && block.type !== "sensing_keyoptions") {
          continue;
        }
        const input = block.inputList[0];
        if (!input) {
          continue;
        }
        const field = input.fieldRow.find((i) => i && Array.isArray(i.menuGenerator_));
        if (!field) {
          continue;
        }
        field.menuGenerator_ = appendKeys(
          defaultKeys ? [...defaultKeys] : field.menuGenerator_,
          block.type === "event_whenkeypressed",
        );
      }
    }
  };

  updateExistingBlocks();
  addon.settings.addEventListener("change", updateExistingBlocks);
  addon.self.addEventListener("disabled", updateExistingBlocks);
  addon.self.addEventListener("reenabled", updateExistingBlocks);
}
