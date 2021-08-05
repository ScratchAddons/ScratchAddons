// Intent system allows content scripts to verify that
// an URL was navigated from us, not other websites,
// without using unreliable methods such as referrer or opener.

const intents = new Map();
const EXPIRY_MS = 30000;

const createIntent = (data) => {
  const key = crypto.getRandomValues(new Uint32Array(4));
  const stringKey = Array.prototype.join.call(key, "-");
  intents.set(stringKey, {
    timestamp: Date.now(),
    value: data,
  });
  return stringKey;
};

scratchAddons.createIntents = (intents) => intents.map(createIntent);

const consumeIntent = (stringKey) => {
  const intent = intents.get(stringKey);
  // This is no-op when it is undefined and
  // otherwise prevents intents from being re-used.
  intents.delete(stringKey);
  if (typeof intent === "undefined" || Date.now() - intent.timestamp > EXPIRY_MS) {
    return null;
  }
  return intent.value;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (Array.isArray(request?.createIntents)) {
    sendResponse(request.createIntents.map(createIntent));
    return;
  } else if (Array.isArray(request?.consumeIntents)) {
    sendResponse(request.consumeIntents.map(consumeIntent).filter(Boolean));
    return;
  }
});

chrome.alarms.create("cleanIntents", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanIntents") {
    intents.forEach((obj, key) => {
      const currentTimestamp = Date.now();
      const objTimestamp = obj.timestamp;
      if (currentTimestamp - objTimestamp > 45000) {
        intents.delete(key);
      }
    });
  }
});
