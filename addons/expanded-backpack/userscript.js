export default async function ({ addon, global, console }) {
  // resize editor to match backpack height when settings changed or addon disabled
  addon.settings.addEventListener("change", function() {
    window.dispatchEvent(new Event("resize"))
  });
  addon.self.addEventListener("disabled", function() {
    window.dispatchEvent(new Event("resize"))
  });
}
