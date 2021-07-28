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
      const betterConsole = {
        _createOutput(...args) {
          var argLength = args.length
          var logContent = args.slice(0, argLength)
          var logCategory = args[argLength - 1]
          if (logCategory && argLength !== 1) return [`%cSA%c${logCategory}%c`, this._style.leftPrefix, this._style.rightPrefix, this._style.text, ...logContent]
          else return [`%cSA%c`, this._style.singlePrefix, this._style.text, ...logContent]
        },
        _style: {
          leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
          rightPrefix: "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem",
          singlePrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem; padding: 0 0.5rem",
          text: ""
        },
        log(...args) {
          _realConsole.log(...this._createOutput(...args))
        },
        debug(...args) {
          _realConsole.debug(...this._createOutput(...args))
        },
        error(...args) {
          _realConsole.error(...this._createOutput(...args))
        },
        info(...args) {
          _realConsole.info(...this._createOutput(...args))
        },
        warn(...args) {
          _realConsole.warn(...this._createOutput(...args))
        },
        table(...args) {
          _realConsole.table(...args)
        }
      }
      const localConsole = {
        log: (log)=>{return betterConsole.log(log,addonId)},
        debug: (log)=>{return betterConsole.debug(log,addonId)},
        error: (log)=>{return betterConsole.error(log,addonId)},
        info: (log)=>{return betterConsole.info(log,addonId)},
        warn: (log)=>{return betterConsole.warn(log,addonId)},
        table: (log)=>{return betterConsole.table(log,addonId)}
      }
      module.default({
        addon: addonObj,
        global: globalObj,
        console: { ..._realConsole, log, warn },
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
