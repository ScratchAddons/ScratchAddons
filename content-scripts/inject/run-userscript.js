import Addon from "../../addon-api/content-script/Addon.js";

export default async function runAddonUserscripts({ addonId, scripts, traps }) {
  const addonObj = new Addon({ id: addonId, traps });
  const globalObj = Object.create(null);
  for (const scriptInfo of scripts) {
    const { url: scriptPath, runAtComplete } = scriptInfo;
    const scriptUrl = `${document
      .getElementById("scratch-addons")
      .getAttribute("data-path")}addons/${addonId}/${scriptPath}`;
    console.log(
      `%cDebug addons/${addonId}/${scriptPath}: ${scriptUrl}, runAtComplete: ${runAtComplete}`,
      "color:red; font-weight: bold; font-size: 1.2em;"
    );
    const loadUserscript = async () => {
      await scratchAddons.l10n.loadByAddonId(addonId);
      const module = await import(scriptUrl);
      const log = _realConsole.log.bind(console, `%c[${addonId}]`, "color:darkorange; font-weight: bold;");
      const warn = _realConsole.warn.bind(console, `%c[${addonId}]`, "color:darkorange font-weight: bold;");
      const msg = (key, placeholders) => scratchAddons.l10n.get(`${addonId}/${key}`, placeholders);
      msg.locale = scratchAddons.l10n.locale;
      module.default({
        addon: addonObj,
        global: globalObj,
        console: { ..._realConsole, log, warn },
        msg,
        safeMsg: (key, placeholders) => scratchAddons.l10n.escaped(`${addonId}/${key}`, placeholders),
      });
    };
    if (runAtComplete && document.readyState !== "complete") {
      console.log(`Waiting for onload: ${addonId}`);
      window.addEventListener("load", () => loadUserscript(), { once: true });
    } else {
      await loadUserscript();
    }
  }
}
