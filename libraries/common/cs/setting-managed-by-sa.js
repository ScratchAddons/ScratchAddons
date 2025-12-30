export function managedBySa(addon, submenu) {
  submenu.addEventListener(
    "click",
    (e) => {
      if (addon.self.disabled) return;
      if (!e.target.closest(".sa-managed-submenu")) {
        // Something went wrong with the code below this event listener
        return;
      }
      if (e.target.closest(".sa-addon-settings-link")) {
        window.open(`https://scratch.mit.edu/scratch-addons-extension/settings#addon-${addon.self.id}`);
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
    },
    { capture: true }
  );

  const elementToClone = submenu.querySelector("[class*=settings-menu_selected_]").closest("li");

  const SA_ICON_URL = addon.self.dir + "/../../images/cs/icon.svg";

  const managedBySa = elementToClone.cloneNode(true);
  addon.tab.displayNoneWhileDisabled(managedBySa);
  managedBySa.classList.add("sa-managed-item");
  managedBySa.querySelector("div span").textContent = scratchAddons.l10n.get("_general/meta/managedBySa");
  const managedBySaIcon = managedBySa.querySelector("img[class*=settings-menu_icon_]");
  if (managedBySaIcon) managedBySaIcon.src = SA_ICON_URL;

  const addonSettingsLink = elementToClone.cloneNode(true);
  addon.tab.displayNoneWhileDisabled(addonSettingsLink);
  addonSettingsLink.classList.add("sa-addon-settings-link");
  addonSettingsLink.classList.add(addon.tab.scratchClass("menu_menu-section") || "_");
  addonSettingsLink.querySelector("div span").textContent = scratchAddons.l10n.get("_general/meta/addonSettings");
  let addonSettingsIcon = addonSettingsLink.querySelector("img[class*=settings-menu_icon_]");
  if (!addonSettingsIcon) {
    // The menu doesn't have icons. Replace the checkmark with an icon.
    addonSettingsIcon = addonSettingsLink.querySelector("img");
    addonSettingsIcon.className = addon.tab.scratchClass("settings-menu_icon");
  }
  addonSettingsIcon.src = SA_ICON_URL;
  const newTabIcon = document.createElement("img");
  newTabIcon.classList.add("sa-new-tab-icon");
  newTabIcon.src = addon.self.dir + "/../../images/cs/open-link.svg";
  addonSettingsLink.querySelector("div").appendChild(newTabIcon);

  submenu.classList.add("sa-managed-submenu");
  submenu.appendChild(managedBySa);
  submenu.appendChild(addonSettingsLink);
}
