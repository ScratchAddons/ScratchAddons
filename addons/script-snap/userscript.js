export default async function ({ addon, global, console }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const workspace = await Blockly.getMainWorkspace();

  setGrid(true);

  addon.settings.addEventListener("change", () => setGrid(true));
  addon.self.addEventListener("disabled", () => setGrid(false));
  addon.self.addEventListener("reenabled", () => setGrid(true));

  function setGrid(enabled) {
    workspace.grid_.snapToGrid_ = enabled;
    workspace.grid_.spacing_ = addon.settings.get("grid");
    workspace.grid_.update(workspace.scale);
  }
}
