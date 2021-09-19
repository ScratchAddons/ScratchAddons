import runAddonUserscripts from "./run-userscript.js";
const addons = (await fetch(new URL(import.meta.url, "../addons/addons.json").href).then((r) => r.json())).filter(
  (addon) => !addon.startsWith("//")
);
addons.forEach(async (addonId) => {
  const manifest = await fetch(new URL(import.meta.url, "../addons/" + addonId + "addon.json").href).then((r) =>
    r.json()
  );
  runAddonUserscripts({ addonId, scripts: manifest.scripts });
});
