import DevTools from "./DevTools.js";

export default async function ({ addon, console, msg, safeMsg: m }) {
  // noinspection JSUnresolvedVariable
  if (!addon.self._isDevtoolsExtension && window.initGUI) {
    console.log("Extension running, stopping addon");
    window._devtoolsAddonEnabled = true;
    window.dispatchEvent(new CustomEvent("scratchAddonsDevtoolsAddonStopped"));
    return;
  }

  const devTools = new DevTools(addon, msg, m);
  devTools.init();
}
