import { isFirefox } from "../../libraries/common/cs/detect-browser.js";

// REMINDER: update similar code at /webpages/settings/index.js
const browserLevelPermissions = ["notifications"];
if (isFirefox()) {
  if (typeof Clipboard.prototype.write !== "function") {
    // Firefox 109-126 only
    browserLevelPermissions.push("clipboardWrite");
  }
}

export const getMissingOptionalPermissions = () => {
  return new Promise((resolve) => {
    chrome.permissions.getAll(({ permissions }) => {
      const missing = browserLevelPermissions.filter((p) => !permissions.includes(p));
      resolve(missing);
    });
  });
};
