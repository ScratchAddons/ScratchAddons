export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const injectCurrent = () => {
    const workspace = Blockly.getMainWorkspace();
    const pathToMedia = workspace.options.pathToMedia;
    ScratchBlocks.inject.loadSounds_(pathToMedia, workspace);
  };

  // Add sounds to the current workspace
  injectCurrent();

  // Add sounds to all future workspaces
  const originalInit = ScratchBlocks.init_;
  ScratchBlocks.init_ = function (...args) {
    const wksp = args[0];
    wksp.options.hasSounds = true;
    return originalInit.call(this, ...args);
  };

  addon.self.addEventListener("disabled", () => {
    const workspace = Blockly.getMainWorkspace();
    const audio = workspace.getAudioManager();
    delete audio.SOUNDS_.click;
    delete audio.SOUNDS_.delete;
  });
  addon.self.addEventListener("reenabled", injectCurrent);
}
