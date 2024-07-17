import { updateBadge } from "./message-cache.js";

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

chrome.contextMenus?.removeAll();
let currentMenuItem = null;

// NOTE: chrome.contextMenus equals `undefined` on Firefox for Android!

chrome.contextMenus?.onClicked.addListener(({ parentMenuItemId, menuItemId }) => {
  if (parentMenuItemId === "mute") {
    const mins = Number(menuItemId.split("_")[1]);
    contextMenuMuted();
    muteForMins(mins);
  } else if (menuItemId === "unmute") {
    contextMenuUnmuted();
    unmute();
  }
});

function contextMenuUnmuted() {
  if (chrome.contextMenus === undefined) return; // Firefox for Android
  if (currentMenuItem === "unmute") chrome.contextMenus.remove("unmute");
  currentMenuItem = "mute";
  chrome.contextMenus.create({
    id: "mute",
    title: (chrome.i18n.getMessage && chrome.i18n.getMessage("muteFor")) || "Do not disturb",
    contexts: ["action"],
  });
  for (const period of periods) {
    chrome.contextMenus.create({
      id: `mute_${period.mins}`,
      title: period.name,
      parentId: "mute",
      contexts: ["action"],
    });
  }
  chrome.action.setIcon({
    path: {
      16: chrome.runtime.getURL(chrome.runtime.getManifest().icons["16"]),
      32: chrome.runtime.getURL(chrome.runtime.getManifest().icons["32"]),
    },
  });
}

function contextMenuMuted() {
  if (chrome.contextMenus === undefined) return; // Firefox for Android
  // Note: in theory, this function is unreachable
  // in FF for Android, but we early-return anyway.
  if (currentMenuItem === "mute") chrome.contextMenus.remove("mute");
  currentMenuItem = "unmute";
  chrome.contextMenus.create({
    id: "unmute",
    title: (chrome.i18n.getMessage && chrome.i18n.getMessage("unmute")) || "Turn off Do not disturb",
    contexts: ["action"],
  });
  chrome.action.setIcon({
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
