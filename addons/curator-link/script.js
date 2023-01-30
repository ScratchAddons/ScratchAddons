import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";
import { pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  const pageType = document.location.pathname.substring(1).split("/")[0];

  if (pageType === "" && addon.settings.get("curator")) {
    // Empty string means the front page
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

  if (pageType === "discuss" && addon.settings.get("mentions")) {
    const linkified = [];
    addon.self.addEventListener("disabled", () => {
      for (const { element, original } of linkified) {
        element.innerHTML = original;
      }
    });
    addon.self.addEventListener("reenabled", () => {
      for (const { element } of linkified) {
        pingifyTextNode(element);
      }
    });
    function pingify(element) {
      linkified.push({
        element,
        original: element.innerHTML,
      });
      return pingifyTextNode(element);
    }
    while (true) {
      let post = await addon.tab.waitForElement(".post_body_html", { markAsSeen: true });
      if (!addon.self.disabled) pingify(post);
    }
  }
}
