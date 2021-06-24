export default async (
  /** @type {AddonAPIs.PersistentScript} */ { addon, console, setTimeout, setInterval, clearTimeout, clearInterval }
) => {
  const setBadge = async () => {
    const msgCount = await addon.account.getMsgCount();
    addon.badge.text = msgCount;
  };
  setBadge();
  addon.badge.color = addon.settings.get("color");
  addon.settings.addEventListener("change", () => {
    addon.badge.color = addon.settings.get("color");
  });
  setInterval(setBadge, 2500);
  addon._revokeProxy
};
