/** @param {import("addonAPI").AddonAPI} */
export default async function ({ addon }) {
  let menuItem;

  const change = async () => {
    if (!addon.auth.fetchIsLoggedIn()) return;

    if (addon.settings.get("compact-nav") && !addon.self.disabled) {
      const span = menuItem.appendChild(document.createElement("span"));
      span.className = "sa-profile-name";
      span.textContent = await addon.auth.fetchUsername();
    } else {
      menuItem.querySelector(".sa-profile-name")?.remove();
    }
  };

  addon.settings.addEventListener("change", change);
  addon.self.addEventListener("disabled", change);
  addon.self.addEventListener("reenabled", change);

  while (true) {
    menuItem = await addon.tab.waitForElement(".account-nav .dropdown > :first-child > :first-child", {
      markAsSeen: true,
      reduxCondition: (state) => state?.scratchGui?.mode?.isPlayerOnly ?? true,
    });
    change();
  }
}
