export default async function ({ addon, global, console }) {
  // fix area above the backpack displaying incorrectly when height changed
  addon.settings.addEventListener("change", heightFix);
  addon.self.addEventListener("disabled", heightFix);
  addon.self.addEventListener("reenabled", heightFix);

  async function heightFix() {
    window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas
  }
}
