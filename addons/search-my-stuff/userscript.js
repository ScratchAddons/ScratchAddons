/*
 * Injects a search bar element into the page
 * and replaces the existing Sort by dropdown.
 *
 * Searching is done by scanning the page for My Stuff entries
 * and reordering based on relevance, newest, or oldest.
 *
 * This addon has many similarities to `forum-search`.
 */

import Fuse from "../../libraries/thirdparty/fuse.esm.min.js";
import fuseOptions from "./fuse-options.js";

export default async function ({ addon, global, console, msg }) {
  // Create the search bar
  let search = document.createElement("form");
  search.id = "search-my-stuff-form";
  let searchBar = document.createElement("input");
  searchBar.id = "search-my-stuff-input";
  searchBar.setAttribute("type", "text");
  let searchPlaceholder = msg("placeholder");

  searchBar.setAttribute("placeholder", searchPlaceholder);
  search.appendChild(searchBar);

  // Create the new "sort by"
  let searchDropdown = document.createElement("select");
  searchDropdown.id = "search-my-stuff-dropdown";
  let types = ["relevance", "newest", "oldest"];
  for (let type of types) {
    let dropdownOption = document.createElement("option");
    dropdownOption.value = type;
    dropdownOption.appendChild(document.createTextNode(msg(type)));
    searchDropdown.appendChild(dropdownOption);
  }
  search.appendChild(searchDropdown);

  // Now remove the old "sort by" and add our new search elements
  await addon.tab.waitForElement(".dropdown.radio-style.button.grey.small");
  document.querySelector(".dropdown.radio-style.button.grey.small").remove();
  let navIndex = document.querySelector(".inner");
  navIndex.appendChild(search);

  // Index page
  let projects = [];
  let fuse;
  await addon.tab.waitForElement("ul.media-list");
  let resultsContainer = document.querySelector("ul.media-list");
  indexPage();

  // When the user makes a keystroke in the search bar
  searchBar.addEventListener("input", (e) => {
    triggerNewSearch();
  });

  // When a new filter is selected from the dropdown
  searchDropdown.addEventListener("change", (e) => {
    if (!fuse) indexPage();
    triggerNewSearch();
  });

  // Indexes the project tile elements and their project names,
  // then updates the search algorithm
  async function indexPage() {
    while (true) {
      const project = await addon.tab.waitForElement(".media-list > li", {
        markAsSeen: true,
      });
      projects.push({
        name: project.querySelector(".media-info-item.title > a").innerText,
        element: project,
      });
      fuse = new Fuse(projects, fuseOptions);
      // Refresh search if user clicks "load more" after searching
      if (searchBar.value != "") {
        triggerNewSearch();
      }
    }
  }

  // Reorders based on "sort by"
  // (relevance algorithm is the same as SA settings page)
  function triggerNewSearch() {
    let query = searchBar.value;
    let filter = searchDropdown.value;
    // Blank query should restore the original order
    if (query == "") {
      projects.forEach((project) => {
        project.element.remove();
        resultsContainer.appendChild(project.element);
      });
      return;
    }
    const fuseSearch = fuse.search(query).sort((a, b) => {
      // Sort very good matches at the top no matter what
      if ((a.score < 0.1) ^ (b.score < 0.1)) return a.score < 0.1 ? -1 : 1;
    });
    projects.forEach((project) => {
      project.element.remove();
    });
    fuseSearch.forEach((result) => {
      resultsContainer.appendChild(result.item.element);
    });
  }
}
