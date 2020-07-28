console.log(addon);
setInterval(async () => {
    console.log(await addon.account.getMsgCount());
}, 5000);