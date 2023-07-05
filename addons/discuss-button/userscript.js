export default async function ({ addon, console }) {
  let originalNavbar = [];
  while (true) {
    const searchItem = await addon.tab.waitForElement(".search", {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
    });
    const scratchr2List = document.querySelector(".site-nav");

    function createItem({ name, url, extraClass }, last) {
      const li = document.createElement("li");
      li.className = "link";
      if (last) li.classList.add("last");
      if (addon.tab.clientVersion !== "scratchr2" && typeof extraClass === "string") li.classList.add(extraClass);

      const a = document.createElement("a");
      const absolute = new URL(url, location.origin);
      a.href = ["http:", "https:"].includes(absolute.protocol) ? absolute.toString() : "";
      li.append(a);
      if (scratchr2List) {
        // scratch's code looks for this id in account-nav.js (scratchr2 only).
        a.id = "project-create";
      }

      const span = document.createElement("span");
      span.innerText = name;
      a.append(span);

      return li;
    }
    function removeAllItems() {
      if (scratchr2List) {
        // We are on scratchr2!
        if (originalNavbar.length < 4) {
          originalNavbar.push(
            ...Array.prototype.map.call(scratchr2List.children, (item) => ({
              name: item.innerText,
              url: item.firstChild.href,
            })),
          );
        }
        while (scratchr2List.firstChild) {
          scratchr2List.removeChild(scratchr2List.lastChild);
        }
        return;
      }
      while (!searchItem.previousSibling.classList.contains("logo")) {
        searchItem.previousSibling.remove();
      }
    }
    function init() {
      removeAllItems();
      const items = addon.self.disabled
        ? originalNavbar.length === 0
          ? (originalNavbar = [
              { name: addon.tab.scratchMessage("general.create"), url: "/projects/editor/", extraClass: "create" },
              {
                name: addon.tab.scratchMessage("general.explore"),
                url: "/explore/projects/all",
                extraClass: "explore",
              },
              { name: addon.tab.scratchMessage("general.ideas"), url: "/ideas", extraClass: "ideas" },
              { name: addon.tab.scratchMessage("general.about"), url: "/about", extraClass: "about" },
            ])
          : originalNavbar
        : addon.settings.get("items");
      items.forEach((item, i) => {
        if (scratchr2List) {
          scratchr2List.append(createItem(item, i + 1 === items.length));
          return;
        }
        searchItem.parentElement.insertBefore(createItem(item), searchItem);
      });
    }
    init();
    addon.settings.addEventListener("change", init);
    addon.self.addEventListener("disabled", init);
    addon.self.addEventListener("reenabled", init);
  }
}
