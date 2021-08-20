const el = (el, properties = {}, children) => {
  const element = document.createElement(el);
  Object.keys(properties).forEach((key) => {
    element[key] = properties[key];
  });
  if (Array.isArray(children)) {
    children.forEach((child) => {
      element.appendChild(child);
    });
  } else if (children) {
    element.appendChild(children);
  }
  return element;
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

          const countReq = fetch(`https://api.scratch.mit.edu/users/${account}/messages/count`);
          const { count } = await (await countReq).json();
          const accountInfoReq = fetch(`https://api.scratch.mit.edu/users/${account}/`);
          const {
            profile: { images },
          } = await (await accountInfoReq).json();

          const elProps = {};
          if (!didDivider) {
            elProps.className = "divider";
            didDivider = true;
          }
          dropdown.insertBefore(
            el(
              "li",
              elProps,
              el(
                "a",
                {
                  href: "javascript:void(0)",
                  onclick: sendBGMsg("switch-account", account),
                },
                [
                  el("img", { src: images["32x32"] }),
                  el("span", { innerText: account }),
                  el("span", { innerText: count, className: "sa-msg-count" }),
                ]
              )
            ),
            dropdown.querySelector(".divider:last-child")
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
