import runAddonUserscripts from "./run-userscript.js";
const addons = (await fetch("../addons/addons.json").then(r => r.json())).filter(addon => !addon.startsWith("//"))
addons.forEach(async(addonId) => {
	const manifest = (await fetch("../addons/" + addonId + "addon.json").then(r => r.json()))
	runAddonUserscripts({ addonId,scripts:manifest.scripts})
})

