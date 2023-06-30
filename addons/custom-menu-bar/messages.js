export default async function ({ addon, console, msg }) {
  const messages = document.createElement("a");
  messages.href = "/messages/";
  messages.className = addon.tab.scratchClass("menu-bar_menu-bar-item", "menu-bar_hoverable", {
    others: "sa-editormessages",
  });
  let messageCount = document.createElement("span");
  messageCount.classList.add("sa-editormessages-count");
  messages.appendChild(messageCount);
  const setMessages = async () => {
    const msgCount = Number(await addon.account.getMsgCount());
    messageCount.innerText = msgCount;
    if (msgCount === 0) {
      messageCount.setAttribute("style", `display: none;`);
    } else {
      messageCount.setAttribute("style", "");
    }
  };

  let interval;
  function createInterval() {
    if (addon.tab.editorMode === "editor") {
      setMessages();
      interval = setInterval(setMessages, 5000);
    } else {
      addon.tab.addEventListener("urlChange", function thisFunction() {
        if (addon.tab.editorMode === "editor") {
          setMessages();
          interval = setInterval(setMessages, 5000);
          addon.tab.removeEventListener("urlChange", thisFunction);
        }
      });
    }
  }
  if (addon.settings.get("messages")) createInterval();

  addon.self.addEventListener("change", () => {
    if (addon.settings.get("messages")) createInterval();
    else clearInterval(interval);
  });

  while (true) {
    if (addon.self.disabled || !addon.settings.get("messages")) messages.style.display = "none";
    else messages.style.display = "block";
    let nav = await addon.tab.waitForElement("[class^='menu-bar_account-info-group'] > [href^='/my']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    document.querySelector("[class^='menu-bar_account-info-group']").insertBefore(messages, nav);
  }
}
