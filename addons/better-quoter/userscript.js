import { setupBetterQuoter } from "./module.js";
/** @param {import("types").Types} */
export default async function ({ addon, console }) {
  setupBetterQuoter(addon);
}
