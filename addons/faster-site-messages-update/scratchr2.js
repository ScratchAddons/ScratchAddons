export default async function ({ addon, window, global, document, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
    let msgCount;
    console.log("Hi from the addon!")
    const setBadge = () => {
      if (msgCount === null && addon.settings.get("showOffline")) {
          // Do nothing
      } else {
        global.document.getElementsByClassName(".notificationsCount")[0].innerText=msgCount;

      }
    };
    const getMsgCountAndSetBadge = async () => {
      msgCount = await addon.account.getMsgCount();
      setBadge();
    };
  
    getMsgCountAndSetBadge();
    window.setInterval(getMsgCountAndSetBadge, 2500);
  }
  