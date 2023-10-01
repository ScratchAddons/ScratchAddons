import * as sharedModule from "./module.js";

/** @typedef {import("types").Types} Types @param {Types} */
export default async function ({ addon, console }) {
  const update = () => {
    sharedModule.setDuplication(!addon.self.disabled);
  };
  addon.self.addEventListener("disabled", update);
  addon.self.addEventListener("reenabled", update);
  update();
  sharedModule.load(addon);
}
