import runAddonBgScripts from "./run-addon-bg-scripts.js";

if(scratchAddons.localState.allReady) getBgScripts();
else window.addEventListener("scratchaddonsready", getBgScripts);

const addonsWithBgScripts = [];
async function getBgScripts() {
    for(const addonId in scratchAddons.manifests) {
        const manifest = scratchAddons.manifests[addonId];
        if(manifest.persistent_scripts) {
            const permissions = ["badge", "notifications"];
            // TODO: give permissions according to global addon permissions and setting dependent ones
            addonsWithBgScripts.push({addonId, permissions, scripts: manifest.persistent_scripts});
        }
    }
    addonsWithBgScripts.forEach(addonBgScripts => runAddonBgScripts(addonBgScripts));
};