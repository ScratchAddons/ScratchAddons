const browserLevelPermissions = ["notifications"];
if (typeof browser !== "undefined") browserLevelPermissions.push("clipboardWrite");
else browserLevelPermissions.push("fontSettings");

export const getMissingOptionalPermissions = () => {
  return new Promise((resolve) => {
    chrome.permissions.getAll(({ permissions }) => {
      const missing = browserLevelPermissions.filter((p) => !permissions.includes(p));
      resolve(missing);
    });
  });
};
