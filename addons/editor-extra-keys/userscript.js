export default async function ({ addon, global, cons, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  function appendKeys(keys) {
    keys.push(
      ...[
        ["-", "-"],
        [",", ","],
        [".", "."],

        /*
        ["`", "`"],
        ["=", "="],
        ["[", "["],
        ["]", "]"],
        ["\\", "\\"],
        [";", ";"],
        ["'", "'"],
        ["/", "/"],
        */
      ]
    );
    keys.splice(5, 0, [msg("enter-key"), "enter"]);
  }

  Blockly.Blocks["sensing_keyoptions"] = {
    jsonInitOriginal: undefined,
    initOriginal: Blockly.Blocks["sensing_keyoptions"].init,
    init: function () {
      if (this.jsonInitOriginal === undefined) this.jsonInitOriginal = this.jsonInit;
      this.jsonInit = function (obj) {
        appendKeys(obj.args0[0].options);
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
        appendKeys(obj.args0[0].options);
        this.jsonInitOriginal(obj);
      };
      this.initOriginal();
    },
  };

  const workspace = Blockly.getMainWorkspace();
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
      const field = input.fieldRow[1];
      if (!field) {
        continue;
      }
      const menuGenerator = field.menuGenerator_;
      appendKeys(menuGenerator);
    }
  }
}
