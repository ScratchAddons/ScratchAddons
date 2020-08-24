import runAddonBgScripts from "./run-addon-bg-scripts.js";

const addonsWithBgScripts = [];

if (scratchAddons.localState.allReady) getBgScripts();
else window.addEventListener("scratchaddonsready", getBgScripts);

async function getBgScripts() {
  for (const { manifest, addonId } of scratchAddons.manifests) {
    if (manifest.persistent_scripts) {
      let permissions;
      if (manifest.permissions) permissions = manifest.permissions;
      else permissions = [];
      // TODO: give permissions according to global addon permissions and setting dependent ones
      addonsWithBgScripts.push({
        addonId,
        permissions,
        scripts: manifest.persistent_scripts,
      });
    }
  }
  addonsWithBgScripts.forEach((addonBgScripts) => {
    if (scratchAddons.localState.addonsEnabled[addonBgScripts.addonId]) runAddonBgScripts(addonBgScripts);
  });
}

scratchAddons.runBgScriptsById = (id) => {
  const findObj = addonsWithBgScripts.find((addon) => addon.addonId === id);
  if (findObj) runAddonBgScripts(findObj);
};
