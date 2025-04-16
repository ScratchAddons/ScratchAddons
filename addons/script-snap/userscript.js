export default async function ({ addon, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  let workspace = Blockly.getMainWorkspace();
  // Handle future workspaces
  const originalInit = Blockly.init_;
  Blockly.init_ = function (...args) {
    workspace = args[0];
    if (!addon.self.disabled) setGrid(true);
    return originalInit.call(this, ...args);
  };

  setGrid(true);

  addon.settings.addEventListener("change", () => setGrid(true));
  addon.self.addEventListener("disabled", () => setGrid(false));
  addon.self.addEventListener("reenabled", () => setGrid(true));

  function setGrid(enabled) {
    if (Blockly.registry) {
      // New Blockly
      workspace.grid.snapToGrid = enabled;
      // TODO: Fix the root cause of the type bug (#8268)
      if (enabled) workspace.grid.spacing = Number(addon.settings.get("grid"));
      else workspace.grid.spacing = 40;
      workspace.grid.update(workspace.scale);
    } else {
      console.log(addon.settings.get("grid"))
      workspace.grid_.snapToGrid_ = enabled;
      if (enabled) workspace.grid_.spacing_ = Number(addon.settings.get("grid"));
      else workspace.grid_.spacing_ = 40;
      workspace.grid_.update(workspace.scale);
    }
  }
}
