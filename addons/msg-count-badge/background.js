setInterval(async () => {
  const msgCount = await addon.account.getMsgCount();
  addon.badge.text = msgCount;
}, 1000);
