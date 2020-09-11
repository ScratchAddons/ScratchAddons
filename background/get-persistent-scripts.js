import runPersistentScripts from "./imports/run-persistent-scripts.js";

if (scratchAddons.localState.allReady) getPersistentScripts();
else scratchAddons.localEvents.addEventListener("ready", getPersistentScripts);

async function getPersistentScripts() {
  const manifests = scratchAddons.manifests.filter(obj => scratchAddons.localState.addonsEnabled[obj.addonId] === true);
  for (const { addonId, manifest } of manifests) {
    if(manifest.persistent_scripts && manifest.persistent_scripts.length) runPersistentScripts(addonId);
  }
}