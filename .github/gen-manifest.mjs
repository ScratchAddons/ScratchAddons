const PERMISSIONS_IGNORED_IN_CHROME = ["clipboardWrite"];
// Previously included declarativeNetRequestWithHostAccess.
const PERMISSIONS_IGNORED_IN_FIREFOX = [];
// These should be removed during production manifest gen.
const PERMISSIONS_ALWAYS_IGNORED = [
  "https://scratchfoundation.github.io/scratch-gui/*",
  "http://localhost:8333/*",
  "http://localhost:8601/*",
];

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
  manifest.permissions = manifest.permissions.filter((permission) => !PERMISSIONS_ALWAYS_IGNORED.includes(permission));
  manifest.content_scripts.forEach((content_script) => {
    content_script.matches = content_script.matches.filter(
      (permission) => !PERMISSIONS_ALWAYS_IGNORED.includes(permission)
    );
  });
  switch (env) {
    case "chrome": {
      delete manifest.browser_specific_settings;
      // manifest.incognito = "split";
      manifest.optional_permissions = manifest.optional_permissions.filter(
        (permission) => !PERMISSIONS_IGNORED_IN_CHROME.includes(permission)
      );
      manifest.permissions = manifest.permissions.filter(
        (permission) => !PERMISSIONS_IGNORED_IN_CHROME.includes(permission)
      );
      break;
    }
    case "firefox": {
      manifest.optional_permissions = manifest.optional_permissions.filter(
        (permission) => !PERMISSIONS_IGNORED_IN_FIREFOX.includes(permission)
      );
      manifest.permissions = manifest.permissions.filter(
        (permission) => !PERMISSIONS_IGNORED_IN_FIREFOX.includes(permission)
      );
      break;
    }
  }
  return manifest;
};
