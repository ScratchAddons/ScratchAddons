chrome.permissions.contains(
  {
    permissions: ["webRequest", "webRequestBlocking", "cookies"],
    origins: ["https://scratch.mit.edu/*", "https://api.scratch.mit.edu/*", "https://clouddata.scratch.mit.edu/*"],
  },
  async (hasPermissions) => {
    if (hasPermissions) {
      // Load remaining scripts
      await import("./handle-fetch.js");
      await import("./handle-cookie.js");
      await import("./handle-auth.js");
      await import("./handle-messages.js");

      await import("./get-userscripts.js");
      await import("./get-persistent-scripts.js");
    } else {
      console.error("Could not load addons; site access was not granted");
      chrome.tabs.create({
        active: true,
        url: "/webpages/settings/permissions.html",
      });
    }
  }
);
