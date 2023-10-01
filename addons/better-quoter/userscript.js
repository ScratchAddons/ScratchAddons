import { setupBetterQuoter } from "./module.js";
/** @typedef {import("types").Types} Types @param {Types} */
export default async function ({ addon, console }) {
  setupBetterQuoter(addon);
}
