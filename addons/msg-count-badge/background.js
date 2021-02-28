export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  addon.self.onMessage((data) => {
    console.log(data);
  });
  const setBadge = async () => {
    const msgCount = await addon.account.getMsgCount();
    addon.badge.text = msgCount;
    addon.self.sendMessage({ hewwo: "????" });
  };
  setBadge();
  setInterval(setBadge, 2500);
}
