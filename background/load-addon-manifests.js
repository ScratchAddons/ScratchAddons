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
  const addonIds = await (await fetch("/addons/addons.json")).json();
  addonIds.forEach((addonId, i) => {
    if (addonIds.lastIndexOf(addonId) !== i) throw new Error(`Duplicated value "${addonId}" in /addons/addons.json`);
  });
  await scratchAddons.l10n.load(addonIds);
  const useDefault = scratchAddons.l10n.locale.startsWith("en");
  for (const addonId of addonIds) {
    if (addonId.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${addonId}/addon.json`)).json();
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
          const localizedRows = {};
          setting.row.forEach((row, i) => {
            localizeSettings(addonId, row, setting.id);
            if (row.type === "string") {
              localizedRows[i] = row.id;
            }
          });
          for (let i = 0; i < (setting.default || []).length; i++) {
            const defaultValues = setting.default[i];
            for (let j = 0; j < defaultValues.length; j++) {
              if (localizedRows[j]) {
                defaultValues[j] = scratchAddons.l10n.get(
                  `${addonId}/@settings-default-${setting.id}-${i}-${localizedRows[j]}`,
                  {},
                  defaultValues[j]
                );
              }
            }
          }
          for (let i = 0; i < (setting.presets || []).length; i++) {
            const preset = setting.presets[i];
            preset.name = scratchAddons.l10n.get(`${addonId}/@preset-${setting.id}-${i}`, {}, preset.name);
            for (let j = 0; j < preset.values.length; j++) {
              if (localizedRows[j]) {
                preset.values[j] = scratchAddons.l10n.get(
                  `${addonId}/@preset-value-${setting.id}-${i}-${localizedRows[j]}`,
                  {},
                  preset.values[j]
                );
              }
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
          if (typeof preset.values[localizedSettings] === "string") {
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
  scratchAddons.localState.ready.manifests = true;
  scratchAddons.localEvents.dispatchEvent(new CustomEvent("manifestsReady"));
})();
