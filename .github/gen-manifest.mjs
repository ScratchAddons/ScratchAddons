const PERMISSIONS_IGNORED_IN_CHROME = ["clipboardWrite"];
const PERMISSIONS_IGNORED_IN_FIREFOX = ["declarativeNetRequestWithHostAccess"];

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
  manifest.icons["1024"] = "images/icon.png";
  manifest.icons["32"] = "images/icon-32.png";
  manifest.icons["16"] = "images/icon-16.png";
  switch (env) {
    case "chrome": {
      delete manifest.browser_specific_settings;
      // manifest.incognito = "split";
      manifest.optional_permissions = manifest.optional_permissions.filter(
        (permission) => !PERMISSIONS_IGNORED_IN_CHROME.includes(permission)
      );
      break;
    }
    case "firefox": {
      manifest.optional_permissions = manifest.optional_permissions.filter(
        (permission) => !PERMISSIONS_IGNORED_IN_FIREFOX.includes(permission)
      );
      break;
    }
  }
  return manifest;
};
