export default async function ({ addon, console }) {
  if (addon.tab.clientVersion === null) return; //if neither www or r2, exit

  var exsearch_searchBar; //The search bar element

  //Wait for the search bar to load (we get the header links as we hide/show them, no need to worry about that)
  //Also we set the search bar value here too
  while (true) {
    exsearch_searchBar = await addon.tab.waitForElement(
      addon.tab.clientVersion === "scratch-www" ? "#frc-q-1088" : "#search-input",
      {
        markAsSeen: true,
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
      },
    );

    ///Events
    if (addon.tab.clientVersion === "scratch-www") {
      //We're on scratch-www

      //Elements
      var exsearch_links; //Header links

      //Functions
      function exsearch_getLinks() {
        //Gets all header links
        return document.querySelectorAll(".link:not(.search ~ *)"); //All .links before .search
      }

      function exsearch_clickIn() {
        //Clicking into the search bar
        if (addon.self.disabled) return; //Don't expand if addon disabled
        let i;
        exsearch_links = exsearch_getLinks(); //Get the links
        for (i = 0; i < exsearch_links.length; i++) {
          //Iterate the links
          if (exsearch_links[i]) {
            exsearch_links[i].style.display = "none";
          } //Hide them
        }
      }
      function exsearch_clickOut() {
        //Clicking out of  the search bar
        let i;
        exsearch_links = exsearch_getLinks(); //Get the links
        for (i = 0; i < exsearch_links.length; i++) {
          //Iterate the links
          if (exsearch_links[i]) {
            exsearch_links[i].style.removeProperty("display");
          } //Show them
        }
      }
      //Events
      exsearch_searchBar.addEventListener("focusin", exsearch_clickIn);
      exsearch_searchBar.addEventListener("focusout", exsearch_clickOut);

      addon.self.addEventListener("disabled", () => exsearch_clickOut());
    } else {
      //We're on scratchr2

      //Elements
      var exsearch_siteNav; //The site navigation buttons
      exsearch_siteNav = document.getElementsByClassName("site-nav")[0]; //The header buttons

      //Functions
      function exsearch_clickIn() {
        //Clicking into the search bar
        if (addon.self.disabled) return; //Don't expand if addon disabled
        exsearch_siteNav.style.display = "none"; //Hide the site navigation
      }
      function exsearch_clickOut() {
        //Clicking out of  the search bar
        exsearch_siteNav.style.removeProperty("display"); //Show the site nav
      }
      //Events
      exsearch_searchBar.addEventListener("focusin", exsearch_clickIn);
      exsearch_searchBar.addEventListener("focusout", exsearch_clickOut);

      addon.self.addEventListener("disabled", () => exsearch_clickOut());
    }
  }
}
