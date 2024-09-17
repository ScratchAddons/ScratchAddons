/* global chrome */
import { updateBadge } from "../../background/message-cache.js";
import { markAsRead } from "../../libraries/common/message-cache.js";
import createNotification from "../../libraries/common/notification-util.js";
import commentEmojis from "./comment-emojis.js";

const emojis = {
  addcomment: "comment",
  forumpost: "forum",
  loveproject: "heart",
  favoriteproject: "star",
  followuser: "follow",
  curatorinvite: "studio-add",
  remixproject: "remix",
  studioactivity: "studio",
  becomeownerstudio: "adminusers",
  becomehoststudio: "users",
};

function openDatabase() {
  return idb.openDB("notifier", 1, {
    upgrade(d) {
      d.createObjectStore("urls");
    },
  });
}

export async function purgeDatabase() {
  const db = await openDatabase();
  try {
    await db.clear("urls");
  } finally {
    await db.close();
  }
}

// Call in try-finally
async function cleanupDatabase(db) {
  const tx = db.transaction("urls", "readwrite");
  const items = await tx.store.getAllKeys();
  for (const key of items) {
    const time = Number(key.match(/\w+__(\d+)/)[1]);
    if (time + 3 * 24 * 60 * 60 * 1000 < Date.now()) {
      await tx.store.delete(key);
    }
  }
  await tx.done;
}

async function notifyMessage({
  emoji,
  messageType,
  actor,
  fragment,
  commentee,
  commentUrl,
  title,
  element_id,
  parent_title,
  admin_actor,
}) {
  const msg = (key, params) => scratchAddons.l10n.get(`scratch-notifier/${key}`, params, `scratch-messaging/${key}`);
  const settings = scratchAddons.globalState.addonSettings["scratch-notifier"] || {};
  let text = "";
  let url;
  if (messageType.startsWith("addcomment/")) {
    url = commentUrl;
    if (title.length > 20) title = `${title.substring(0, 17).trimEnd()}...`;
    var notificationTitle;
    switch (messageType.split("/")[1]) {
      case "ownProjectNewComment":
        notificationTitle = msg("notif-own-project", { actor, title });
        text = fragment;
        break;
      case "projectReplyToSelf":
        notificationTitle = msg("notif-project-reply", { actor, title });
        text = fragment;
        break;
      case "ownProjectReplyToOther":
        notificationTitle = msg("notif-own-project-reply", { actor, commentee, title });
        text = fragment;
        break;
      case "ownProfileNewComment":
        notificationTitle = msg("notif-profile", { actor });
        text = fragment;
        break;
      case "ownProfileReplyToSelf":
        notificationTitle = msg("notif-own-profile-reply", { actor });
        text = fragment;
        break;
      case "ownProfileReplyToOther":
        notificationTitle = msg("notif-own-profile-reply-other", { actor, commentee });
        text = fragment;
        break;
      case "otherProfileReplyToSelf":
        notificationTitle = msg("notif-profile-reply", { actor, title });
        text = fragment;
        break;
      case "studio":
        notificationTitle = msg("notif-studio-reply", { actor, title });
        text = fragment;
        break;
      default:
        notificationTitle = msg("notif-comment");
        break;
    }
  } else {
    switch (messageType) {
      case "forumpost":
        notificationTitle = msg("notif-forum", { title });
        url = `https://scratch.mit.edu/discuss/topic/${element_id}/unread/`;
        break;
      case "loveproject":
        notificationTitle = msg("notif-love", { actor, title });
        url = `https://scratch.mit.edu/users/${actor}/`;
        break;
      case "favoriteproject":
        notificationTitle = msg("notif-fav", { actor, title });
        url = `https://scratch.mit.edu/users/${actor}/`;
        break;
      case "followuser":
        notificationTitle = msg("notif-follow", { actor });
        url = `https://scratch.mit.edu/users/${actor}/`;
        break;
      case "curatorinvite":
        notificationTitle = msg("notif-invite", { actor, title });
        url = `https://scratch.mit.edu/studios/${element_id}/curators/`;
        break;
      case "becomeownerstudio":
        notificationTitle = msg("notif-promotion", { actor, title });
        url = `https://scratch.mit.edu/studios/${element_id}/curators/`;
        break;
      case "becomehoststudio":
        notificationTitle = msg("notif-host", { actor: admin_actor ? msg("st") : actor, title });
        url = `https://scratch.mit.edu/studios/${element_id}/`;
        break;
      case "remixproject":
        notificationTitle = msg("notif-remix", { actor, parent_title, title });
        url = `https://scratch.mit.edu/projects/${element_id}/`;
        break;
      case "studioactivity":
        notificationTitle = msg("notif-studio", { title });
        url = `https://scratch.mit.edu/studios/${element_id}/activity`;
        break;
      default:
        notificationTitle = msg("notif-generic");
        break;
    }
  }

  const soundSetting = settings.notification_sound;

  const notifId = await createNotification({
    base: "notifier",
    type: "basic",
    title: notificationTitle,
    iconUrl: emoji ? `../../images/icons/${emoji}.svg` : "/images/icon.png",
    message: text,
    buttons: [
      {
        title: msg("open"),
      },
      {
        title: msg("clear"),
      },
    ],
    silent: soundSetting === "system-default" ? false : true,
  });
  if (!notifId) return;
  const db = await openDatabase();
  try {
    await db.put("urls", url, notifId);
  } finally {
    await db.close();
  }
}

const registerHandler = () => {
  chrome.notifications.onClicked.addListener(async (notifId) => {
    if (!notifId.startsWith("notifier")) return;
    chrome.notifications.clear(notifId);
    if (scratchAddons.globalState.addonSettings["scratch-notifier"]?.mark_as_read_when_clicked === true) {
      try {
        await markAsRead(scratchAddons.globalState.auth.csrfToken);
        updateBadge(scratchAddons.cookieStoreId);
      } catch (e) {
        console.error("Marking message as read failed:", e);
      }
    }
    const db = await openDatabase();
    try {
      const url = await db.get("urls", notifId);
      if (url) chrome.tabs.create({ url });
      await cleanupDatabase(db);
      await db.delete("urls", notifId);
    } finally {
      await db.close();
    }
  });

  chrome.notifications.onButtonClicked.addListener(async (notifId, buttonIndex) => {
    if (!notifId.startsWith("notifier")) return;
    chrome.notifications.clear(notifId);
    if (buttonIndex === 0) openMessagesPage();
    else {
      try {
        await markAsRead(scratchAddons.globalState.auth.csrfToken);
        updateBadge(scratchAddons.cookieStoreId);
      } catch (e) {
        console.error("Marking message as read failed:", e);
      }
    }
    const db = await openDatabase();
    try {
      await cleanupDatabase(db);
      await db.delete("urls", notifId);
    } finally {
      await db.close();
    }
  });

  chrome.notifications.onClosed.addListener(async (notifId) => {
    if (!notifId.startsWith("notifier")) return;
    const db = await openDatabase();
    try {
      await cleanupDatabase(db);
      await db.delete("urls", notifId);
    } finally {
      await db.close();
    }
  });
};
// chrome.notifications is only available if permission is granted.
if (chrome.notifications) registerHandler();
else {
  chrome.permissions.onAdded.addListener((permissions) => {
    if (permissions.permissions?.includes("notifications")) registerHandler();
  });
}

async function openMessagesPage() {
  chrome.tabs.query(
    {
      url: "https://scratch.mit.edu/messages*",
    },
    (tabs) => {
      if (tabs[0]) {
        chrome.windows.update(tabs[0].windowId, {
          focused: true,
        });
        chrome.tabs.update(tabs[0].id, {
          active: true,
          url: "https://scratch.mit.edu/messages/",
        });
      } else {
        chrome.tabs.create({
          url: "https://scratch.mit.edu/messages/",
        });
      }
      updateBadge(scratchAddons.cookieStoreId);
    }
  );
}

export function notifyNewMessages(messages) {
  const settings = scratchAddons.globalState.addonSettings["scratch-notifier"] || {};
  const username = scratchAddons.globalState.auth.username;
  if (messages === null || messages.length === 0 || scratchAddons.muted) return;
  messages = messages.slice(0, 20);
  let anyNotified = false;
  for (const message of messages) {
    let messageType = message.type;
    let commentUrl;
    if (message.type === "addcomment") {
      messageType += "/";
      if (message.comment_type === 0) {
        // Project comment
        const replyFor = message.commentee_username;
        if (replyFor === null) messageType += "ownProjectNewComment";
        else if (replyFor === username) messageType += "projectReplyToSelf";
        else messageType += "ownProjectReplyToOther";
        commentUrl = `https://scratch.mit.edu/projects/${message.comment_obj_id}/#comments-${message.comment_id}`;
      } else if (message.comment_type === 1) {
        const profile = message.comment_obj_title;
        const replyFor = message.commentee_username;
        if (profile === username) {
          if (replyFor === null) messageType += "ownProfileNewComment";
          else if (replyFor === username) messageType += "ownProfileReplyToSelf";
          else messageType += "ownProfileReplyToOther";
        } else {
          messageType += "otherProfileReplyToSelf";
        }
        commentUrl = `https://scratch.mit.edu/users/${message.comment_obj_title}/#comments-${message.comment_id}`;
      } else if (message.comment_type === 2) {
        messageType += "studio";
        commentUrl = `https://scratch.mit.edu/studios/${message.comment_obj_id}/comments/#comments-${message.comment_id}`;
      }
    }

    // Return if this notification type is muted
    if (message.type === "addcomment") {
      if (messageType === "addcomment/ownProjectNewComment" || messageType === "addcomment/ownProjectReplyToOther") {
        if (settings.commentsonmyprojects_notifications === false) continue;
      } else {
        if (settings.commentsforme_notifications === false) continue;
      }
    } else {
      try {
        if (settings[`${message.type}_notifications`] === false) continue;
      } catch {
        // If setting doesn't exist
        console.warn(`Unexpected message type: ${message.type}`);
        continue;
      }
    }

    const messageInfo = {
      emoji: emojis[message.type],
      messageType,
      actor: message.actor_username,
      admin_actor: message.admin_actor || false, // Host transfer only
      fragment: htmlToText(message.comment_fragment), // Comments only
      commentee: message.commentee_username, // Comments only
      commentUrl, // Comments only
      title:
        message.comment_obj_title ||
        message.topic_title ||
        message.title ||
        message.project_title ||
        message.gallery_title,
      element_id: message.comment_id || message.gallery_id || message.project_id || message.topic_id,
      parent_title: message.parent_title, // Remixes only
    };
    if (!anyNotified && settings.notification_sound === "addons-ping") {
      // Note: no audio playback in service worker (Chrome)
      // https://github.com/ScratchAddons/ScratchAddons/issues/3877
      if (globalThis.Audio) {
        // Firefox only
        new Audio(chrome.runtime.getURL("./addons/scratch-notifier/ping.mp3")).play();
      }
    }
    // Play the sound only once
    anyNotified = true;
    notifyMessage(messageInfo);
  }
}

// Popups might fetch new messages.
// They will send the notifier the new messages, where we can send notifications.
chrome.runtime.onMessage.addListener((message) => {
  if (
    scratchAddons.localState.addonsEnabled["scratch-notifier"] &&
    message?.notifyNewMessages &&
    message.notifyNewMessages.store === scratchAddons.cookieStoreId
  ) {
    notifyNewMessages(message.notifyNewMessages.messages);
  }
});

function htmlToText(html) {
  // Note: this function does not sanitize HTML. The return value of this function
  // is shown in plain text format, as part of the notification body.
  if (!globalThis.document) {
    // Service worker context (Chromium)
    return html;
  }
  if (html === undefined) return;
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  let value = txt.value;
  const matches = value.match(/<img([\w\W]+?)[\/]?>/g);
  if (matches) {
    for (const match of matches) {
      const src = match.match(/\<img.+src\=(?:\"|\')(.+?)(?:\"|\')(?:.+?)\>/)[1];
      const splitString = src.split("/");
      const imageName = splitString[splitString.length - 1];
      if (commentEmojis[imageName]) {
        value = value.replace(match, commentEmojis[imageName]);
      }
    }
  }
  value = value.replace(/<[^>]*>?/gm, ""); // Remove remaining HTML tags
  value = value.replace(/\n/g, " ").trim(); // Remove newlines
  if (html.length === 250) value += "..."; // Add ellipsis if shortened
  return value;
}
