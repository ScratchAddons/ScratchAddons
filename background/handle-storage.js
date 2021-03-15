export const promisify = (callbackFn) => (...args) => new Promise((resolve) => callbackFn(...args, resolve));
const storageGet = async (mode) => {
  return await promisify(chrome.storage[mode].get.bind(chrome.storage[mode]))(null);
};
const storageSet = async (id, value, mode) => {
  return await promisify(chrome.storage[mode].set.bind(chrome.storage[mode]))(Object.fromEntries([[id, value]]));
};
const cookieGet = async () => {
  return Object.fromEntries(
    (
      await promisify(chrome.cookies.getAll)({
        url: "https://scratch.mit.edu",
      })
    ).map((c) => [c.name, c.value])
  );
};
const cookieSet = async (name, value) => {
  return await promisify(chrome.cookies.set.bind(chrome.cookies))({
    url: "https://scratch.mit.edu",
    name: name,
    secure: false,
    expirationDate: 2147483647,
    value: value,
  });
};
if (typeof scratchAddons !== "undefined") {
  // Initialize scratchAddons.globalState.addonStorage from chrome.storage
  // get from chrome.storage.sync
  scratchAddons.globalState.addonStorage.sync = init(await storageGet("sync"));

  // get from chrome.storage.local
  scratchAddons.globalState.addonStorage.local = init(await storageGet("local"));

  // get from cookies
  scratchAddons.globalState.addonStorage.cookie = init(await cookieGet());

  // Setting values
  chrome.runtime.onMessageExternal.addListener(async (request, _, sendResponse) => {
    sendResponse(await setStorage(request, sendResponse));
  });
}
export async function setStorage(request) {
  // the stuff that matters: set the value
  // it needs to be here because the event handler does not have access to chrome.storage in userscripts
  var id = request.addonStorageID;
  var mode = request.addonStorageMode;
  var value = request.addonStorageValue;
  var key = id.split("/"); // seperate key into stored ID and addon ID
  var storage = scratchAddons.globalState.addonStorage[mode];
  storage[key[0]] ?? (storage[key[0]] = {}); // just in case the addon has not had any other stored values before
  storage[key[0]][key[1]] = value; // set in scratchAddons.globalStagte.addonStorage
  scratchAddons.globalState.addonStorage[mode] = storage;
  await (mode == "cookie" ? cookieSet(id, value) : storageSet(id, value, mode)); // set it in chrome.storage/document.cookie
  return {
    name: id,
    value: value,
    mode: mode,
  };
}

function init(storage) {
  // turn storage from an object to an array of arrays
  var key;
  var addonStorage = {};
  for (let i = 0; i < Object.keys(storage).length; i++) {
    key = Object.keys(storage)[i].split("/");
    if (key.length == 2) {
      addonStorage[key[0]] ?? (addonStorage[key[0]] = {}); // ?? returns the preceeding value if it is not null and the following value if it is. so in this case if addonStorage[key[0]] is null, it will execute addonStorage[key[0]] = {} and return null, otherwise the value of addonStorage[key[0]]
      addonStorage[key[0]][key[1]] = Object.values(storage)[i];
    }
  }
  return addonStorage;
}
