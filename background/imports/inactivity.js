import { handleBadgeAlarm } from "../message-cache.js";

const INACTIVITY_DELAY_MINS = 10;
const INACTIVITY_ALARM = "inactivityAlarm";

// This function should be called each time the user interacts with scratch.mit.edu or with the extension.
// We consider the user inactive if it's been some minutes since this function was last called.
export function setUserAsActive() {
  chrome.alarms.clear(INACTIVITY_ALARM);
  chrome.storage.session?.set({ inactivity: false });

  chrome.alarms.create(INACTIVITY_ALARM, {
    delayInMinutes: INACTIVITY_DELAY_MINS,
  });

  handleBadgeAlarm();
}

chrome.storage.session?.get("inactivity", (o) => {
  if (o.inactivity === undefined) {
    setUserAsActive(); // Consider user active on startup
  }
});

chrome.alarms.onAlarm.addListener(async (al) => {
  if (al.name === INACTIVITY_ALARM) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true, url: "https://scratch.mit.edu/*" });
    if (tabs.length > 0) setUserAsActive();
    else {
      // Consider user inactive starting now.
      chrome.storage.session?.set({ inactivity: true });

      // Adjust other alarms to run less often until user is active again.
      handleBadgeAlarm();
    }
  }
});
