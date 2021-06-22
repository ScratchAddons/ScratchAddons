import Addon from "../../addon-api/background/Addon.js";

/** @param {string} addonId */
export default async function runPersistentScripts(addonId) {
  const manifest = scratchAddons.manifests.find((obj) => obj.addonId === addonId)?.manifest;
  const permissions = manifest?.permissions || [];
  if (manifest?.persistentScripts)
    executePersistentScripts({ addonId, permissions, scriptUrls: manifest.persistentScripts });
}

/** @param {{ addonId: string; permissions: string[]; scriptUrls: string[] }} param0 */
async function executePersistentScripts({ addonId, permissions, scriptUrls }) {
  const addonObjReal = new Addon({ id: addonId, permissions });
  const addonObjRevocable = Proxy.revocable(addonObjReal, {});
  const addonObj = addonObjRevocable.proxy;
  scratchAddons.addonObjects.push(addonObjReal);
  /** @param {NodeJS.Timeout} timeoutId */
  const clearTimeoutFunc = (timeoutId) => {
    addonObjReal._timeouts.splice(
      addonObjReal._timeouts.findIndex((x) => x === timeoutId),
      1
    );
    return clearTimeout(timeoutId);
  };

  /** @param {NodeJS.Timeout} intervalId */
  const clearIntervalFunc = (intervalId) => {
    addonObjReal._intervals.splice(
      addonObjReal._intervals.findIndex((x) => x === intervalId),
      1
    );
    return clearInterval(intervalId);
  };

  /**
   * @param {() => void} func
   * @param {number} [interval]
   */
  const setTimeoutFunc = function (func, interval) {
    const timeoutId = setTimeout(function () {
      func();
      clearTimeoutFunc(timeoutId);
    }, interval);
    addonObjReal._timeouts.push(timeoutId);
    return timeoutId;
  };
  /**
   * @param {() => void} func
   * @param {number} [interval]
   *
   * @returns
   */
  const setIntervalFunc = function (func, interval) {
    const intervalId = setInterval(function () {
      func();
    }, interval);
    addonObjReal._intervals.push(intervalId);
    return intervalId;
  };
  addonObjReal._revokeProxy = () => {
    scratchAddons.addonObjects.splice(
      scratchAddons.addonObjects.findIndex((x) => x === addonObjReal),
      1
    );
    addonObjRevocable.revoke();
  };
  addonObjReal._restart = () => {
    addonObjReal._kill();
    executePersistentScripts({ addonId, permissions, scriptUrls });
  };
  const globalObj = Object.create(null);

  for (const scriptPath of scriptUrls) {
    const scriptUrl = chrome.runtime.getURL(`/addons/${addonId}/${scriptPath}`);
    console.log(
      `%cDebug addons/${addonId}/${scriptPath}: ${scriptUrl}`,
      "color:red; font-weight: bold; font-size: 1.2em;"
    );
    const module = await import(chrome.runtime.getURL(`addons/${addonId}/${scriptPath}`));
    const log = console.log.bind(console, `%c[${addonId}]`, "color:darkorange; font-weight: bold;");
    const warn = console.warn.bind(console, `%c[${addonId}]`, "color:darkorange font-weight: bold;");
    /**
     * @param {string} key
     * @param {{ [key: string]: string }} placeholders
     */
    const msg = (key, placeholders) =>
      scratchAddons.l10n.get(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders);
    msg.locale = scratchAddons.l10n.locale;
    module.default({
      addon: addonObj,
      global: globalObj,
      console: { ...console, log, warn },
      setTimeout: setTimeoutFunc,
      setInterval: setIntervalFunc,
      clearTimeout: clearTimeoutFunc,
      clearInterval: clearIntervalFunc,
      msg,
    });
  }
}
