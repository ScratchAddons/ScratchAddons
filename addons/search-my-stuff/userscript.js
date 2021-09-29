/**
 * Injects a search bar element into the page
 * and replaces the existing Sort by dropdown.
 *
 * Searching is done by scanning the page for My Stuff entries
 * and reordering based on relevance, newest, or oldest.
 *
 * This addon has many similarities to `forum-search`.
 * 
 * TO-DO:
 * - "No results" notice
 * - Filters
 * - `/` and `enter` hotkeys
 * - Better handling for "Load more"
 */

import Fuse from "../../libraries/thirdparty/fuse.esm.min.js";
import fuseOptions from "./fuse-options.js";

export default async function ({ addon, global, console, msg }) {
  // Inject our custom components
  let search, searchBar, searchDropdown, oldDropdown, resultsContainer;
  initialize();
  inject();

  // Index page
  let projects = [];
  let fuse;
  indexPage();

  // When the user hits enter in the search bar
  // (we don't actually want anything to happen since searching is automatic)
  search.addEventListener("submit", (e) => {
    e.preventDefault();
  });
  
  // When the user makes a keystroke in the search bar
  searchBar.addEventListener("input", triggerNewSearch);

  // When a new filter is selected from the dropdown
  searchDropdown.addEventListener("change", () => {
    if (!fuse) indexPage();
    triggerNewSearch();
  });

  // When the addon is disabled
  addon.self.addEventListener("disabled", destroy);

  // When the addon is re-enabled
  addon.self.addEventListener("reenabled", inject);

  // When the user switches to a new tab (shared, unshared, etc.)
  addon.tab.addEventListener("urlChange", async () => {
    projects = [];
    resultsContainer = undefined;
    await addon.tab.waitForElement(".media-list > li");
    inject();
  });

  async function initialize() {
    // Create the search bar
    search = document.createElement("form");
    search.id = "search-my-stuff-form";
    searchBar = document.createElement("input");
    searchBar.id = "search-my-stuff-input";
    searchBar.setAttribute("type", "text");
    search.appendChild(searchBar);

    // Create the new "sort by"
    searchDropdown = document.createElement("select");
    searchDropdown.id = "search-my-stuff-dropdown";
    let types = ["relevance", "newest", "oldest"];
    for (let type of types) {
      let dropdownOption = document.createElement("option");
      dropdownOption.value = type;
      dropdownOption.appendChild(document.createTextNode(msg(type)));
      searchDropdown.appendChild(dropdownOption);
    }
    search.appendChild(searchDropdown);
  }

  /**
   * Removes the old "sort by" and adds our new search elements.
   */
  async function inject() {
    // Keep track of the old dropdown for removal and readding later
    await addon.tab.waitForElement(".dropdown.button.grey.small");
    oldDropdown = document.querySelector(".dropdown.button.grey.small");
    oldDropdown.remove();
    // Determine if we're on the My Studios tab
    if (window.location.href.includes("galleries")) {
      searchBar.setAttribute("placeholder", msg("studio-placeholder"));
    } else {
      searchBar.setAttribute("placeholder", msg("project-placeholder"));
    }
    // Add new search elements
    let navIndex = document.querySelector(".inner");
    navIndex.appendChild(search);
    // Update the element that stores the search results
    resultsContainer = await addon.tab.waitForElement(".media-list > .media-list");
  }

  /**
   * Indexes the project tile elements and their project names,
   * then updates the search algorithm
   */
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
      // Refresh search if user clicks "load more" or switches tabs after searching
      if (searchBar.value != "") {
        triggerNewSearch();
      }
    }
  }

  /** 
   * Reorders based on "sort by"
   * (relevance algorithm is the same as SA settings page)
   */
  async function triggerNewSearch() {
    let query = searchBar.value;
    let filter = searchDropdown.value;
    await resultsContainer;
    // Blank query should restore the original order
    if (query == "") {
      projects.forEach((project) => {
        project.element.remove();
        resultsContainer.appendChild(project.element);
      });
    } else {
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

  /**
   * Removes our custom components and restores the original dropdown.
   */
  async function destroy() {
    search.remove();
    let navIndex = document.querySelector(".inner");
    navIndex.appendChild(oldDropdown);
  }
}
