import { updateBadge } from "./message-cache.js";

const periods = [
  {
    name: chrome.i18n.getMessage("15min"),
    mins: 15,
  },
  {
    name: chrome.i18n.getMessage("1hour"),
    mins: 60,
  },
  {
    name: chrome.i18n.getMessage("8hours"),
    mins: 480,
  },
  {
    name: chrome.i18n.getMessage("24hours"),
    mins: 1440,
  },
  {
    name: chrome.i18n.getMessage("untilEnabled"),
    mins: Infinity,
  },
];

chrome.storage.local.get("muted", (obj) => {
  if (obj.muted) contextMenuMuted();
  else contextMenuUnmuted();
  scratchAddons.muted = obj.muted;
});

chrome.contextMenus.removeAll();
let currentMenuItem = null;

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

function contextMenuUnmuted() {
  if (currentMenuItem === "unmute") chrome.contextMenus.remove("unmute");
  currentMenuItem = "mute";
  chrome.contextMenus.create({
    id: "mute",
    title: chrome.i18n.getMessage("muteFor"),
    contexts: ["browser_action"],
  });
  for (const period of periods) {
    chrome.contextMenus.create({
      id: `mute_${period.mins}`,
      title: period.name,
      parentId: "mute",
      contexts: ["browser_action"],
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
  if (currentMenuItem === "mute") chrome.contextMenus.remove("mute");
  currentMenuItem = "unmute";
  chrome.contextMenus.create({
    id: "unmute",
    title: chrome.i18n.getMessage("unmute"),
    contexts: ["browser_action"],
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
