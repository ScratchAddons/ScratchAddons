/**
 * Removes unnecessary settings entry to reduce storage size.
 * @param {object} settings the settings object
 * @param {?object[]} manifests the manifests, if null manifest check is not performed
 * @return the new settings
 */
export default (settings, manifests) => {
  const newSettings = JSON.parse(JSON.stringify(settings));
  const manifestObj =
    manifests &&
    manifests.reduce((a, b) => {
      a[b._addonId || b.addonId] = b.manifest || b;
      return a;
    }, {});
  for (const [addonId, setting] of Object.entries(newSettings)) {
    if (manifestObj && !manifestObj[addonId]) {
      // Delete settings from addons that no longer exist
      delete newSettings[addonId];
    } else {
      for (const settingsKey of Object.keys(setting)) {
        if (
          manifestObj &&
          !settingsKey.startsWith("_") &&
          !manifestObj[addonId].settings?.some((s) => settingsKey === s.id)
        ) {
          // Delete settings that no longer exist (exception: those with setting id starting with underscore)
          delete setting[settingsKey];
        }
      }
      if (Object.keys(setting).length === 0) {
        // Delete empty settings objects, even if "manifests" arg is null
        // One of the deletions above might have caused an object to be empty
        // Importing settings from a JSON file also causes most objects to be empty
        delete newSettings[addonId];
      }
    }
  }
  return newSettings;
};
