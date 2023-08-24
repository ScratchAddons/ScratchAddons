export default async function ({ addon, console }) {
  if (addon.tab.clientVersion === null) return; //if neither www or r2, exit

  var exsearch_searchBar; //The search bar element
  var exsearch_searchBarInput; //The input portion of the search bar element

  //Wait for the search bar to load (we get the header links as we hide/show them, no need to worry about that)
  //Also we set the search bar value here too
  while (true) {
    exsearch_searchBarInput = await addon.tab.waitForElement(
      addon.tab.clientVersion === "scratch-www" ? "#frc-q-1088" : "#search-input",
      {
        markAsSeen: true,
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
      }
    );
    exsearch_searchBar = exsearch_searchBarInput.closest(".search");

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
            exsearch_links[i].style.width = "0px";
            let ahref = exsearch_links[i].querySelector("a");
            ahref.style.setProperty("padding", "0px", "important");
            let span = exsearch_links[i].querySelector("span");
            span.style.display = "none";
          } //Hide them (make them invisible but maintain keyboard-focusablility)
        }
      }
      function exsearch_clickOut() {
        //Clicking out of  the search bar
        let i;
        exsearch_links = exsearch_getLinks(); //Get the links
        for (i = 0; i < exsearch_links.length; i++) {
          //Iterate the links
          if (exsearch_links[i]) {
            exsearch_links[i].style.removeProperty("width");
            let ahref = exsearch_links[i].querySelector("a");
            ahref.style.removeProperty("padding");
            let span = exsearch_links[i].querySelector("span");
            span.style.removeProperty("display");
          } //Show them
        }
      }
      //Events
      exsearch_searchBarInput.addEventListener("focusin", exsearch_clickIn);
      exsearch_searchBar.addEventListener("focusout", (e) => {
        if (!exsearch_searchBar.contains(e.relatedTarget)) {
          exsearch_clickOut();
        }
      });

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
        exsearch_siteNav.style.width = "0px"; //Hide the site navigation (make them invisible but maintain keyboard-focusablility)
        exsearch_siteNav.style.overflow = "hidden";
      }
      function exsearch_clickOut() {
        //Clicking out of  the search bar
        exsearch_siteNav.style.removeProperty("width"); //Show the site nav
        exsearch_siteNav.style.removeProperty("overflow");
      }
      //Events
      exsearch_searchBarInput.addEventListener("focusin", exsearch_clickIn);
      exsearch_searchBar.addEventListener("focusout", (e) => {
        if (!exsearch_searchBar.contains(e.relatedTarget)) {
          exsearch_clickOut();
        }
      });

      addon.self.addEventListener("disabled", () => exsearch_clickOut());
    }
  }
}
