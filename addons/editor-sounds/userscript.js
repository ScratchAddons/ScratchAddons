export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const injectCurrent = () => {
    const workspace = addon.tab.traps.getWorkspace();
    const pathToMedia = workspace.options.pathToMedia;
    if (ScratchBlocks.registry) {
      // new Blockly: the addon can't call loadSounds() because it isn't exported
      const audio = workspace.getAudioManager();
      audio.load([pathToMedia + "click.mp3", pathToMedia + "click.wav", pathToMedia + "click.ogg"], "click");
      audio.load([pathToMedia + "delete.mp3", pathToMedia + "delete.ogg", pathToMedia + "delete.wav"], "delete");
    } else {
      ScratchBlocks.inject.loadSounds_(pathToMedia, workspace);
    }
  };

  // Add sounds to the current workspace
  injectCurrent();

  // Add sounds to all future workspaces
  if (ScratchBlocks.registry) {
    // new Blockly
    Object.defineProperty(ScratchBlocks.Options.prototype, "hasSounds", {
      get() {
        return true;
      },
      set() {},
    });

    // Don't try to load the disconnect sound because Scratch doesn't have it
    const oldLoadAudio = ScratchBlocks.WorkspaceAudio.prototype.load;
    ScratchBlocks.WorkspaceAudio.prototype.load = function (filenames, name) {
      if (name === "disconnect") return;
      oldLoadAudio.call(this, filenames, name);
    };
  } else {
    const originalInit = ScratchBlocks.init_;
    ScratchBlocks.init_ = function (...args) {
      const wksp = args[0];
      wksp.options.hasSounds = true;
      return originalInit.call(this, ...args);
    };
  }

  addon.self.addEventListener("disabled", () => {
    const workspace = addon.tab.traps.getWorkspace();
    const audio = workspace.getAudioManager();
    if (ScratchBlocks.registry) {
      // new Blockly
      audio.sounds.delete("click");
      audio.sounds.delete("delete");
    } else {
      delete audio.SOUNDS_.click;
      delete audio.SOUNDS_.delete;
    }
  });
  addon.self.addEventListener("reenabled", injectCurrent);
}
