import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";
import { pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon }) {
  if (window.location.href === "https://scratch.mit.edu/" && addon.settings.get("curator")) {
    console.log("ak")
    const heading = await addon.tab.waitForElement(".inner.mod-splash:nth-child(2) h4", {
      reduxCondition: (state) => state.splash.featured.status === "FETCHED",
      reduxEvents: ["SET_FETCH_STATUS", "SET_ROWS"],
    });
  
    const curator = addon.tab.redux.state.splash.featured.rows.curator_top_projects[0].curator_name;
    const link = document.createElement("a");
    link.textContent = curator;
    link.href = `https://scratch.mit.edu/users/${curator}/`;
    link.id = "curator-link";

    if (!addon.self.disabled) {
      heading.innerHTML = escapeHTML(addon.tab.scratchMessage("splash.projectsCuratedBy")).replace(
        "{curatorId}",
        link.outerHTML
      );
    }
    addon.self.addEventListener("disabled", () => {
      heading.innerHTML = escapeHTML(addon.tab.scratchMessage("splash.projectsCuratedBy")).replace(
        "{curatorId}",
        curator
      );
    });
    addon.self.addEventListener("reenabled", () => {
      heading.innerHTML = escapeHTML(addon.tab.scratchMessage("splash.projectsCuratedBy")).replace(
        "{curatorId}",
        link.outerHTML
      );
    });
  } else if (addon.settings.get("mentions")) {
    while (true) {
      let post = await addon.tab.waitForElement(".post_body_html", { markAsSeen: true });
      pingifyTextNode(post);
    }
  }
}
