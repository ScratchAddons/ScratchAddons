export default async function ({ addon, console, msg }) {
  await addon.tab.waitForElement("img.not-available-image", {
    markAsSeen: true,
  });
  window.location.assign(addon.settings.get("redirectUrl") + window.location.pathname.split("/")[2]) + "#unshared";
}
