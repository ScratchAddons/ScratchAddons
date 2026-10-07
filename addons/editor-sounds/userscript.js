export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const injectCurrent = () => {
    const workspace = addon.tab.traps.getWorkspace();
    const pathToMedia = workspace.options.pathToMedia;
    const audio = workspace.getAudioManager();
    audio.load([pathToMedia + "click.mp3", pathToMedia + "click.wav", pathToMedia + "click.ogg"], "click");
    audio.load([pathToMedia + "delete.mp3", pathToMedia + "delete.ogg", pathToMedia + "delete.wav"], "delete");
  };

  // Add sounds to the current workspace
  injectCurrent();

  // Add sounds to all future workspaces
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

  addon.self.addEventListener("disabled", () => {
    const workspace = addon.tab.traps.getWorkspace();
    const audio = workspace.getAudioManager();
    audio.sounds.delete("click");
    audio.sounds.delete("delete");
  });
  addon.self.addEventListener("reenabled", injectCurrent);
}
