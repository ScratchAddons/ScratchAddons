import Addon from "../addon-api/background/Addon.js";
import evalScript from "./eval-background-script.js";

export default async function runAddonBgScripts({
  addonId,
  permissions,
  scripts,
}) {
  const addonObjReal = new Addon({ id: addonId, permissions });
  const addonObjRevocable = Proxy.revocable(addonObjReal, {});
  const addonObj = addonObjRevocable.proxy;
  scratchAddons.addons.push(addonObjReal);
  const clearTimeoutFunc = (timeoutId) => {
    addonObj._timeouts.splice(
      addonObj._timeouts.findIndex((x) => x === timeoutId),
      1
    );
    return clearTimeout(timeoutId);
  };
  const clearIntervalFunc = (intervalId) => {
    addonObj._intervals.splice(
      addonObj._intervals.findIndex((x) => x === intervalId),
      1
    );
    return clearInterval(intervalId);
  };
  const setTimeoutFunc = function (func, interval) {
    const timeoutId = setTimeout(function () {
      func();
      clearTimeoutFunc(timeoutId);
    }, interval);
    addonObj._timeouts.push(timeoutId);
    return timeoutId;
  };
  const setIntervalFunc = function (func, interval) {
    const intervalId = setInterval(function () {
      func();
    }, interval);
    addonObj._intervals.push(intervalId);
    return intervalId;
  };
  addonObj._revokeProxy = () => {
    scratchAddons.addons.splice(
      scratchAddons.addons.findIndex((x) => x === addonObjReal),
      1
    );
    addonObjRevocable.revoke();
  };
  const globalObj = Object.create(null);
  for (const scriptPath of scripts) {
    const pseudoUrl = `scratchaddons://bgscripts/${addonId}@${scriptPath
      .split("/")
      .join("@")}`;
    console.log(
      `%cDebug addons/${addonId}/${scriptPath}: ${pseudoUrl}`,
      "color:red; font-weight: bold; font-size: 1.3em;"
    );
    let codeToEvaluate = "";
    codeToEvaluate += await (
      await fetch(`/addons/${addonId}/${scriptPath}`)
    ).text();
    codeToEvaluate += "\n//# sourceURL=" + pseudoUrl;
    evalScript(
      codeToEvaluate,
      addonObj,
      globalObj,
      setTimeoutFunc,
      setIntervalFunc,
      clearTimeoutFunc,
      clearIntervalFunc
    );
  }
}
