(async function () {
  const folderNames = await (await fetch("/addons/addons.json")).json();
  folderNames.forEach((addonId, i) => {
    if (folderNames.lastIndexOf(addonId) !== i) throw "Duplicated value in /addons/addons.json";
  });
  await scratchAddons.l10n.load(folderNames);
  const useDefault = scratchAddons.l10n.locale.startsWith("en");
  for (const folderName of folderNames) {
    if (folderName.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${folderName}/addon.json`)).json();
    if (!useDefault) {
      manifest._english = {};
      for (const prop of ["name", "description"]) {
        if (manifest[prop]) {
          manifest._english[prop] = manifest[prop];
          manifest[prop] = scratchAddons.l10n.get(`${folderName}/@${prop}`, {}, manifest[prop]);
        }
      }
      if (manifest.info) {
        for (const info of manifest.info || []) {
          info.text = scratchAddons.l10n.get(`${folderName}/@info-${info.id}`, {}, info.text);
        }
      }
      if (manifest.popup) {
        manifest.popup.name = scratchAddons.l10n.get(`${folderName}/@popup-name`, {}, manifest.popup.name);
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
      }
    }

    for (const preset of manifest.presets || []) {
      for (const prop of ["name", "description"]) {
        if (preset[prop] && !useDefault) {
          preset[prop] = scratchAddons.l10n.get(`${folderName}/@preset-${prop}-${preset.id}`, {}, preset[prop]);
        }
      }
    }
    for (const option of manifest.settings || []) {
      if (!useDefault) {
        option.name = scratchAddons.l10n.get(
          `${folderName}/@settings-name-${option.id}`,
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
          option.name
        );
      }
      switch (option.type) {
        case "string":
          if (!useDefault) {
            option.default = scratchAddons.l10n.get(`${folderName}/@settings-default-${option.id}`, {}, option.default);
          }
          break;
        case "select":
          option.potentialValues = option.potentialValues.map((value) => {
            if (value && value.id) {
              if (!useDefault) {
                value.name = scratchAddons.l10n.get(
                  `${folderName}/@settings-select-${option.id}-${value.id}`,
                  {},
                  value.name
                );
              }
              return value;
            }
            return { name: value, id: value };
          });
          break;
      }
    }
    scratchAddons.manifests.push({ addonId: folderName, manifest });
  }
  scratchAddons.localState.ready.manifests = true;
  scratchAddons.localEvents.dispatchEvent(new CustomEvent("manifestsReady"));
})();
