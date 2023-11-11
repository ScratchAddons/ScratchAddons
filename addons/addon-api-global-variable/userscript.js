export default async function ({ addon }) {
  const update = () => {
    if (addon.self.disabled)
      delete window.addon
    else
      window.addon = addon;
  };
  addon.self.addEventListener("disabled", update);
  addon.self.addEventListener("reenabled", update);
  update();
}