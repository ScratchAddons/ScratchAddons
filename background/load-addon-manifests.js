(async function () {
  const folderNames = await (await fetch("/addons/addons.json")).json();
  await scratchAddons.l10n.load(folderNames);
  for (const folderName of folderNames) {
    if (folderName.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${folderName}/addon.json`)).json();
    for (const prop of ["name", "description", "notice"]) {
        if (manifest[prop] === null) {
            manifest[prop] = scratchAddons.l10n.get(`${folderName}/@${prop}`);
        }
    }
    scratchAddons.manifests.push({ addonId: folderName, manifest });
  }  
  scratchAddons.localState.ready.manifests = true;
  scratchAddons.localEvents.dispatchEvent(new CustomEvent("manifestsReady"));
})();
