export default async function ({ addon, console }) {
  if (!addon.settings.get("infiniteScroll")) {
    // If the setting is enabled infinate-scroll
    // adds the class on the pages it runs on instead
    document.body.classList.add("sa-collapse-footer");
  }

  if (location.pathname.split("/")[1] === "") {
    // Moves the donor text into the footer on the front page
    const root = document.documentElement;
    const footer = await addon.tab.waitForElement("#footer");
    const donor = await addon.tab.waitForElement("#donor");
    footer.appendChild(donor);
    root.style.setProperty("--footer-hover-height", "426px");
  }
}
