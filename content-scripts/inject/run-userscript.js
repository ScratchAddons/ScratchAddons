import Addon from "../../addon-api/content-script/Addon.js";

export default async function runAddonUserscripts({ addonId, scripts, enabledLate = false }) {
  const addonObj = new Addon({ id: addonId, enabledLate });
  if (window.__addon === undefined) window.__addon = addonObj;
  addonObj.auth._update(scratchAddons.session);
  for (const scriptInfo of scripts) {
    const { url: scriptPath, runAtComplete } = scriptInfo;
    const scriptUrl = `${new URL(import.meta.url).origin}/addons/${addonId}/${scriptPath}`;
    const loadUserscript = async () => {
      const [module] = await Promise.all([
        import(scriptUrl),
        scratchAddons.l10n.loadByAddonId(addonId),
        runAtComplete ? addonObj.tab.scratchClassReady() : Promise.resolve(),
      ]);
      const msg = (key, placeholders) =>
        scratchAddons.l10n.get(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders);
      msg.locale = scratchAddons.l10n.locale;
      scratchAddons.console.logForAddon(`${addonId} [page]`)(
        `Running ${scriptUrl}, runAtComplete: ${runAtComplete}, enabledLate: ${enabledLate}`
      );
      const localConsole = {
        log: scratchAddons.console.logForAddon(addonId),
        warn: scratchAddons.console.warnForAddon(addonId),
        error: scratchAddons.console.errorForAddon(addonId),
      };
      module.default({
        addon: addonObj,
        console: { ...console, ...localConsole },
        msg,
        safeMsg: (key, placeholders) =>
          scratchAddons.l10n.escaped(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders),
      });
    };
    if (runAtComplete && document.readyState !== "complete") {
      window.addEventListener("load", () => loadUserscript(), { once: true });
    } else {
      loadUserscript();
    }
  }
}
