export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  let msgCount;

  const setBadge = () => {
    if (msgCount === null && addon.settings.get("showOffline")) {
      addon.badge.color = "#dd2222";
      addon.badge.text = "?";
    } else {
      addon.badge.color = addon.settings.get("color");
      addon.badge.text = msgCount;
    }
  };
  const getMsgCountAndSetBadge = async () => {
    msgCount = await addon.account.getMsgCount();
    setBadge();
  };

  getMsgCountAndSetBadge();

  addon.settings.addEventListener("change", setBadge);

  setInterval(getMsgCountAndSetBadge, 2500);
}
