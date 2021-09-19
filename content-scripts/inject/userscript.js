import runAddonUserscripts from "./run-userscript.js";
const addons = (await fetch(new URL( "../addons/addons.json",import.meta.url,).href).then((r) => r.json())).filter(
  (addon) => !addon.startsWith("//")
);
addons.forEach(async (addonId) => {
  const manifest = await fetch(new URL("../addons/" + addonId + "addon.json",import.meta.url).href).then((r) =>
    r.json()
  );
  runAddonUserscripts({ addonId, scripts: manifest.scripts });
});
