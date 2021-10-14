/**
 * TO-DO:
 * - Support for tabs (autoLoadMore)
 */

import Fuse from "../../libraries/thirdparty/fuse.esm.min.js";
import fuseOptions from "./fuse-options.js";

export default async function ({ addon, global, console, msg }) {
  // Inject our search bar
  let search,
    searchBar,
    searchDropdown,
    loadMore,
    loading,
    originalDropdownText,
    resultsContainer,
    statusHeader,
    statusTip,
    fuse;
  let projects = [];
  let currentPage = 1;
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
  searchBar.addEventListener("input", () => {
    triggerNewSearch().then(determineLoadMore);
  });

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
    searchDropdown = await addon.tab.waitForElement(".dropdown.button.grey.small");
    originalDropdownText = searchDropdown.querySelector("span").innerText;
    loadMore = await addon.tab.waitForElement('[data-control="load-more"]');
    loadMore.addEventListener("click", () => {
      autoLoadMore();
    });
    // Create status header
    statusHeader = document.createElement("h2");
    statusHeader.id = "search-my-stuff-header";
    // Create tip beneath header
    statusTip = document.createElement("span");
    statusTip.id = "search-my-stuff-tip";
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
        triggerNewSearch().then(determineLoadMore);
      }
    }
  }

  /**
   * Reorders based on fuzzy search algorithm.
   */
  async function triggerNewSearch() {
    await resultsContainer;
    // Blank query should restore the original order
    if (searchBar.value === "") {
      searchDropdown.querySelector("span.selected").innerText = originalDropdownText;
      statusHeader.remove();
      statusTip.remove();
      loadMore.style.visibility = "visible";
      projects.forEach((project) => {
        project.element.remove();
        resultsContainer.appendChild(project.element);
      });
    } else {
      searchDropdown.querySelector("span.selected").innerText = msg("search-by");
      const fuseSearch = fuse.search(searchBar.value).sort((a, b) => {
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
   * Determines if the page should automatically load more items.
   * If so, `autoLoadMore()` is called.
   */
  function determineLoadMore() {
    if (searchBar.value !== "" && !loading) {
      if (resultsContainer.querySelectorAll("li").length === 0) {
        autoLoadMore();
      } else if (loadMore.style.display == "none") {
        // End of results
        statusHeader.innerText = msg("end-header");
        statusTip.innerText = msg("end-tip");
      } else {
        // Prompt to load more
        statusHeader.innerText = msg("load-more-header");
        statusTip.innerText = msg("load-more-tip");
        loadMore.style.visibility = "visible";
      }
      resultsContainer.appendChild(statusHeader);
      resultsContainer.appendChild(statusTip);
    }
  }

  /**
   * Attempts to load more until results are found or everything has loaded.
   */
  async function autoLoadMore() {
    if (searchBar.value !== "" && !loading) {
      loading = true;
      const initResultsCount = resultsContainer.querySelectorAll("li").length;
      loadMore.style.visibility = "hidden";
      // Begin the process of loading more projects
      loadMore.click();
      currentPage++;
      // Display "Loading..." status
      statusHeader.innerText = msg("progress-header");
      statusTip.innerText = msg("progress-tip", { number: (currentPage - 2) * 40 });
      // Detect if the next page of projects exists
      await fetch(`https://scratch.mit.edu/site-api/projects/all/?page=${currentPage}&ascsort=&descsort=`)
        .then(async (response) => {
          // If so, wait until new results are available
          if (response.ok) {
            await resultsContainer[initResultsCount];
          } else {
            loading = false;
          }
        })
        .catch(() => {
          loading = false;
        });
      // If the previous page request was successful, keep trying to load more
      if (loading) {
        // Prevents API spam
        setTimeout(() => {
          loading = false;
          autoLoadMore();
        }, 500);
      } else {
        // If "Load more" can be clicked again
        if (resultsContainer.querySelectorAll("li").length !== initResultsCount) {
          // Prompt to load more
          statusHeader.innerText = msg("load-more-header");
          statusTip.innerText = msg("load-more-tip");
          loadMore.style.visibility = "visible";
        } else if (resultsContainer.querySelectorAll("li").length !== 0) {
          // End of results
          statusHeader.innerText = msg("end-header");
          statusTip.innerText = msg("end-tip");
        } else {
          // No results
          statusHeader.innerText = msg("no-results-header");
          statusTip.innerText = msg("no-results-tip");
        }
      }
    }
  }
}
