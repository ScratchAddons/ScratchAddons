export default async function ({ addon, global, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  const setBadge = async () => {
    const msgCount = await addon.account.getMsgCount();
    addon.badge.text = msgCount;
    addon.badge.color = addon.settings.get('color')
  };
  setBadge();
  addon.settings.addEventListener("change", ()=>{
    addon.badge.color = addon.settings.get('color')
  })
  setInterval(setBadge, 2500);
}
