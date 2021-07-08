export default async function ({ addon, global, console, msg }) {
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
    let user = document.querySelector("[class*='account-nav_profile-name']").innerHTML;
    let msgRes = await fetch(`https://api.scratch.mit.edu/users/${user}/messages/count`).then((response) =>
      response.json()
    );
    const msgCount = Number(msgRes.count);
    messageCount.innerText = msgCount;
    if (msgCount === 0 || msgCount === 'NaN') {
      messageCount.setAttribute("style", `display: none;`);
    } else {
      messageCount.setAttribute("style", "");
    }
  };
  if (addon.tab.editorMode === "editor") {
    setMessages();
    setInterval(setMessages, 5000);
  } else {
    addon.tab.addEventListener("urlChange", function thisFunction() {
      if (addon.tab.editorMode === "editor") {
        setMessages();
        setInterval(setMessages, 5000);
        addon.tab.removeEventListener("urlChange", thisFunction);
      }
    });
  }

  while (true) {
    let nav = await addon.tab.waitForElement("[class^='menu-bar_account-info-group'] > [href^='/my']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    document.querySelector("[class^='menu-bar_account-info-group']").insertBefore(messages, nav);
  }
}
