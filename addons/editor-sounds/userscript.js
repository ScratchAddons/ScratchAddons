/** @param {import("addonAPI").AddonAPI} */
export default async function ({ addon, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const injectCurrent = () => {
    const workspace = addon.tab.traps.getWorkspace();
    const pathToMedia = workspace.options.pathToMedia;
    if (ScratchBlocks.registry) {
      // new Blockly: based on code from https://github.com/google/blockly/blob/7184cb2/core/inject.ts#L327
      // (the addon can't call loadSounds() because it isn't exported)
      const audioMgr = workspace.getAudioManager();
      audioMgr.load([pathToMedia + "click.mp3", pathToMedia + "click.wav", pathToMedia + "click.ogg"], "click");
      audioMgr.load([pathToMedia + "delete.mp3", pathToMedia + "delete.ogg", pathToMedia + "delete.wav"], "delete");

      // Bind temporary hooks that preload the sounds.
      const soundBinds = [];
      function unbindSounds() {
        while (soundBinds.length) {
          const oldSoundBinding = soundBinds.pop();
          if (oldSoundBinding) {
            ScratchBlocks.browserEvents.unbind(oldSoundBinding);
          }
        }
        audioMgr.preload();
      }

      // These are bound on mouse/touch events with
      // Blockly.browserEvents.conditionalBind, so they restrict the touch
      // identifier that will be recognized.  But this is really something that
      // happens on a click, not a drag, so that's not necessary.

      // Android ignores any sound not loaded as a result of a user action.
      soundBinds.push(ScratchBlocks.browserEvents.conditionalBind(document, "pointermove", null, unbindSounds, true));
      soundBinds.push(ScratchBlocks.browserEvents.conditionalBind(document, "touchstart", null, unbindSounds, true));
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
