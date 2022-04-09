export default async function ({ addon, console, msg }) {
  await addon.tab.waitForElement("img.not-available-image", {
    markAsSeen: true,
  });
  window.location.assign("//turbowarp.org/" + window.location.pathname.split("/")[2]) + "#unshared";
}
