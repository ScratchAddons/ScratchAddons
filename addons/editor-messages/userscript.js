export default async function ({ addon, global, console, msg }) {
  let msgInterval;
  const messages = document.createElement("a");
  messages.href = "/messages/";
  messages.title = msg("messages");
  messages.className = addon.tab.scratchClass("menu-bar_menu-bar-item", "menu-bar_hoverable", {
    others: "sa-editormessages",
  });
  let messageCount = document.createElement("span");
  messageCount.classList.add("sa-editormessages-count");
  messages.appendChild(messageCount);
  const setMessages = async () => {
    if (!document.querySelector("[class^='menu-bar_account-info-group']")) return;
    const msgCount = Number(await addon.account.getMsgCount());
    messageCount.innerText = msgCount;
    if (msgCount === 0) {
      messageCount.setAttribute("style", `display: none;`);
    } else {
      messageCount.setAttribute("style", "");
    }
  };

  while (true) {
    let nav = await addon.tab.waitForElement("[class^='menu-bar_account-info-group'] > [href^='/my']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      condition: () => !addon.tab.redux.state.scratchGui.mode.isPlayerOnly,
    });
    document.querySelector("[class^='menu-bar_account-info-group']").insertBefore(messages, nav);
    setMessages();
    clearInterval(msgInterval);
    msgInterval = setInterval(setMessages, 5000);
  }
}
