/*
 * Injects a search bar element into the page
 * and replaces the existing Sort by dropdown.
 * 
 * Searching is done by scanning the page for My Stuff entries
 * and reordering based on relevance, newest, or oldest.
 * 
 * This addon has many similarities to `forum-search`.
 */
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

  // When the user makes a keystroke in the search bar
  searchBar.addEventListener("input", (e) => {
    triggerNewSearch(searchBar.value, searchDropdown.value);
  });
  
  // When a new filter is selected from the dropdown
  searchDropdown.addEventListener("change", (e) => {
    triggerNewSearch(searchBar.value, searchDropdown.value);
  });

  // Searches the My Stuff page for matching project titles,
  // then reorders based on "sort by"
  // (relevance algorithm is the same as SA settings page)
  function triggerNewSearch() {
    
  }
}