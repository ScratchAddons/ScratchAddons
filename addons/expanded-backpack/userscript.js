export default async function ({ addon, global, console }) {
  // fix area above the backpack displaying at the wrong height when addon settings are changed
  addon.settings.addEventListener("change", heightFix);
  addon.self.addEventListener("disabled", heightFix);
  addon.self.addEventListener("reenabled", heightFix);

  async function heightFix() {
    window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas (thanks @mxmou)
  }
}
