import { setupBetterQuoter } from "./module.js";
export default async function ({ addon, global, console }) {
  setupBetterQuoter(addon);
}
