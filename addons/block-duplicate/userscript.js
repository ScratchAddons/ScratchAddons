import * as sharedModule from "./module.js";

export default async function ({ addon, console, fetch }) {
  const update = () => {
    sharedModule.setDuplication(!addon.self.disabled);
  };
  addon.self.addEventListener("disabled", update);
  addon.self.addEventListener("reenabled", update);
  update();
  sharedModule.load(addon);
}
