export default async function ({ addon, global, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  let workspace = Blockly.getMainWorkspace();
  // Handle this workspace on init as well as all future workspaces
  const originalInit = Blockly.init_;
  Blockly.init_ = function (...args) {
    workspace = args[0];
    if (!addon.self.disabled) setGrid(true);
    return originalInit.call(this, ...args);
  };

  setGrid();

  addon.settings.addEventListener("change", () => setGrid(true));
  addon.self.addEventListener("disabled", () => setGrid(false));
  addon.self.addEventListener("reenabled", () => setGrid(true));

  function setGrid(enabled) {
    workspace.grid_.snapToGrid_ = enabled;
    workspace.grid_.spacing_ = addon.settings.get("grid");
    workspace.grid_.update(workspace.scale);
  }
}
