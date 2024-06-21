import * as MessageCache from "../libraries/common/message-cache.js";
import { notifyNewMessages } from "../addons/scratch-notifier/notifier.js";
import { onReady } from "./imports/on-ready.js";

let ready = false;
let duringBadgeUpdate = false;

const promisify =
  (callbackFn) =>
  (...args) =>
    new Promise((resolve) => callbackFn(...args, resolve));

const ALARM_NAME = "fetchMessages";
const BADGE_ALARM_NAME = "updateBadge";

/**
 * Updates the badge. Called when new messages are fetched,
 * once per minute, or when msg-count-badge settings get changed.
 * @param {string} defaultStoreId the default cookie store ID
 */
export async function updateBadge(defaultStoreId) {
  if (duringBadgeUpdate) return;
  if (!defaultStoreId) return;
  duringBadgeUpdate = true;
  if (!scratchAddons.localState.allReady) {
    // This method may be called before ready, but we need to get addon settings
    await new Promise((resolve) => scratchAddons.localEvents.addEventListener("ready", resolve, { once: true }));
  }
  const badgeSettings = scratchAddons.globalState.addonSettings["msg-count-badge"] || {};
  const isLoggedIn = scratchAddons.globalState.auth.isLoggedIn;
  let db;
  try {
    if (
      scratchAddons.localState.addonsEnabled["msg-count-badge"] &&
      (badgeSettings.showOffline || isLoggedIn) &&
      !scratchAddons.muted
    ) {
      db = await MessageCache.openDatabase();
      const count = await db.get("count", defaultStoreId);
      // Do not show 0, unless that 0 means logged out
      if (count || !isLoggedIn) {
        const color = isLoggedIn ? badgeSettings.color : "#dd2222";
        const text = isLoggedIn ? String(count) : "?";
        // The badge will show incorrect message count in other auth contexts.
        // Blocked on Chrome implementing store ID-based tab query
        await promisify(chrome.action.setBadgeBackgroundColor.bind(chrome.action))({ color });
        await promisify(chrome.action.setBadgeText.bind(chrome.action))({ text });
        return;
      }
    }
  } catch (e) {
    console.error("Error while updating badge", e);
  } finally {
    duringBadgeUpdate = false;
    if (db) await db.close();
  }
  // Hide badge when logged out and showOffline is false,
  // or when the logged-in user has no unread messages,
  // or when the addon is disabled
  await promisify(chrome.action.setBadgeText.bind(chrome.action))({ text: "" });
}

/**
 * Caches messages for the first time.
 * @param {string} defaultStoreId the default cookie store ID
 * @param {boolean} forceClear whether to force-clear cache; set to true after auth change, but not on initial startup
 */
export async function startCache(defaultStoreId, forceClear) {
  ready = false;
  await promisify(chrome.alarms.clear.bind(chrome.alarms))(ALARM_NAME);
  try {
    await MessageCache.updateMessages(
      defaultStoreId,
      forceClear,
      scratchAddons.globalState.auth.username,
      scratchAddons.globalState.auth.xToken
    );
    await updateBadge(defaultStoreId);
  } catch (e) {
    console.error("Could not fetch and update messages due to error: ", e);
  }
  ready = true;
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 5,
    periodInMinutes: 5,
  });
}

// Update badge without fetching messages
export function handleBadgeAlarm() {
  chrome.alarms.get(BADGE_ALARM_NAME, (a) => {
    const alarmExists = a !== undefined;
    const badgeAddonEnabled = scratchAddons.localState.addonsEnabled["msg-count-badge"];
    if (badgeAddonEnabled && !alarmExists) {
      chrome.alarms.create(BADGE_ALARM_NAME, {
        periodInMinutes: 1,
      });
    }
    if (!badgeAddonEnabled && alarmExists) {
      // Remove unnecessary alarm
      chrome.alarms.clear(BADGE_ALARM_NAME);
    }
  });
}
onReady(handleBadgeAlarm);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!ready) return;
  switch (alarm.name) {
    case ALARM_NAME: {
      try {
        const newMessages = await MessageCache.updateMessages(
          scratchAddons.cookieStoreId,
          false,
          scratchAddons.globalState.auth.username,
          scratchAddons.globalState.auth.xToken
        );
        await updateBadge(scratchAddons.cookieStoreId);
        if (scratchAddons.localState.addonsEnabled["scratch-notifier"]) {
          notifyNewMessages(newMessages);
        }
      } catch (e) {
        console.error("Could not fetch and update messages due to error: ", e);
      }
      break;
    }
    case BADGE_ALARM_NAME: {
      if (scratchAddons.globalState.auth.isLoggedIn) {
        const msgCountData = await MessageCache.fetchMessageCount(scratchAddons.globalState.auth.username);
        const count = await MessageCache.getUpToDateMsgCount(scratchAddons.cookieStoreId, msgCountData);
        const db = await MessageCache.openDatabase();
        try {
          // We obtained the up-to-date message count, so we can safely override the cached count in IDB.
          await db.put("count", count, scratchAddons.cookieStoreId);
          if (msgCountData.resId && !(db instanceof MessageCache.IncognitoDatabase)) {
            await db.put("count", msgCountData.resId, `${scratchAddons.cookieStoreId}_resId`);
          }
        } finally {
          await db.close();
        }
      }
      await updateBadge(scratchAddons.cookieStoreId);
    }
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.forceBadgeUpdate && message.forceBadgeUpdate.store === scratchAddons.cookieStoreId) {
    updateBadge(scratchAddons.cookieStoreId);
  }
});
