export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const oldFunction = ScratchBlocks.Block.prototype.getFirstStatementConnection;
  const settingsToKey = {
    ctrl: "Control",
    alt: "Alt Meta",
    shift: "Shift",
  };

  let modifierHeld = false;

  function keyDown(e, key) {
    if (settingsToKey[key].includes(e.key)) {
      modifierHeld = true;
    }
  }

  function keyUp(e, key) {
    if (settingsToKey[key].includes(e.key)) {
      modifierHeld = false;
    }
  }

  let currentKey;
  const keyDownListener = (e) => keyDown(e, currentKey);
  const keyUpListener = (e) => keyUp(e, currentKey);

  function addEventListeners(key) {
    currentKey = key;
    document.addEventListener("keydown", keyDownListener);
    document.addEventListener("keyup", keyUpListener);
  }

  function removeEventListeners() {
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("keyup", keyUpListener);
  }

  function polluteFunction() {
    ScratchBlocks.Block.prototype.getFirstStatementConnection = function () {
      if (modifierHeld) return null;

      for (var i = 0, input; (input = this.inputList[i]); i++) {
        if (input.connection && input.connection.type == ScratchBlocks.NEXT_STATEMENT) {
          return input.connection;
        }
      }
      return null;
    };
  }

  polluteFunction();
  addEventListeners(addon.settings.get("key"));

  addon.self.addEventListener(
    "disabled",
    () => (ScratchBlocks.Block.prototype.getFirstStatementConnection = oldFunction)
  );
  addon.self.addEventListener("reenabled", () => {
    polluteFunction();
    removeEventListeners();
    addEventListeners(addon.settings.get("key"));
  });

  addon.settings.addEventListener("change", () => {
    removeEventListeners();
    addEventListeners(addon.settings.get("key"));
  });
}
