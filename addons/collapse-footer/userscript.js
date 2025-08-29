export default async function ({ addon, console }) {
  const enabledAddons = await addon.self.getEnabledAddons("community");
  const footer = await addon.tab.waitForElement("#footer");
  const root = document.documentElement;

  const icon = document.createElement("img");
  icon.src = addon.self.dir + "/icon.svg";
  icon.height = 16;
  icon.width = 16;
  icon.className = "sa-footer-arrow";
  icon.draggable = false;
  footer.insertBefore(icon, footer.firstChild);
  addon.tab.displayNoneWhileDisabled(icon);

  if (!(addon.settings.get("infiniteScroll") && enabledAddons.includes("infinite-scroll"))) {
    // If the setting is enabled, infinate-scroll
    // adds the class on the pages it runs on instead
    document.body.classList.add("sa-collapse-footer");
  }

  if (addon.tab.clientVersion === "scratchr2") {
    root.style.setProperty("--footer-hover-height", "250px");
  }

  let collapseTimeout;

  footer.addEventListener("mouseover", () => {
    footer.classList.add("transition", "expanded");
    if (collapseTimeout) {
      clearTimeout(collapseTimeout);
    }
  });

  footer.addEventListener("mouseout", () => {
    collapseTimeout = setTimeout(() => {
      footer.classList.remove("expanded");
    }, 200);
  });
}
