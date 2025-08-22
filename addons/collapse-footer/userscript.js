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

  if (addon.tab.clientVersion === "scratchr2" && !enabledAddons.includes("scratchr2")) {
    root.style.setProperty("--footer-hover-height", "250px");
  }

  if (location.pathname.split("/")[1] === "") {
    // Moves the donor text into the footer on the front page
    const donor = document.getElementById("donor");
    footer.appendChild(donor);
    root.style.setProperty("--footer-hover-height", "410px");
  }

  function setup() {
    footer.addEventListener(addon.settings.get("mode") === "click" ? "click" : "mouseover", expandFooter);

    if (addon.settings.get("mode") === "click") {
      document.addEventListener("mousedown", instantCollapseFooter);
    } else {
      footer.addEventListener("mouseout", collapseFooter);
    }
  }
  setup();

  addon.settings.addEventListener("change", () => {
    document.removeEventListener("mousedown", instantCollapseFooter);
    footer.removeEventListener("mouseout", collapseFooter);
    footer.removeEventListener("click", expandFooter);
    footer.removeEventListener("mouseover", expandFooter);
    setup();
  });
}
