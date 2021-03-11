var storage = new Promise((resolve) => {
  chrome.storage.sync.get((result) => {
    resolve(result);
  });
});
storage = await storage;
var key;
var addonStorage = {};
for (let i = 0; i < Object.keys(storage).length; i++) {
  key = Object.keys(storage)[i].split("/");
  if (key.length == 2) {
    addonStorage[key[0]] ?? (addonStorage[key[0]] = {}); // ?? returns the preceeding value if it is not null and the following value if it is. so in this case if addonStorage[key[0]] is null, it will execute addonStorage[key[0]] = {} and return null, otherwise the value of addonStorage[key[0]]
    addonStorage[key[0]][key[1]] = Object.values(storage)[i];
  }
}
scratchAddons.globalState.addonStorage = addonStorage;

chrome.runtime.onMessageExternal.addListener((request) => {
  console.log(request);
  if (request.addonStorageID !== null) {
    chrome.storage.sync.set({
      name: request.addonStorageID,
      value: request.addonStorageValue,
    });
    var key = request.addonStorageID.split("/");
    if (key.length == 2) {
      scratchAddons.globalState.addonStorage[key[0]] ?? (scratchAddons.globalState.addonStorage[key[0]] = {});
      scratchAddons.globalState.addonStorage[key[0]][key[1]] = request.addonStorageValue;
    }
  }
});
