export default async function ({ addon, console, msg }) {
  let originalNavbar = [];
  await addon.tab.waitForElement(".search", { markAsSeen: true });
  const list = document.querySelector(".site-nav");

  function createItem({ name, url }, last) {
    const li = document.createElement("li");
    li.className = "link";
    if (last) li.classList.add("last");

    const a = document.createElement("a");
    const absolute = new URL(url, location.origin);
    a.href = ["http:", "https:"].includes(absolute.protocol) ? absolute.toString() : "";
    li.append(a);
    // scratch's code looks for this id in account-nav.js
    a.id = "project-create";

    const span = document.createElement("span");
    span.innerText = name;
    a.append(span);

    return li;
  }
  function removeAllItems() {
    if (originalNavbar.length === 0) {
      originalNavbar.push(
        ...Array.prototype.map.call(list.children, (item) => ({
          name: item.innerText,
          url: item.firstChild.href,
        }))
      );
    }
    while (list.firstChild) {
      list.removeChild(list.lastChild);
    }
    return;
  }
  async function init() {
    const loggedIn = await addon.auth.fetchIsLoggedIn();
    removeAllItems();
    let items = addon.self.disabled ? originalNavbar : addon.settings.get("items");
    if (!addon.self.disabled && !loggedIn && addon.settings.get("showMembership")) {
      items = [
        ...items,
        {
          name: msg("membership"),
          url: "/membership",
        },
      ];
    }
    items.forEach((item, i) => {
      list.append(createItem(item, i + 1 === items.length));
    });
  }
  init();
  addon.settings.addEventListener("change", init);
  addon.self.addEventListener("disabled", init);
  addon.self.addEventListener("reenabled", init);
}
