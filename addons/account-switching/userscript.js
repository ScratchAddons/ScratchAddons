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
          item.append(
            el("a", {
              href: "javascript:void(0)",
              textContent: account,
              async onclick() {
                addon.messaging.sendMessage(
                  {
                    type: "switch-account",
                    username: account,
                  },
                  () => {
                    window.location.reload();
                  }
                );
              },
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
              async onclick() {
                addon.messaging.sendMessage(
                  {
                    type: "remove-account",
                  },
                  () => {
                    window.location.reload();
                  }
                );
              },
            })
          );
        } else {
          item.append(
            el("a", {
              href: "javascript:void(0)",
              textContent: "Add account",
              async onclick() {
                addon.messaging.sendMessage(
                  {
                    type: "add-account",
                  },
                  () => {
                    window.location.reload();
                  }
                );
              },
            })
          );
        }
      }
    );
  }
}
