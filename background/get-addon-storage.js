// Initialize scratchAddons.globalState.addonStorage from chrome.storage
// get from chrome.storage.sync
var storage = new Promise((resolve) => {
  chrome.storage.sync.get((result) => {
    resolve(result);
  });
});
scratchAddons.globalState.addonStorage.sync = init(await storage);

// get from chrome.storage.local
storage = new Promise((resolve) => {
  chrome.storage.local.get((result) => {
    resolve(result);
  });
});
scratchAddons.globalState.addonStorage.local = init(await storage);

// get from cookies
storage = new Promise((resolve) => {
  chrome.cookies.getAll({
    url: 'https://scratch.mit.edu'
  }, (result) => {
    resolve(result);
  });
});
storage = await storage;
scratchAddons.globalState.addonStorage.cookie = init(Object.fromEntries(storage.map(c => [c.name, c.value])));

// Setting values
chrome.runtime.onMessageExternal.addListener(async (request) => {
  if (request.addonStorageID !== null) {
    var key = request.addonStorageID.split("/"); // seperate key into stored ID and addon ID
    if (key.length == 2) {
      // the stuff that matters: set the value
      await new Promise((resolve) => {
        chrome.storage[request.addonStorageMode].set({
          name: request.addonStorageID,
          value: request.addonStorageValue,
        }, (result) => {
          resolve(result);
        }); // set it in chrome.storage
      });
      scratchAddons.globalState.addonStorage[request.addonStorageMode][key[0]] ?? (scratchAddons.globalState.addonStorage[request.addonStorageMode][key[0]] = {}); // just in case the addon has not had any other stored values before
      scratchAddons.globalState.addonStorage[request.addonStorageMode][key[0]][key[1]] = request.addonStorageValue; // set in scratchAddons.globalStagte.addonStorage
    } else {
      throw new Error("Scratch Addons exception: key must contain no /, excluding the stored ID and addon ID joiner");
    }
  } else {
    throw new Error("Scratch Addons exception: No key specified");
  }
});


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
  return addonStorage
}
