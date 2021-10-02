export default async function ({ addon, global, cons, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const workspace = Blockly.getMainWorkspace();

  function appendKeys(keys, enableShiftKeys) {
    keys.push(
      ...[
        ["-", "-"],
        [",", ","],
        [".", "."],
      ]
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
        ]
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
        ]
      );
    }
  }

  Blockly.Blocks["sensing_keyoptions"] = {
    jsonInitOriginal: undefined,
    initOriginal: Blockly.Blocks["sensing_keyoptions"].init,
    init: function () {
      if (this.jsonInitOriginal === undefined) this.jsonInitOriginal = this.jsonInit;
      this.jsonInit = function (obj) {
        appendKeys(obj.args0[0].options, false);
        this.jsonInitOriginal(obj);
      };
      this.initOriginal();
    },
  };

  Blockly.Blocks["event_whenkeypressed"] = {
    jsonInitOriginal: undefined,
    initOriginal: Blockly.Blocks["event_whenkeypressed"].init,
    init: function () {
      if (this.jsonInitOriginal === undefined) this.jsonInitOriginal = this.jsonInit;
      this.jsonInit = function (obj) {
        appendKeys(obj.args0[0].options, true);
        this.jsonInitOriginal(obj);
      };
      this.initOriginal();
    },
  };

  if (workspace) {
    const allBlocks = [...workspace.getAllBlocks(), ...workspace.getFlyout().getWorkspace().getAllBlocks()];
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
      appendKeys(field.menuGenerator_, block.type === "event_whenkeypressed");
    }
  }
}
