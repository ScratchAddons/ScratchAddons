import { setupBetterQuoter } from "./module.js";

/** @param {AddonAPI} */
export default async function ({ addon, console }) {
  setupBetterQuoter(addon);
}
