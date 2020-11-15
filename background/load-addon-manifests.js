(async function () {
  const folderNames = await (await fetch("/addons/addons.json")).json();
  await scratchAddons.l10n.load(folderNames);
  for (const folderName of folderNames) {
    if (folderName.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${folderName}/addon.json`)).json();
    for (const prop of ["name", "description", "notice", "warning"]) {
      if (manifest[prop] === null) {
        manifest[prop] = scratchAddons.l10n.get(`${folderName}/@${prop}`);
      }
    }
    for (const preset of manifest.presets || []) {
      for (const prop of ["name", "description"]) {
        if (preset[prop] === null) {
          preset[prop] = scratchAddons.l10n.get(`${folderName}/@preset-${prop}-${preset.id}`);
        }
      }
    }
    for (const option of manifest.settings || []) {
      if (option.name === null) {
        option.name = scratchAddons.l10n.get(`${folderName}/@opt-name-${option.id}`, {
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
          if (option.default === null) {
            option.default = scratchAddons.l10n.get(`${folderName}/@opt-default-${option.id}`);
          }
          break;
        case "select":
          option.potentialValues = option.potentialValues.map((value) => {
            if (value && value.id) {
              value.name = scratchAddons.l10n.get(`${folderName}/@opt-select-${option.id}-${value.id}`);
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
