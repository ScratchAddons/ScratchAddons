import { setupBetterQuoter } from "./module.js";
export default async function ({ addon, console, fetch }) {
  setupBetterQuoter(addon);
}
