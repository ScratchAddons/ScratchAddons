import Addon from "../../addon-api/content-script/Addon.js";

export default async function runAddonUserscripts({ addonId, scripts, enabledLate = false }) {
  const addonObj = new Addon({ id: addonId, enabledLate });
  addonObj.auth._update(scratchAddons.session);
  const globalObj = Object.create(null);
  for (const scriptInfo of scripts) {
    const { url: scriptPath, runAtComplete } = scriptInfo;
    const scriptUrl = `${new URL(import.meta.url).origin}/addons/${addonId}/${scriptPath}`;
    const loadUserscript = async () => {
      await scratchAddons.l10n.loadByAddonId(addonId);
      const module = await import(scriptUrl);
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
        global: globalObj,
        console: { ...console, ...localConsole },
        msg,
        safeMsg: (key, placeholders) =>
          scratchAddons.l10n.escaped(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders),
      });
    };
    if (runAtComplete && document.readyState !== "complete") {
      window.addEventListener("load", () => loadUserscript(), { once: true });
    } else {
      await loadUserscript();
    }
  }
}
