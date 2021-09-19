import runAddonUserscripts from "./run-userscript.js";
const addons = (await fetch("../addons/addons.json").then(r => r.json())).filter(addon => !addon.startsWith("//"))
addons.forEach(async(addon) => {
	const manifest = (await fetch("../addons/" + addon + "addon.json").then(r => r.json()))
	runAddonUserscripts(addon,manifest.scripts,false)
})

