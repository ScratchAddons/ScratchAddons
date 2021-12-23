export default async function ({ addon }) {
  window.vm = addon.tab.traps.vm;
  addon.self.addEventListener("disabled", () => {
    delete window.vm;
  });
  addon.self.addEventListener("reenabled", () => {
    window.vm = addon.tab.traps.vm;
  });
}
