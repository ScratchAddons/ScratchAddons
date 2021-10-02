/**
 * TO-DO:
 * - "No results" notice
 * - Better handling for "Load more"
 */

import Fuse from "../../libraries/thirdparty/fuse.esm.min.js";
import fuseOptions from "./fuse-options.js";

export default async function ({ addon, global, console, msg }) {
  // Inject our search bar
  let search, searchBar, searchDropdown, resultsContainer, fuse;
  let projects = [];
  initialize();
  inject();
  indexPage();

  // Keyboard shortcut for focusing search bar
  document.addEventListener("keypress", (e) => {
    searchBar.focus();
  });

  // Keyboard shortcut for visiting top hit
  search.addEventListener("submit", (e) => {
    e.preventDefault();
    if (searchBar.value !== "" && resultsContainer.childNodes.length > 0)
      window.location.href = resultsContainer.childNodes[0].querySelector("a").href;
  });

  // When the user makes a keystroke in the search bar
  searchBar.addEventListener("input", triggerNewSearch);

  // When the addon is disabled
  addon.self.addEventListener("disabled", () => {
    search.remove();
  });

  // When the addon is re-enabled
  addon.self.addEventListener("reenabled", inject);

  // When the user switches to a new tab (shared, unshared, etc.)
  addon.tab.addEventListener("urlChange", async () => {
    projects = [];
    resultsContainer = undefined;
    await addon.tab.waitForElement(".media-list > li");
    searchDropdown = document.querySelector(".dropdown.button.grey.small");
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
    // Keep track of the dropdown
    await addon.tab.waitForElement(".dropdown.button.grey.small");
    searchDropdown = document.querySelector(".dropdown.button.grey.small");
  }

  /**
   * Adds our new search bar.
   *
   * Since the My Stuff page reloads several elements when switching tabs or
   * filters, some things need to be reinjected or have their references
   * updated.
   */
  async function inject() {
    // Determine which tab we're on and switch the placeholder text
    if (window.location.href.includes("galleries")) {
      searchBar.setAttribute("placeholder", msg("studio-placeholder"));
    } else if (window.location.href.includes("trash")) {
      searchBar.setAttribute("placeholder", msg("trash-placeholder"));
    } else {
      searchBar.setAttribute("placeholder", msg("project-placeholder"));
    }
    // Add new search elements
    await searchDropdown;
    searchDropdown.before(search);
    // Update the element that stores the search results
    resultsContainer = await addon.tab.waitForElement(".media-list > .media-list");
    // Update the dropdown listener
    document.querySelector('.dropdown-menu.radio-style > [data-control="sort"]').addEventListener("click", () => {
      projects = [];
    });
    // Auto-focus the search bar
    searchBar.focus();
  }

  /**
   * Indexes the project tile elements and their project names,
   * then updates the search algorithm.
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
      // Refresh search results if user clicks "load more" or switches tabs with a query still in the search bar
      if (searchBar.value !== "") {
        triggerNewSearch();
      }
    }
  }

  /**
   * Reorders based on fuzzy search algorithm.
   */
  async function triggerNewSearch() {
    let query = searchBar.value;
    await resultsContainer;
    // Blank query should restore the original order
    if (query === "") {
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
}
