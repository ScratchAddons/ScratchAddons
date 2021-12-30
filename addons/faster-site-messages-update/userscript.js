export default async function ({ addon, console, setTimeout, setInterval, clearTimeout, clearInterval }) {
  if (addon.tab.clientVersion === null) return;
  if (window.location.href.includes("/projects") && window.location.href.includes("/editor")) return;
  let msgCount;
  // console.log("Hi from the addon!")
  const setBadge = () => {
    if (msgCount === null && addon.settings.get("showOffline")) {
      // Do nothing
    } else {
      var targetElement;
      if (addon.tab.clientVersion === "scratch-www") {
        targetElement = document.querySelector(
          "#navigation > div > ul > li.link.right.messages > a > span.message-count.show"
        );
      } else {
        targetElement = document.querySelector(
          "#topnav > div > div > ul.account-nav.logged-in > li.messages > a > span"
        );
      }
      // console.log(document)
      if (typeof msgCount == "number") {
        targetElement.innerText = msgCount;
      } else {
        // Assume that message count check failed
        console.error("Message count check failed. Result was invalid.\n\nResult was:\n".concat(msgCount));
      }
      targetElement = null; // Garbage collection
    }
  };
  const getMsgCountAndSetBadge = async () => {
    msgCount = await addon.account.getMsgCount();
    setBadge();
    msgCount = null; // Garbage collection
  };

  getMsgCountAndSetBadge();
  window.setInterval(getMsgCountAndSetBadge, 2500);
}
