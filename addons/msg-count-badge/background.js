export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  const setBadge = async () => {
    const msgCount = await addon.account.getMsgCount();

    if (addon.settings.get("showOffline") && isNaN(parseInt(msgCount))) {
      // Offline badge color
      addon.badge.color = addon.settings.get("offlineColor");

      // Offline badge indicator
      addon.badge.text = addon.settings.get("offlineText");
    } else {
      // Regular badge color
      addon.badge.color = addon.settings.get("color");

      // Regular message count
      addon.badge.text = msgCount;
    }
  };

  setBadge();

  addon.settings.addEventListener("change", () => {
    setBadge();
  });

  setInterval(setBadge, 2500);
}
