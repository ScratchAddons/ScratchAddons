import { updateBadge, handleBadgeAlarm } from "../message-cache.js";

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
  if (addonId === "msg-count-badge") {
    updateBadge(scratchAddons.cookieStoreId);
    handleBadgeAlarm();
  }
  // Partial dynamicEnable (PDE)/Partial dynamicDisable (PDD)
  // See #4188 - for now, userstyles only.
  if (scratchAddons.dependents[addonId]?.size) {
    for (const dependentAddonId of scratchAddons.dependents[addonId]) {
      // Ignore disabled addons
      if (!scratchAddons.localState.addonsEnabled[dependentAddonId]) continue;
      const dependentManifest = scratchAddons.manifests.find(
        (manifest) => manifest.addonId === dependentAddonId
      ).manifest;
      // Require dynamicEnable/dynamicDisable since this is a type of dynamic enable/disable
      // and it might cause problems if applied to addons without support
      if (newState && dependentManifest.dynamicEnable) {
        // Dependent might have a userstyle that needs to be activated
        scratchAddons.localEvents.dispatchEvent(
          new CustomEvent("addonDynamicEnable", {
            detail: {
              addonId: dependentAddonId,
              manifest: dependentManifest,
              partialDynamicEnableBy: addonId,
            },
          })
        );
      } else if (!newState && dependentManifest.dynamicDisable) {
        // Dependent might have a userstyle that needs to be deactivated
        scratchAddons.localEvents.dispatchEvent(
          new CustomEvent("addonDynamicDisable", {
            detail: {
              addonId: dependentAddonId,
              manifest: dependentManifest,
              partialDynamicDisableBy: addonId,
            },
          })
        );
      }
    }
  }
};
