const PERMISSIONS_IGNORED_IN_CHROME = ["clipboardWrite", "webRequestBlocking"];
const PERMISSIONS_IGNORED_IN_FIREFOX = [];
// These host permissions below should be removed during production manifest gen.
const PERMISSIONS_ALWAYS_IGNORED = [
  "scripting",
  "https://scratchfoundation.github.io/scratch-editor/*",
  "https://scratchfoundation.github.io/*",
  "http://localhost:8333/*",
  "http://localhost:8601/*",
  "http://localhost:8602/*",
  "http://localhost/*",
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

  // Icons
  manifest.icons["1024"] = "images/icon.png";
  manifest.icons["32"] = "images/icon-32.png";
  manifest.icons["16"] = "images/icon-16.png";

  const removePermission = (permToRemove) => {
    // Affects `permissions`, `host_permissions`, `optional_permissions`, `optional_host_permissions`,
    // `web_accessible_resources[i].matches`, and content_scripts[i].matches
    manifest.permissions = manifest.permissions.filter((perm) => perm !== permToRemove);
    manifest.host_permissions = manifest.host_permissions.filter((perm) => perm !== permToRemove);
    manifest.optional_permissions = manifest.optional_permissions.filter((perm) => perm !== permToRemove);
    if (manifest.optional_host_permissions) {
      manifest.optional_host_permissions = manifest.optional_host_permissions.filter((perm) => perm !== permToRemove);
    }
    manifest.content_scripts.forEach((contentScript) => {
      contentScript.matches = contentScript.matches.filter((match) => match !== permToRemove);
    });
    manifest.web_accessible_resources.forEach((resourcesObj) => {
      resourcesObj.matches = resourcesObj.matches.filter((match) => match !== permToRemove);
    });
  };

  // Remove some permissions no matter the environment
  PERMISSIONS_ALWAYS_IGNORED.forEach((permToRemove) => removePermission(permToRemove));

  switch (env) {
    case "chrome": {
      // Chrome and Edge
      delete manifest.browser_specific_settings;
      delete manifest.background.page;

      PERMISSIONS_IGNORED_IN_CHROME.forEach((permToRemove) => removePermission(permToRemove));

      break;
    }
    case "firefox": {
      delete manifest.background.service_worker;
      delete manifest.background.type;

      PERMISSIONS_IGNORED_IN_FIREFOX.forEach((permToRemove) => removePermission(permToRemove));

      break;
    }
  }
  return manifest;
};
