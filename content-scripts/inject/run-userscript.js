import Addon from "../../addon-api/content-script/Addon.js";

export default async function runAddonUserscripts({ addonId, scripts, enabledLate = false }) {
  const addonObj = new Addon({ id: addonId, enabledLate });
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
      const betterConsole = scratchAddons.console;
      betterConsole.log(
        `addons/${addonId}/${scriptPath}: ${scriptUrl}, runAtComplete: ${runAtComplete}`,
        `${addonId} [core]`
      );
      const localConsole = {
        log: (log) => betterConsole.log(log, addonId),
        debug: (log) => betterConsole.debug(log, addonId),
        error: (log) => betterConsole.error(log, addonId),
        info: (log) => betterConsole.info(log, addonId),
        warn: (log) => betterConsole.warn(log, addonId),
        table: (log) => betterConsole.table(log, addonId),
      };
      module.default({
        addon: addonObj,
        global: globalObj,
        console: localConsole,
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
