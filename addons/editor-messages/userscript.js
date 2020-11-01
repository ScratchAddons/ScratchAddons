export default async function ({ addon, global, console }) {
  while (true) {
    let nav = await addon.tab.waitForElement("[href^='/my']", {
      markAsSeen: true,
    });
    const messages = document.createElement("a");
    messages.href = "/messages/";
    messages.title = "Messages";
    messages.classList.add("sa-editormessages");
    let messageCount = document.createElement("span");
    messageCount.classList.add("sa-editormessages-count");
    messages.appendChild(messageCount);
    document.querySelector("[class^='menu-bar_account-info-group']").insertBefore(messages, nav);
    const setMessages = async () => {
      const msgCount = await addon.account.getMsgCount();
      messageCount.innerText = msgCount;
      if (msgCount == 0) {
        messageCount.setAttribute("style", `display: none;`);
      } else {
        messageCount.setAttribute("style", "");
      }
    };
    setMessages();
    setInterval(setMessages, 5000);
  }
}
