import Addon from "../../addon-api/background/Addon.js";
// Intentional circular import
// ESM so this is fine
import changeAddonState from "./change-addon-state.js";
import { getMissingOptionalPermissions } from "./util.js";
import createConsole from "../../libraries/common/console.js";

const console = createConsole("page");

export default async function runPersistentScripts(addonId) {
  const manifest = scratchAddons.manifests.find((obj) => obj.addonId === addonId).manifest;
  const permissions = manifest.permissions || [];
  const missing = await getMissingOptionalPermissions();
  if (permissions.some((p) => missing.includes(p))) {
    console.warn("Disabled addon", addonId, "due to missing optional permission");
    changeAddonState(addonId, false);
    return;
  }
  if (manifest.persistentScripts)
    executePersistentScripts({ addonId, permissions, scriptUrls: manifest.persistentScripts });
}

async function executePersistentScripts({ addonId, permissions, scriptUrls }) {
  const addonObjReal = new Addon({ id: addonId, permissions });
  const addonObjRevocable = Proxy.revocable(addonObjReal, {});
  const addonObj = addonObjRevocable.proxy;
  scratchAddons.addonObjects.push(addonObjReal);
  const clearTimeoutFunc = (timeoutId) => {
    addonObjReal._timeouts.splice(
      addonObjReal._timeouts.findIndex((x) => x === timeoutId),
      1
    );
    return clearTimeout(timeoutId);
  };
  const clearIntervalFunc = (intervalId) => {
    addonObjReal._intervals.splice(
      addonObjReal._intervals.findIndex((x) => x === intervalId),
      1
    );
    return clearInterval(intervalId);
  };
  const setTimeoutFunc = function (func, interval) {
    const timeoutId = setTimeout(function () {
      func();
      clearTimeoutFunc(timeoutId);
    }, interval);
    addonObjReal._timeouts.push(timeoutId);
    return timeoutId;
  };
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
    const scriptUrl = chrome.runtime.getURL(`addons/${addonId}/${scriptPath}`);
    console.logForAddon(`${addonId}`)(`Running ${scriptUrl}`);
    const module = await import(chrome.runtime.getURL(`addons/${addonId}/${scriptPath}`));
    const localConsole = {
      log: console.logForAddon(addonId),
      warn: console.warnForAddon(addonId),
      error: console.errorForAddon(addonId),
    };
    const msg = (key, placeholders) =>
      scratchAddons.l10n.get(key.startsWith("/") ? key.slice(1) : `${addonId}/${key}`, placeholders);
    msg.locale = scratchAddons.l10n.locale;
    module.default({
      addon: addonObj,
      global: globalObj,
      console: { ...console, ...localConsole },
      msg,
      setTimeout: setTimeoutFunc,
      setInterval: setIntervalFunc,
      clearTimeout: clearTimeoutFunc,
      clearInterval: clearIntervalFunc,
    });
  }
}
