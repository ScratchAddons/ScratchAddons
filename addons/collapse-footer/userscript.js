export default async function ({ addon, console }) {
  const enabledAddons = await addon.self.getEnabledAddons("community");
  const root = document.documentElement;

  let collapseTimeout;

  function collapseFooter() {
    collapseTimeout = setTimeout(() => {
      footer.classList.remove("expanded");
    }, 200);
  }

  function instantCollapseFooter(event) {
    // Only hide if the click is outside the footer
    if (!footer.contains(event.target)) footer.classList.remove("expanded");
  }

  function expandFooter() {
    footer.classList.add("transition", "expanded");
    if (collapseTimeout) {
      clearTimeout(collapseTimeout);
    }
  }

  if (!(addon.settings.get("infiniteScroll") && enabledAddons.includes("infinite-scroll"))) {
    // If the setting is enabled, infinate-scroll
    // adds the class on the pages it runs on instead
    document.body.classList.add("sa-collapse-footer");
  }

  if (addon.tab.clientVersion === "scratchr2") {
    root.style.setProperty("--footer-hover-height", "250px");
  }

  while (true) {
    const footer = await addon.tab.waitForElement("#footer", {
      markAsSeen: true,
      reduxCondition: (state) => (state.scratchGui ? state.scratchGui.mode.isPlayerOnly : true),
    });

    const icon = document.createElement("img");
    icon.src = addon.self.dir + "/icon.svg";
    icon.height = 16;
    icon.width = 16;
    icon.className = "sa-footer-arrow";
    icon.draggable = false;
    footer.insertBefore(icon, footer.firstChild);
    addon.tab.displayNoneWhileDisabled(icon);

    if (addon.settings.get("mode") === "click") {
      footer.addEventListener("click", expandFooter);
      document.addEventListener("mousedown", instantCollapseFooter);
    } else {
      footer.addEventListener("mouseover", expandFooter);
      footer.addEventListener("mouseout", collapseFooter);
    }
  }
}
