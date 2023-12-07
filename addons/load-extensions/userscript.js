export default async function ({ addon, console }) {
  const vm = addon.tab.traps.vm;
  const loadExtensions = () => {
    if (addon.self.disabled) return;
    // IDs are taken from https://github.com/scratchfoundation/scratch-vm/blob/ffa78b91b8645b6a8c80f698a3637bb73abf2931/src/extension-support/extension-manager.js#L11
    const EXTENSIONS = ["music", "pen", "text2speech", "translate"];
    for (let ext of EXTENSIONS) {
      // Check if setting enabled and it's not already loaded
      if (addon.settings.get(ext) && !vm.extensionManager.isExtensionLoaded(ext)) {
        vm.extensionManager.loadExtensionIdSync(ext);
      }
    }
  };
  if (vm.editingTarget) {
    loadExtensions();
  } else {
    vm.runtime.once("PROJECT_LOADED", loadExtensions);
  }
}
