import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";

/**
 * @param {import("../types").UserscriptUtilities} param0
 */
export default async function ({ addon }) {
  const oldh4 = document.querySelector(".inner:last-of-type h4");

  const resp = await fetch("https://api.scratch.mit.edu/proxy/featured");
  const result = await resp.json();
  const curator = result.curator_top_projects[0].curator_name;

  const link = document.createElement("a");
  link.textContent = curator;
  link.href = `https://scratch.mit.edu/users/${curator}`;
  link.id = "curator-link";

  oldh4.innerHTML = escapeHTML(addon.tab.scratchMessage("splash.projectsCuratedBy")).replace(
    "{curatorId}",
    link.outerHTML
  );
}
