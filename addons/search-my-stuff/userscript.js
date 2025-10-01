import Fuse from "../../libraries/thirdparty/cs/fuse.esm.min.js";
import fuseOptions from "./fuse-options.js";

export default async function ({ addon, console, msg }) {
  // Inject our search bar
  let search,
    searchBar,
    searchDropdown,
    loadMore,
    loading,
    allLoaded,
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
    // Ignore input
    // 1) in <input> or <textarea>
    // 2) with Ctrl/Alt/Meta keys pressed (probably browser shortcut keys)
    // 3) that is not represented by one alphanumeric key code (probably special letters)
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      !/^\w$/.test(e.key)
    )
      return;
    searchBar.focus();
  });

  // Keyboard shortcut for visiting top hit
  search.addEventListener("keydown", (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === "Enter" &&
      searchBar.value !== "" &&
      resultsContainer.childNodes.length > 0
    )
      window.location.href = resultsContainer.childNodes[0].querySelector("a").href;
  });
  search.addEventListener("submit", (e) => {
    e.preventDefault();
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
    currentPage = 1;
    allLoaded = false;
    resultsContainer = undefined;
    await addon.tab.waitForElement(".media-list > li");
    searchDropdown = document.querySelector(".dropdown.button.grey.small");
    inject();
    originalDropdownText = searchDropdown.querySelector("span").innerText;
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
    if (addon.self.disabled) return;
    // Determine which tab we're on and switch the placeholder text
    if (window.location.href.includes("galleries")) {
      searchBar.setAttribute("placeholder", msg("studio-placeholder"));
    } else if (window.location.href.includes("trash")) {
      searchBar.setAttribute("placeholder", msg("trash-placeholder"));
    } else {
      searchBar.setAttribute("placeholder", msg("project-placeholder"));
    }
    // Add new search elements
    await addon.tab.waitForElement(".dropdown.button.grey.small");
    searchDropdown.before(search);
    // Update the element that stores the search results
    resultsContainer = await addon.tab.waitForElement(".media-list > .media-list");
    // Update the dropdown listener
    document.querySelector('.dropdown-menu.radio-style > [data-control="sort"]').addEventListener("click", () => {
      currentPage = 1;
      projects = [];
    });
    // Store the element of the load more button
    loadMore = await addon.tab.waitForElement('[data-control="load-more"]');
    loadMore.addEventListener("click", () => {
      autoLoadMore();
    });
    // Auto-focus the search bar
    searchBar.focus({
      preventScroll: true,
    });
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
    // Empty page, do nothing
    if (!fuse) return;
    // Blank query should restore the original order
    if (searchBar.value === "") {
      searchDropdown.querySelector("span span").innerText = originalDropdownText;
      statusHeader.remove();
      statusTip.remove();
      loadMore.style.display = "";
      projects.forEach((project) => {
        project.element.remove();
        resultsContainer.appendChild(project.element);
      });
    } else {
      searchDropdown.querySelector("span span").innerText = msg("search-by");
      const fuseSearch = fuse.search(searchBar.value).sort((a, b) => {
        // Sort very good matches at the top no matter what
        if ((a.score < 0.1) ^ (b.score < 0.1)) return a.score < 0.1 ? -1 : 1;
        // ES2019 guarantees stable sort
        return 0;
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
    if (resultsContainer && searchBar.value !== "" && !loading) {
      if (resultsContainer.querySelectorAll("li").length === 0) {
        autoLoadMore();
      } else if (allLoaded) {
        // End of results
        statusHeader.innerText = msg("end-header");
        statusTip.innerText = msg("end-tip");
      } else {
        // Prompt to load more
        statusHeader.innerText = msg("load-more-header");
        statusTip.innerText = msg("load-more-tip");
        loadMore.style.display = "";
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
      loadMore.style.display = "none";
      // Begin the process of loading more projects
      loadMore.click();
      currentPage++;
      // Display "Searching..." status
      statusHeader.innerText = msg("progress-header");
      statusTip.innerText = msg("progress-tip", { number: (currentPage - 2) * 40 });
      // Detect if the next page of projects exists
      let fetchUrl;
      let ascSort,
        descSort = "";
      let sort = document.querySelectorAll(".dropdown.button.grey.small");
      if (window.location.href.includes("galleries")) {
        // Ignore "hosted/curated by me" because the API endpoints are broken
        sort = sort[1].querySelector("li.selected");
        fetchUrl = "galleries/all";
      } else {
        sort = sort[0].querySelector("li.selected");
        if (window.location.href.includes("trash")) {
          fetchUrl = "trashed/all";
        } else if (window.location.href.includes("unshared")) {
          fetchUrl = "projects/notshared";
        } else if (window.location.href.includes("shared")) {
          fetchUrl = "projects/shared";
        } else {
          fetchUrl = "projects/all";
        }
      }
      ascSort = sort.getAttribute("data-ascsort") || "";
      descSort = sort.getAttribute("data-descsort") || "";
      fetchUrl = `https://scratch.mit.edu/site-api/${fetchUrl}/?page=${currentPage}&ascsort=${ascSort}&descsort=${descSort}`;
      await fetch(fetchUrl)
        .then(async (response) => {
          // Determines whether or not new results were found
          if (response.ok) {
            await projects[initResultsCount];
            await triggerNewSearch().then(() => {
              if (resultsContainer.querySelectorAll("li").length !== initResultsCount) {
                // Do not keep loading more if new results were found
                loading = false;
              }
            });
          } else {
            // Do not keep loading more if we've reached the end of the page
            loading = false;
            allLoaded = true;
          }
        })
        .catch(() => {
          loading = false;
        });

      if (loading) {
        // Prevents API spam
        setTimeout(() => {
          loading = false;
          autoLoadMore();
        }, 500);
      } else if (resultsContainer) {
        // If "Load more" can be clicked again
        if (resultsContainer.querySelectorAll("li").length !== initResultsCount) {
          // Prompt to load more
          statusHeader.innerText = msg("load-more-header");
          statusTip.innerText = msg("load-more-tip");
          loadMore.style.display = "";
        } else if (resultsContainer.querySelectorAll("li").length !== 0) {
          // End of results
          statusHeader.innerText = msg("end-header");
          statusTip.innerText = msg("end-tip");
        } else {
          // No results
          statusHeader.innerText = msg("no-results-header");
          statusTip.innerText = msg("no-results-tip");
        }
        statusHeader.remove();
        statusTip.remove();
        resultsContainer.appendChild(statusHeader);
        resultsContainer.appendChild(statusTip);
      }
    }
  }
}
