export default async function ({ addon, global, console }) {
  while (true) {
    const nav = await addon.tab.waitForElement("[class^='menu-bar_account-info-group'] [class^='menu-bar_menu-bar-item']", { markAsSeen: true });
    const messages = document.createElement("a")
    messages.href = "/messages/"
    messages.title = "Messages"
    messages.setAttribute("style", `
    background-image: url(/images/nav-notifications.png);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 45%;
    padding-right: 10px;
    padding-left: 10px;
    width: 30px;
    overflow: hidden;
    text-indent: 50px;
    white-space: nowrap;
    display: block;
    padding: 13px 15px 4px 15px;
    height: 33px;
    text-decoration: none;
    color: white;
    font-size: .85rem;
    font-weight: bold;
    `)
    messages.classList.add("sa-editormessages")
    let messageCount = document.createElement("span")
    messages.appendChild(messageCount)
    if (!nav.querySelector("img")) {
      nav.appendChild(messages)
      const setMessages = async () => {
        fetch(`https://api.scratch.mit.edu/users/${addon.auth.username}/messages/count/`)
        .then((response) => response.json())
        .then((data) => {
          if (data.count == 0) {
            messageCount.setAttribute("style", `display: none;`)
          } else {
            messageCount.innerText = data.count
            messageCount.setAttribute("style", `
            display: block;
            position: absolute;
            top: .5rem;
            right: 1.25rem;
            border-radius: 1rem;
            background-color: #ffab1a;
            padding: 0 .25rem;
            text-indent: 0;
            line-height: 1rem;
            color: white;
            font-size: .7rem;
            font-weight: bold;
            `);
          }
        });
      };
      setMessages();
      setInterval(setMessages, 5000);
    }
  }
}
