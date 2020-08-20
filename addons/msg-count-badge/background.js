export default async function ({
  addon,
  global,
  console,
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
}) {
  setInterval(async () => {
    const msgCount = await addon.account.getMsgCount();
    addon.badge.text = msgCount;
  }, 1000);
}
