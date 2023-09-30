import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";
export default async function ({ addon }) {
  const heading = await addon.tab.waitForElement(".inner.mod-splash + .inner.mod-splash h4", {
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
}
