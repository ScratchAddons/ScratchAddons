const createAddonStorageObj = () => ({
  sync: {},
  local: {},
});

const _storageState = {};

const promisify =
  (func) =>
  (...args) =>
    new Promise((resolve) => func(...args, resolve));

const saveSync = async () => {
  const syncStorage = Object.fromEntries(Object.entries(_storageState).map(([addonID, { sync }]) => [addonID, sync]));
  await promisify(chrome.storage.sync.set.bind(chrome.storage.sync))({
    addonStorage: syncStorage,
  });
};
const saveLocal = async () => {
  const localStorage = Object.fromEntries(
    Object.entries(_storageState).map(([addonID, { local }]) => [addonID, local])
  );
  await promisify(chrome.storage.local.set.bind(chrome.storage.local))({
    addonStorage: localStorage,
  });
};

const saveAddonStorage = async () => {
  await saveSync();
  await saveLocal();
};

const loadAddonStorage = async () => {
  const { addonStorage: syncData } = await promisify(chrome.storage.sync.get.bind(chrome.storage.sync))("addonStorage");
  const { addonStorage: localData } = await promisify(chrome.storage.local.get.bind(chrome.storage.local))(
    "addonStorage"
  );

  console.debug(syncData, localData);

  for (const addonID of [...Object.keys(syncData), ...Object.keys(localData)]) {
    if (!(addonID in _storageState)) _storageState[addonID] = createAddonStorageObj();
  }

  for (const [addonID, sync] of Object.entries(syncData)) {
    _storageState[addonID].sync = sync;
  }
  for (const [addonID, local] of Object.entries(localData)) {
    _storageState[addonID].local = local;

    messageForAllTabs({
      fireEvent: {
        target: "storage",
        name: "load",
      },
    });
  }
};

// Will throw if `addonStorage` has not been set yet, but that's fine.
loadAddonStorage().catch();

function messageForAllTabs(message) {
  chrome.tabs.query({}, (tabs) =>
    tabs.forEach((tab) => tab.url && chrome.tabs.sendMessage(tab.id, message, () => void chrome.runtime.lastError))
  );
  scratchAddons.sendToPopups(message);
}

function stateChange(addonId, sync = null) {
  messageForAllTabs({
    fireEvent: {
      target: "storage",
      name: "change",
      addonId,
    },
  });

  if (typeof sync === "boolean") {
    console.debug(sync);
    messageForAllTabs({
      fireEvent: {
        target: sync ? "storage_sync" : "storage_local",
        name: "change",
        addonId,
      },
    });
  }
}

chrome.runtime.onMessage.addListener((req, s, res) => {
  if (req.updateAddonStorage) {
    const { addonID, prop, value, sync } = req.updateAddonStorage;
    if (!(addonID in _storageState)) _storageState[addonID] = createAddonStorageObj();
    _storageState[addonID][sync ? "sync" : "local"][prop] = value;
    if (sync) {
      saveSync();
    } else {
      saveLocal();
    }
    stateChange(addonID, sync);
    res();
  } else if (req.getFromAddonStorage) {
    const { addonID, prop, sync } = req.getFromAddonStorage;
    if (!(addonID in _storageState)) _storageState[addonID] = createAddonStorageObj();
    res(_storageState[addonID][sync ? "sync" : "local"][prop]);
  }
});
