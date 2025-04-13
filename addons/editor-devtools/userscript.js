import DevTools from "./DevTools.js";

/** @param {import("addonAPI").AddonAPI} */
export default async function ({ addon, console, msg, safeMsg: m }) {
  const devTools = new DevTools(addon, msg, m);
  devTools.init();
}
