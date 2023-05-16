export const getRunningAddons = (manifests, addonsEnabled) => {
  return new Promise((resolve) => {
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      if (!tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, "getRunningAddons", { frameId: 0 }, (res) => {
        // Just so we don't get any errors in the console if we don't get any response from a non scratch tab.
        void chrome.runtime.lastError;
        const addonsCurrentlyOnTab = res ? [...res.userscripts, ...res.userstyles] : [];
        const addonsPreviouslyOnTab = res ? res.disabledDynamicAddons : [];
        resolve({ addonsCurrentlyOnTab, addonsPreviouslyOnTab });
      });
    });
  });
};
