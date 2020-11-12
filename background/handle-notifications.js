const periods = [
  {
    name: "15 minutes",
    mins: 15,
  },
  {
    name: "1 hour",
    mins: 60,
  },
  {
    name: "8 hours",
    mins: 480,
  },
  {
    name: "24 hours",
    mins: 1440,
  },
  {
    name: "Until I turn it back on",
    mins: Infinity,
  },
];

chrome.storage.local.get("muted", (obj) => {
  if (obj.muted) contextMenuMuted();
  else contextMenuUnmuted();
});

chrome.contextMenus.removeAll();
let currentMenuItem = null;

function contextMenuUnmuted() {
  if (currentMenuItem === "unmute") chrome.contextMenus.remove("unmute");
  currentMenuItem = "mute";
  chrome.contextMenus.create({
    id: "mute",
    title: "Mute for...",
    contexts: ["browser_action"],
  });
  for (const period of periods) {
    chrome.contextMenus.create({
      title: period.name,
      parentId: "mute",
      contexts: ["browser_action"],
      onclick: () => {
        contextMenuMuted();
        muteForMins(period.mins);
      },
    });
  }
  chrome.browserAction.setIcon({
    path: {
      16: "../images/icon-16.png",
      32: "../images/icon-32.png",
    },
  });
}

function contextMenuMuted() {
  if (currentMenuItem === "mute") chrome.contextMenus.remove("mute");
  currentMenuItem = "unmute";
  chrome.contextMenus.create({
    id: "unmute",
    title: "Unmute",
    contexts: ["browser_action"],
    onclick: () => {
      contextMenuUnmuted();
      unmute();
    },
  });
  chrome.browserAction.setIcon({
    path: {
      16: "../images/icon-gray-16.png",
      32: "../images/icon-gray-32.png",
    },
  });
}

function muteForMins(mins) {
  if (mins !== Infinity) chrome.alarms.create("muted", { delayInMinutes: mins });
  scratchAddons.muted = true;
  scratchAddons.localEvents.dispatchEvent(new CustomEvent("badgeUpdateNeeded"));
  chrome.storage.local.set({ muted: true });
}

function unmute() {
  scratchAddons.muted = false;
  scratchAddons.localEvents.dispatchEvent(new CustomEvent("badgeUpdateNeeded"));
  chrome.storage.local.set({ muted: false });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "muted") {
    unmute();
    contextMenuUnmuted();
  }
});
