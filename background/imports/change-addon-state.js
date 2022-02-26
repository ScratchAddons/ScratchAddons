import { updateBadge } from "../message-cache.js";

/**
 * Changes addon state (enabled/disabled), and executes the addons if enabled,
 * or stops the execution if disabled.
 * @param {string} addonId - addon ID.
 * @param {boolean} newState - new addon state.
 */
export default (addonId, newState) => {
  scratchAddons.localState.addonsEnabled[addonId] = newState;
  chrome.storage.sync.set({
    addonsEnabled: scratchAddons.localState.addonsEnabled,
  });
  const { manifest } = scratchAddons.manifests.find((addon) => addon.addonId === addonId);
  const { dynamicEnable, dynamicDisable } = manifest;
  if (newState) {
    if (dynamicEnable || dynamicDisable) {
      scratchAddons.localEvents.dispatchEvent(new CustomEvent("addonDynamicEnable", { detail: { addonId, manifest } }));
    }
  } else {
    if (dynamicDisable) {
      scratchAddons.localEvents.dispatchEvent(
        new CustomEvent("addonDynamicDisable", { detail: { addonId, manifest } })
      );
    }
  }
  if (addonId === "msg-count-badge") updateBadge(scratchAddons.cookieStoreId);
};
