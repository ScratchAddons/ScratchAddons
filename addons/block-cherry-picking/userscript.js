import * as sharedModule from "../block-duplicate/module.js";

export default async function ({ addon, console }) {
  const update = () => {
    sharedModule.setCherryPicking(!addon.self.disabled, addon.settings.get("invertDrag"));
  };
  addon.self.addEventListener("disabled", update);
  addon.self.addEventListener("reenabled", update);
  addon.settings.addEventListener("change", update);
  update();
  sharedModule.load(addon);
}
