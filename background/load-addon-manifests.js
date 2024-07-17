const localizeSettings = (addonId, setting, tableId) => {
  const settingId = tableId ? `${tableId}-${setting.id}` : setting.id;

  setting.name = scratchAddons.l10n.get(
    `${addonId}/@settings-name-${settingId}`,
    {
      commentIcon: "@comment.svg",
      forumIcon: "@forum.svg",
      heartIcon: "@heart.svg",
      starIcon: "@star.svg",
      followIcon: "@follow.svg",
      studioAddIcon: "@studio-add.svg",
      studioIcon: "@studio.svg",
      remixIcon: "@remix.svg",
      adminusersIcon: "@adminusers.svg",
      usersIcon: "@users.svg",
    },
    setting.name
  );

  switch (setting.type) {
    case "string":
      if (setting.default) {
        setting.default = scratchAddons.l10n.get(`${addonId}/@settings-default-${settingId}`, {}, setting.default);
      }
      break;
    case "select":
      setting.potentialValues = setting.potentialValues.map((value) => {
        value.name = scratchAddons.l10n.get(`${addonId}/@settings-select-${settingId}-${value.id}`, {}, value.name);
        return value;
      });
      break;
  }
};

(async function () {
  const forceEnglish = await new Promise((resolve) => {
    chrome.storage.local.get("forceEnglish", (obj) => {
      resolve(!!obj.forceEnglish);
    });
  });

  const addonIds = await (await fetch("/addons/addons.json")).json();
  addonIds.forEach((addonId, i) => {
    if (addonIds.lastIndexOf(addonId) !== i) throw new Error(`Duplicated value "${addonId}" in /addons/addons.json`);
  });
  const l10nCacheReq = await chrome.storage.session?.get("l10nCache").catch((err) => console.error(err));
  const l10nCache = l10nCacheReq?.l10nCache;
  if (l10nCache) {
    // No need to fetch any localization files in the background context this time,
    // the cache has everything we need. See PR #7417
    scratchAddons.l10n.loadFromCache(l10nCache);
  } else {
    await scratchAddons.l10n.load(addonIds);
  }
  const useDefault = forceEnglish || scratchAddons.l10n.locale.startsWith("en");
  const cacheReq = await chrome.storage.session?.get("manifests").catch((err) => console.error(err));
  const cache = cacheReq?.manifests;
  const newCache = {};
  for (const addonId of addonIds) {
    if (addonId.startsWith("//")) continue;
    let manifest;
    try {
      if (cache) {
        manifest = cache[addonId];
      } else {
        const file = await (await fetch(`/addons/${addonId}/addon.json`)).json();
        manifest = file;
        newCache[addonId] = JSON.parse(JSON.stringify(file));
      }
    } catch (ex) {
      console.error(`Failed to load addon manifest for ${addonId}, crashing:`, ex);
      chrome.tabs.create({
        url: chrome.runtime.getURL(`/webpages/error/index.html?problem=invalidManifest&addon=${addonId}`),
      });
      throw ex;
    }
    let potentiallyNeedsMissingDynamicWarning =
      manifest.updateUserstylesOnSettingsChange && !(manifest.dynamicEnable && manifest.dynamicDisable);
    if (!useDefault) {
      manifest._english = {};
      for (const prop of ["name", "description"]) {
        if (manifest[prop]) {
          manifest._english[prop] = manifest[prop];
          manifest[prop] = scratchAddons.l10n.get(`${addonId}/@${prop}`, {}, manifest[prop]);
        }
      }
      if (manifest.info) {
        for (const info of manifest.info || []) {
          info.text = scratchAddons.l10n.get(`${addonId}/@info-${info.id}`, {}, info.text);
        }
      }
      if (manifest.credits) {
        for (const credit of manifest.credits || []) {
          if (credit.note) credit.note = scratchAddons.l10n.get(`${addonId}/@credits-${credit.id}`, {}, credit.note);
        }
      }
      if (manifest.popup) {
        manifest.popup.name = scratchAddons.l10n.get(`${addonId}/@popup-name`, {}, manifest.popup.name);
      }
      if (manifest.latestUpdate?.temporaryNotice) {
        manifest.latestUpdate.temporaryNotice = scratchAddons.l10n.get(
          `${addonId}/@update`,
          {},
          manifest.latestUpdate.temporaryNotice
        );
      }
    }

    for (const propName of ["userscripts", "userstyles"]) {
      for (const injectable of manifest[propName] || []) {
        const { matches } = injectable;
        if (typeof matches === "string" && matches.startsWith("^")) {
          injectable._scratchDomainImplied = !matches.startsWith("^https:");
          injectable.matches = new RegExp(matches, "u");
        } else if (Array.isArray(matches)) {
          for (let i = matches.length; i--; ) {
            const match = matches[i];
            if (typeof match === "string" && match.startsWith("^")) {
              matches[i] = new RegExp(match, "u");
              matches[i]._scratchDomainImplied = !match.startsWith("^https:");
            }
          }
        }
        // Cache dependents
        // if A has addonEnabled: C
        // A's dependency is C
        // C's dependent is A
        // Only handle userstyles because userscript support is complicated
        if (propName === "userstyles") {
          if (injectable.if?.addonEnabled?.length) {
            // Convert string shortcut to Array
            // might as well remove this in the future
            if (typeof injectable.if.addonEnabled === "string") {
              injectable.if.addonEnabled = [injectable.if.addonEnabled];
            }
            for (const dependency of injectable.if.addonEnabled) {
              if (!scratchAddons.dependents[dependency]) scratchAddons.dependents[dependency] = new Set();
              scratchAddons.dependents[dependency].add(addonId);
            }
          }
          if (potentiallyNeedsMissingDynamicWarning && Object.keys(injectable.if?.settings || {}).length > 0) {
            potentiallyNeedsMissingDynamicWarning = false; // already warned
            console.warn(
              "Addon",
              addonId,
              "has updateUserstylesOnSettingsChange set to true without dynamic enable or disable.",
              "This will cause an issue as userstyle",
              injectable.url,
              "has a setting as a condition!"
            );
          }
        }
      }
    }
    if (!useDefault) {
      manifest._english = {};
      for (const prop of ["name", "description"]) {
        if (manifest[prop]) {
          manifest._english[prop] = manifest[prop];
          manifest[prop] = scratchAddons.l10n.get(`${addonId}/@${prop}`, {}, manifest[prop]);
        }
      }
      if (manifest.info) {
        for (const info of manifest.info || []) {
          info.text = scratchAddons.l10n.get(`${addonId}/@info-${info.id}`, {}, info.text);
        }
      }
      if (manifest.popup) {
        manifest.popup.name = scratchAddons.l10n.get(`${addonId}/@popup-name`, {}, manifest.popup.name);
      }

      const localizedSettings = [];

      for (const setting of manifest.settings || []) {
        localizeSettings(addonId, setting);
        if (setting.type === "string") {
          localizedSettings.push(setting.id);
        } else if (setting.type === "table") {
          const localizedRows = [];
          setting.row.forEach((row) => {
            localizeSettings(addonId, row, setting.id);
            if (row.type === "string") {
              localizedRows.push(row.id);
            }
          });
          for (let i = 0; i < (setting.default || []).length; i++) {
            const defaultValues = setting.default[i];
            for (const localizedRow of localizedRows) {
              defaultValues[localizedRow] = scratchAddons.l10n.get(
                `${addonId}/@settings-default-${setting.id}-${i}-${localizedRows}`,
                {},
                defaultValues[localizedRow]
              );
            }
          }
          for (let i = 0; i < (setting.presets || []).length; i++) {
            const preset = setting.presets[i];
            preset.name = scratchAddons.l10n.get(`${addonId}/@preset-${setting.id}-${i}`, {}, preset.name);
            for (const localizedRow of localizedRows) {
              preset.values[localizedRow] = scratchAddons.l10n.get(
                `${addonId}/@preset-value-${setting.id}-${i}-${localizedRows}`,
                {},
                preset.values[localizedRow]
              );
            }
          }
        }
      }
      for (const preset of manifest.presets || []) {
        for (const prop of ["name", "description"]) {
          if (preset[prop]) {
            preset[prop] = scratchAddons.l10n.get(`${addonId}/@preset-${prop}-${preset.id}`, {}, preset[prop]);
          }
        }
        for (const localizedSetting of localizedSettings) {
          if (typeof preset.values[localizedSetting] === "string") {
            preset.values[localizedSetting] = scratchAddons.l10n.get(
              `${addonId}/@preset-value-${preset.id}-${localizedSetting}`,
              {},
              preset.values[localizedSetting]
            );
          }
        }
      }
    }
    scratchAddons.manifests.push({ addonId, manifest });
  }
  if (!cache) {
    chrome.storage.session?.set({ manifests: newCache });
  }
  scratchAddons.localState.ready.manifests = true;
  scratchAddons.localEvents.dispatchEvent(new CustomEvent("manifestsReady"));
})();
