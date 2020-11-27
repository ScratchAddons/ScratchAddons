(async function () {
  const folderNames = await (await fetch("/addons/addons.json")).json();
  await scratchAddons.l10n.load(folderNames);
  const useDefault = scratchAddons.l10n.locale.startsWith("en");
  for (const folderName of folderNames) {
    if (folderName.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${folderName}/addon.json`)).json();
    for (const prop of ["name", "description", "notice", "warning"]) {
      if (manifest.l10n && manifest[prop] && !useDefault) {
        manifest[prop] = scratchAddons.l10n.get(`${folderName}/@${prop}`);
      }
    }
    for (const preset of manifest.presets || []) {
      for (const prop of ["name", "description"]) {
        if (manifest.l10n && preset[prop] && !useDefault) {
          preset[prop] = scratchAddons.l10n.get(`${folderName}/@preset-${prop}-${preset.id}`);
        }
      }
    }
    for (const option of manifest.settings || []) {
      if (manifest.l10n && !useDefault) {
        option.name = scratchAddons.l10n.get(`${folderName}/@settings-name-${option.id}`, {
          commentIcon: "@comment.svg",
          forumIcon: "@forum.svg",
          heartIcon: "@heart.svg",
          starIcon: "@star.svg",
          followIcon: "@follow.svg",
          studioAddIcon: "@studio-add.svg",
          studioIcon: "@studio.svg",
          remixIcon: "@remix.svg",
        });
      }
      switch (option.type) {
        case "string":
          if (manifest.l10n && !useDefault) {
            option.default = scratchAddons.l10n.get(`${folderName}/@settings-default-${option.id}`);
          }
          break;
        case "select":
          option.potentialValues = option.potentialValues.map((value) => {
            if (value && value.id) {
              if (manifest.l10n && !useDefault) {
                value.name = scratchAddons.l10n.get(`${folderName}/@settings-select-${option.id}-${value.id}`);
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
