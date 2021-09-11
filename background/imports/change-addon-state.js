import runPersistentScripts from "./run-persistent-scripts.js";

/**
 * Changes addon state (enabled/disabled). This will trigger storage change
 * which in turn triggers localState setter and handleAddonStateChange.
 * @param {string} addonId - addon ID.
 * @param {boolean} newState - new addon state.
 */
export default (addonId, newState) => {
  const addonsEnabled = Object.assign({}, scratchAddons.localState.addonsEnabled, {
    [addonId]: newState,
  });
  chrome.storage.sync.set({
    addonsEnabled,
  });
};

/**
 * Only call from local-state.js.
 * @private
 */
export const handleAddonStateChange = (addonId, newState) => {
  const manifestItem = scratchAddons.manifests.find((addon) => addon.addonId === addonId);
  if (!manifestItem) return;
  const { manifest } = manifestItem;
  const { dynamicEnable, dynamicDisable } = manifest;
  if (newState) {
    if (dynamicEnable || dynamicDisable) {
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("addonDynamicEnable", { detail: { addonId, manifest } }));
    }
    runPersistentScripts(addonId);
  } else {
    if (dynamicDisable) {
      scratchAddons.localEvents.dispatchEvent(
        new CustomEvent("addonDynamicDisable", { detail: { addonId, manifest } })
      );
    }
    const addonObjs = scratchAddons.addonObjects.filter((addonObj) => addonObj.self.id === addonId);
    if (addonObjs) {
      addonObjs.forEach((addonObj) => {
        addonObj.self.dispatchEvent(new CustomEvent("disabled"));
        addonObj._kill();
      });
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("badgeUpdateNeeded"));
    }
  }
};
