(async function () {
  const folderNames = await (await fetch("/addons/addons.json")).json();
  await scratchAddons.l10n.load(folderNames);
  const useDefault = scratchAddons.l10n.locale.startsWith("en");
  for (const folderName of folderNames) {
    if (folderName.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${folderName}/addon.json`)).json();
    for (const prop of ["name", "description", "info"]) {
      if (manifest.l10n && manifest[prop] && !useDefault) {
        let query = `${folderName}/@${prop}`;
        if (prop == "info") query += `/@${manifest[prop].id}`
        manifest[prop] = scratchAddons.l10n.get(query, {}, manifest[prop]);
      }
    }
    for (const preset of manifest.presets || []) {
      for (const prop of ["name", "description"]) {
        if (manifest.l10n && preset[prop] && !useDefault) {
          preset[prop] = scratchAddons.l10n.get(`${folderName}/@preset-${prop}-${preset.id}`, {}, preset[prop]);
        }
      }
    }
    for (const option of manifest.settings || []) {
      if (manifest.l10n && !useDefault) {
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
          },
          option.name
        );
      }
      switch (option.type) {
        case "string":
          if (manifest.l10n && !useDefault) {
            option.default = scratchAddons.l10n.get(`${folderName}/@settings-default-${option.id}`, {}, option.default);
          }
          break;
        case "select":
          option.potentialValues = option.potentialValues.map((value) => {
            if (value && value.id) {
              if (manifest.l10n && !useDefault) {
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
