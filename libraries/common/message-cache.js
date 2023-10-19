export class HTTPError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }

  static fromResponse(message, resp) {
    return new HTTPError(`${message}: status ${resp.status}`, resp.status);
  }
}

class IncognitoTransaction {
  constructor(db, stores) {
    this.db = db;
    this.stores = stores;
  }

  objectStore(name) {
    return {
      put: (value) => this.db.put(name, value),
    };
  }

  get done() {
    return null;
  }
}

export class IncognitoDatabase {
  constructor() {
    this.messages = [];
    this.msgCount = 0;
  }
  get(name) {
    switch (name) {
      case "cache":
        return this.messages.slice();
      case "count":
        return this.msgCount;
    }
  }

  put(name, value) {
    switch (name) {
      case "cache": {
        this.messages = value;
        return;
      }
      case "count": {
        this.msgCount = value;
        return;
      }
    }
  }

  close() {}

  transaction(stores) {
    return new IncognitoTransaction(this, stores);
  }

  static isIncognito() {
    // This API is not deprecated
    return chrome.extension.inIncognitoContext;
  }
}

const incognitoDatabase = new IncognitoDatabase();

/**
 * Fetches the message count from the API.
 * Errors are silenced.
 * @param {string} username the username
 * @returns {number} the message count, or 0 if it errors
 */
export async function fetchMessageCount(username, options) {
  const bypassCache = options ? Boolean(options.bypassCache) : false;
  const url = `https://api.scratch.mit.edu/users/${username}/messages/count${
    !bypassCache ? "" : `?addons_bypass_cache_after_marking_read=1`
  }`;
  const fetchOptions = {
    credentials: "omit", // No need to send cookies, this is a public endpoint
    cache: bypassCache ? "reload" : "default",
  };
  const resp = await fetch(url, fetchOptions);
  const json = await resp.json();

  const resId = bypassCache ? null : resp.headers.get("X-Amz-Cf-Id");

  return { count: json.count || 0, resId };
}

/**
 * Fetches the messages, maximum 40 at a time.
 * @param {string} username the username
 * @param {string} xToken the X-Token value
 * @param {number} offset the offset; 0 for latest
 * @returns {object[]} the messages
 * @throws {HTTPError} when fetching fails
 */
export async function fetchMessages(username, xToken, offset) {
  const resp = await fetch(`https://api.scratch.mit.edu/users/${username}/messages?limit=40&offset=${offset}`, {
    headers: {
      "x-token": xToken,
    },
  });
  if (!resp.ok) {
    if (resp.status === 404) return [];
    throw HTTPError.fromResponse(`Fetching message offset ${offset} for ${username} failed`, resp);
  }
  return resp.json();
}

/**
 * Opens a messaging cache database.
 * Callers must close this in try-finally block.
 */
export async function openDatabase() {
  if (IncognitoDatabase.isIncognito()) return incognitoDatabase;

  const DB_VERSION = 1; // It's preferred to keep it as 1 when possible

  return idb.openDB("messaging", DB_VERSION, {
    upgrade(d) {
      d.createObjectStore("cache");
      d.createObjectStore("lastUpdated");
      d.createObjectStore("count");
    },
  });
}

/**
 * Opens a message cache database, and clears if necessary.
 * Cache is cleared for the first time the database was created,
 * and if the cache is more than 1 hour old.
 * To force clear cache (after an reauth, for example) set forceClear to true.
 * @param {string} cookieStoreId the cookie store ID for the cache
 * @param {boolean} forceClear whether to force clear the cache
 */
export async function openMessageCache(cookieStoreId, forceClear) {
  const db = await openDatabase();
  if (db instanceof IncognitoDatabase) return;

  try {
    const tx = await db.transaction(["cache", "lastUpdated", "count"], "readwrite");
    const lastUpdated = await tx.objectStore("lastUpdated").get(cookieStoreId);
    if (lastUpdated === undefined || forceClear || lastUpdated + 12 * 60 * 60 * 1000 < Date.now()) {
      // Clear items last updated more than 1 hour ago
      await tx.objectStore("cache").put([], cookieStoreId);
      await tx.objectStore("count").put(0, cookieStoreId);
      await tx.objectStore("count").put(null, `${cookieStoreId}_resId`);
      // lastUpdated is only set when actually fetching
    }
    await tx.done;
  } finally {
    await db.close();
  }
}

/**
 * Fetches new messages, updates the message cache and returns new messages.
 * Callers may use the returned value for notification, etc.
 * This method fetches unread messages and a page of extra messages
 * up to 25 pages in total. For example, if the user has no unread messages, it'll fetch
 * 1 page, and if they have 1 unread messages, it'll fetch 2 pages. If the user has more than
 * 960 unread messages, it'll only fetch the latest 25 pages.
 * By default, this method only fetches new messages and keeps old data from cache,
 * up to 1000 messages. To force clear them and fetch new ones, set forceClear to true.
 * Fetched data is then stored to the cache, keyed by the cookie store ID.
 * If the cache size exceeds 1000, only new 1000 items will be kept.
 * @param {string} cookieStoreId the cookie store ID for the cache
 * @param {boolean} forceClear whether to force clear the cache before fetching
 * @param {string} username the username
 * @param {string} xToken the X-Token value
 * @returns {object[]} new messages
 * @throws {HTTPError} if fetching fails
 */
export async function updateMessages(cookieStoreId, forceClear, username, xToken) {
  await openMessageCache(cookieStoreId, forceClear);
  if (username === null) return [];
  const msgCountData = await fetchMessageCount(username);
  const messageCount = await getUpToDateMsgCount(cookieStoreId, msgCountData);
  const maxPages = Math.min(Math.ceil(messageCount / 40) + 1, 25);
  const db = await openDatabase();
  try {
    const messages = await db.get("cache", cookieStoreId);
    const firstTimestamp = messages[0] ? new Date(messages[0].datetime_created).getTime() : 0;
    const newlyAdded = [];
    const knownIds = new Set();
    fetching: for (let i = 0; i < maxPages; i++) {
      const pageMessages = await fetchMessages(username, xToken, i * 40);
      for (const pageMessage of pageMessages) {
        if (new Date(pageMessage.datetime_created).getTime() <= firstTimestamp) break fetching;
        if (knownIds.has(pageMessage.id)) continue;
        newlyAdded.push(pageMessage);
        knownIds.add(pageMessage.id);
      }
    }
    // [1, 2, 3].unshift(4, 5) => [4, 5, 1, 2, 3]
    messages.unshift(...newlyAdded);
    // Cap the cache size at maxPages * 40
    messages.length = Math.min(messages.length, maxPages * 40);
    // Only notify actual new messages, since the cache invalidation may occur
    newlyAdded.length = Math.min(newlyAdded.length, messageCount);
    const tx = await db.transaction(["cache", "lastUpdated", "count"], "readwrite");
    await tx.objectStore("cache").put(messages, cookieStoreId);
    await tx.objectStore("lastUpdated").put(Date.now(), cookieStoreId);
    await tx.objectStore("count").put(messageCount, cookieStoreId);
    if (msgCountData.resId && !(db instanceof IncognitoDatabase)) {
      await tx.objectStore("count").put(msgCountData.resId, `${cookieStoreId}_resId`);
    }
    await tx.done;
    return newlyAdded;
  } finally {
    await db.close();
  }
}

/**
 * Returns either the received message count or the one in IDB, based on which one is more recent
 * @param {string} cookieStoreId the cookie store ID for the IDB cache
 * @param {object} msgCountData the return value from fetchMessageCount()
 * @returns {number} the most up-to-date message count, possibly identical to the received parameter
 */
export async function getUpToDateMsgCount(cookieStoreId, { count: responseMsgCount, resId }) {
  const db = await openDatabase();
  if (db instanceof IncognitoDatabase) return responseMsgCount;
  try {
    const lastResId = await db.get("count", `${cookieStoreId}_resId`);
    if (lastResId && lastResId === resId) {
      // Since `lastResId` is not null, we know we have a message count in IDB we can use.
      // In some cases, the message count in IDB will be more up-to-date. In other cases,
      // it will simply match the message count of this response, leading to the same result.
      console.log("Ignored network-cached response for message count endpoint.");
      const idbCount = await db.get("count", cookieStoreId);
      return idbCount;
    } else {
      return responseMsgCount;
    }
  } catch (err) {
    console.error(err);
    return responseMsgCount;
  } finally {
    await db.close();
  }
}

/**
 * Marks messages as read.
 * @param {string} csrfToken the CSRF token for requesting
 * @throws {HTTPError} if operation fails
 */
export function markAsRead(csrfToken) {
  return fetch("https://scratch.mit.edu/site-api/messages/messages-clear/?sareferer", {
    method: "POST",
    headers: { "x-csrftoken": csrfToken, "x-requested-with": "XMLHttpRequest" },
  }).then((res) => {
    if (!res.ok) throw HTTPError.fromResponse("Marking messages as read failed: ", res);
  });
}
