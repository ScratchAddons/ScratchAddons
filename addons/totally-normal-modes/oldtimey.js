let projectorSound;

export function updateSound(addon, mode) {
  if (addon.tab.editorMode === "editor" && mode === "oldTimey") {
    if (!projectorSound) {
      projectorSound = new Audio(addon.self.dir + "/assets/oldtimey-projector.mp3");
      projectorSound.volume = 0.1;
      projectorSound.loop = true;
    }
    projectorSound.play();
  } else if (projectorSound) projectorSound.pause();
}
