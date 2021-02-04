export default async function ({ addon, global, console }) {
  for (let ext of Object.keys(addon.settings.getAll)) {
    if (addon.settings.getAll[ext]) {
      addon.tab.traps.vm.extensionManager.loadExtensionIdSync(ext);
    }
  }
}
