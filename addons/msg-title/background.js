export default async function ({ addon, msg, console }) {
  var oldTitle = document.title;
  setInterval(async () => {
    let count = await addon.account.getMsgCount()
    document.title = count === 0 ? oldTitle : `(${count}) ${oldTitle}`
  }, 1000)
};