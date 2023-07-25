export default async function ({ addon, console, msg }) {
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
    const username = await addon.auth.fetchUsername();
    if (!username) return;
    const { count } = await (await fetch(`https://api.scratch.mit.edu/users/${username}/messages/count`)).json();
    messageCount.innerText = count;
    if (count === 0) {
      messageCount.setAttribute("style", `display: none;`);
    } else {
      messageCount.setAttribute("style", "");
    }
  };

  let interval;
  function createInterval() {
    if (addon.tab.editorMode === "editor") {
      setMessages();
      interval = setInterval(setMessages, 30000);
    } else {
      addon.tab.addEventListener("urlChange", function thisFunction() {
        if (addon.tab.editorMode === "editor") {
          setMessages();
          interval = setInterval(setMessages, 30000);
          addon.tab.removeEventListener("urlChange", thisFunction);
        }
      });
    }
  }
  createInterval();

  addon.self.addEventListener("disabled", () => {
    clearInterval(interval);
  });
  addon.self.addEventListener("reenabled", createInterval);

  addon.tab.displayNoneWhileDisabled(messages);
  while (true) {
    let nav = await addon.tab.waitForElement("[class^='menu-bar_account-info-group'] > [href^='/my']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    document.querySelector("[class^='menu-bar_account-info-group']").insertBefore(messages, nav);
  }
}
