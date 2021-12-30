export default async function ({ addon, global, document, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
    let msgCount;
    console.log("Hi from the addon!")
    const setBadge = () => {
      if (msgCount === null && addon.settings.get("showOffline")) {
          // Do nothing
      } else {
        global.document.querySelector("#navigation > div > ul > .messages > a > .message-count")=msgCount;

      }
    };
    const getMsgCountAndSetBadge = async () => {
      msgCount = await addon.account.getMsgCount();
      setBadge();
    };
  
    getMsgCountAndSetBadge();
    window.setInterval(getMsgCountAndSetBadge, 2500);
  }
  