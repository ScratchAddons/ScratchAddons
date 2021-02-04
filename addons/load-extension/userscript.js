export default async function ({ addon, global, console }) {
  // TODO: Add removing extensions.
  for (let ext of Object.keys(addon.settings.getAll)) {
    if (addon.settings.getAll[ext] && !addon.tab.traps.vm.extensionManager.isExtensionLoaded(ext)) {
      addon.tab.traps.vm.extensionManager.loadExtensionIdSync(ext);
    }
  }
}
