export default async function ({ addon }) {
  window.addon = addon;
  addon.self.addEventListener("disabled", () => delete window.addon);
  addon.self.addEventListener("reenabled", () => (window.addon = addon));
}
