const el = (el, properties = {}) => {
  const elm = document.createElement(el);
  for (const prop in properties) {
    if (properties.hasOwnProperty(prop)) {
      elm[prop] = properties[prop];
    }
  }
  return elm;
};

export default async function ({ addon, msg, global, console }) {
  while (true) {
    const dropdown = await addon.tab.waitForElement(".dropdown", { markAsSeen: true });
    await addon.tab.waitForElement(".divider");
    const username = await addon.auth.fetchUsername();

    function sendBGMsg(type, username) {
      return async function (event) {
        if (!event.isTrusted) return;
        addon.messaging.sendMessage({ type, username }, () => {
          window.location.reload();
        });
      };
    }

    addon.messaging.sendMessage(
      {
        type: "get-accounts",
      },
      async (accounts) => {
        let didDivider = false;
        for (const account of accounts) {
          if (account === username) continue;

          const elProps = {};
          if (!didDivider) {
            elProps.className = "divider";
            didDivider = true;
          }
          let item = dropdown.insertBefore(el("li", elProps), dropdown.querySelector(".divider:last-child"));
          const countReq = fetch(`https://api.scratch.mit.edu/users/${account}/messages/count`);
          const { count } = await (await countReq).json();
          item.append(
            el("a", {
              href: "javascript:void(0)",
              textContent: account + " " + count,
              onclick: sendBGMsg("switch-account", account),
            })
          );
        }

        const elProps = {};
        if (!didDivider) {
          elProps.className = "divider";
        }
        let item = dropdown.insertBefore(el("li", elProps), dropdown.querySelector(".divider:last-child"));

        if (accounts.includes(username)) {
          item.append(
            el("a", {
              href: "javascript:void(0)",
              textContent: "Remove account",
              onclick: sendBGMsg("remove-account"),
            })
          );
        } else {
          item.append(
            el("a", {
              href: "javascript:void(0)",
              textContent: "Add account",
              onclick: sendBGMsg("add-account"),
            })
          );
        }
      }
    );
  }
}
