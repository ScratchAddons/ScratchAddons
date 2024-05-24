import { updateBadge } from "./message-cache.js";

const BROWSER_ACTION = globalThis.MANIFEST_VERSION === 2 ? "browser_action" : "action";

// chrome.contextMenu is broken on Firefox mobile
const isAndroidFirefox = navigator.userAgent.includes("Firefox") && navigator.userAgent.includes("Android");

const periods = [
  {
    // Unfortunately, users on Chrome 96-99 will not get translations for these strings.
    name: (chrome.i18n.getMessage && chrome.i18n.getMessage("15min")) || "15 minutes",
    mins: 15,
  },
  {
    name: (chrome.i18n.getMessage && chrome.i18n.getMessage("1hour")) || "1 hour",
    mins: 60,
  },
  {
    name: (chrome.i18n.getMessage && chrome.i18n.getMessage("8hours")) || "8 hours",
    mins: 480,
  },
  {
    name: (chrome.i18n.getMessage && chrome.i18n.getMessage("24hours")) || "24 hours",
    mins: 1440,
  },
  {
    name: (chrome.i18n.getMessage && chrome.i18n.getMessage("untilEnabled")) || "Until I turn it back on",
    mins: Infinity,
  },
];

chrome.storage.local.get("muted", (obj) => {
  if (obj.muted) contextMenuMuted();
  else contextMenuUnmuted();
  scratchAddons.muted = obj.muted;
});

let currentMenuItem = null;

if (!isAndroidFirefox) {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.onClicked.addListener(({ parentMenuItemId, menuItemId }) => {
    if (parentMenuItemId === "mute") {
      const mins = Number(menuItemId.split("_")[1]);
      contextMenuMuted();
      muteForMins(mins);
    } else if (menuItemId === "unmute") {
      contextMenuUnmuted();
      unmute();
    }
  });
}

function contextMenuUnmuted() {
  if (isAndroidFirefox) return;
  if (currentMenuItem === "unmute") chrome.contextMenus.remove("unmute");
  currentMenuItem = "mute";
  chrome.contextMenus.create({
    id: "mute",
    title: (chrome.i18n.getMessage && chrome.i18n.getMessage("muteFor")) || "Do not disturb",
    contexts: [BROWSER_ACTION],
  });
  for (const period of periods) {
    chrome.contextMenus.create({
      id: `mute_${period.mins}`,
      title: period.name,
      parentId: "mute",
      contexts: [BROWSER_ACTION],
    });
  }
  // This seems to be run when the extension is loaded, so we'll just set the right icon here.
  const prerelease = chrome.runtime.getManifest().version_name.includes("-prerelease");
  chrome.browserAction.setIcon({
    path: {
      16: prerelease ? chrome.runtime.getURL("images/icon-blue-16.png") : chrome.runtime.getURL("images/icon-16.png"),
      32: prerelease ? chrome.runtime.getURL("images/icon-blue-32.png") : chrome.runtime.getURL("images/icon-32.png"),
    },
  });
}

function contextMenuMuted() {
  if (isAndroidFirefox) return;
  if (currentMenuItem === "mute") chrome.contextMenus.remove("mute");
  currentMenuItem = "unmute";
  chrome.contextMenus.create({
    id: "unmute",
    title: (chrome.i18n.getMessage && chrome.i18n.getMessage("unmute")) || "Turn off Do not disturb",
    contexts: [BROWSER_ACTION],
  });
  chrome.browserAction.setIcon({
    path: {
      16: chrome.runtime.getURL("images/icon-gray-16.png"),
      32: chrome.runtime.getURL("images/icon-gray-32.png"),
    },
  });
}

function muteForMins(mins) {
  if (mins !== Infinity) chrome.alarms.create("muted", { delayInMinutes: mins });
  scratchAddons.muted = true;
  updateBadge(scratchAddons.cookieStoreId);
  chrome.storage.local.set({ muted: true });
}

function unmute() {
  scratchAddons.muted = false;
  updateBadge(scratchAddons.cookieStoreId);
  chrome.storage.local.set({ muted: false });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "muted") {
    unmute();
    contextMenuUnmuted();
  }
});
