import { setupBetterQuoter } from "./module.js";

/** @param {import("addonAPI").AddonAPI} */
export default async function ({ addon, console }) {
  setupBetterQuoter(addon);
}
