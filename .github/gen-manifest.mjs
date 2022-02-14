/**
 * Generates a manifest for specific browsers.
 * Called by packer-script.
 * @param {string} env - target environment
 * @param {object} manifest - manifest
 * @returns {object} - the manifest specific to the target environment
 */
export default (env, manifest) => {
  // Deep-clone
  manifest = JSON.parse(JSON.stringify(manifest));
  switch (env) {
    case "chrome": {
      delete manifest.browser_specific_settings;
      // manifest.incognito = "split";
      manifest.optional_permissions = manifest.optional_permissions.filter(
        (permission) => permission !== "clipboardWrite"
      );
      break;
    }
    case "firefox": {
      manifest.optional_permissions = manifest.optional_permissions.filter(
        (permission) => permission !== "fontSettings"
      )
      break;
    }
  }
  return manifest;
};
