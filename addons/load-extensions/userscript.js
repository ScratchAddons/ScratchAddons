export default async function ({ addon, global, console }) {
  // IDs are taken from https://github.com/LLK/scratch-vm/blob/ffa78b91b8645b6a8c80f698a3637bb73abf2931/src/extension-support/extension-manager.js#L11
  const Extensions = ["music", "pen", "videoSensing", "text2speech", "translate"];
  const vm = addon.tab.traps.vm;
  for (let ext of Extensions) {
    // Check if setting enabled and it's not already loaded
    if (addon.settings.get(ext) && !addon.tab.traps.vm.extensionManager.isExtensionLoaded(ext)) {
      vm.extensionManager.loadExtensionIdSync(ext);
      if (ext == "videoSensing") {
        // The following code can only run if:
        // - the "videoSensing" setting was enabled
        // - they have not already added any video sencing blocks to the project.
        // The following code will just disable the video. It can reenable it at any time with blocks.
        vm.runtime.ioDevices.video.disableVideo();
      }
    }
  }
}
