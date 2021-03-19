export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  const setBadge = async () => {
    const msgCount = await addon.account.getMsgCount();
    addon.badge.text = msgCount;
    addon.badge.color = '#46954a'
  };
  setBadge();
  setInterval(setBadge, 2500);
}
