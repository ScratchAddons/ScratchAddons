export default async function ({ addon, msg, global, console }) {
  // awaiting blockly guarantees that vm exists.
  await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;

  const _addSprite = vm.addSprite;
  vm.addSprite = function (data) {
    if (typeof data === "string") {
      const json = JSON.parse(data);
      deleteDefaults(json);
      return _addSprite.call(this, JSON.stringify(json));
    }
    return _addSprite.call(this, data);
  };

  const _loadProject = vm.loadProject;
  vm.loadProject = function (data) {
    // This function runs anytime a project is loaded whether by "File New", "Save as a copy", and just by loading a project.
    // However, the data is only passed in as a string when loading a default project.
    // (Keep in mind we have an addon that can change that, default-project, however that uses downloadProjectId)
    if (typeof data === "string") {
      const json = JSON.parse(data);
      for (const target of json.targets) {
        deleteDefaults(target);
      }

      return _loadProject.call(this, JSON.stringify(json));
    }
    return _loadProject.call(this, data);
  };

  function deleteDefaults(target) {
    if (addon.self.disabled) return;
    const deleteOption = addon.settings.get("delete");
    if (deleteOption === "all") {
      target.sounds = [];
    } else if (deleteOption === "pop") {
      // Scratch DOES localize this sound when they load a new project, but not in the sound library... weird.
      // BUT they do localize the sound when you choose the paint option to add sprite... again... weird.
      // So we will look at file name.
      const popFile = "83a9787d4cb6f3b7632b4ddfebf74367.wav";
      // The sound object is different when adding a sprite from the library vs painting a new sprite.
      // library uses md5ext, paint uses md5... weird. scratch. is. WEIRD.
      const isPop = target.sounds[0].md5ext === popFile || target.sounds[0].md5 === popFile;
      // Only add the sound if the only sound in the list is the pop sound.
      if (target.sounds.length === 1 && isPop) {
        target.sounds = [];
      }
    }
  }
}
