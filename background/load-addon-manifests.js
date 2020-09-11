scratchAddons.manifests = [];

(async function () {
  const folderNames = await (await fetch("/addons/addons.json")).json();
  for (const folderName of folderNames) {
    if (folderName.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${folderName}/addon.json`)).json();
    scratchAddons.manifests.push({ addonId: folderName, manifest });
  }
  scratchAddons.localState.ready.manifests = true;
  window.dispatchEvent(new CustomEvent("manifestsready"));
})();
