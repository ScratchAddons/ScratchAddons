export default async function ({ addon, global, console }) {
	if (addon.tab.clientVersion == null) return; //if neither www or r2, exit
	
	var exsearch_searchBar; //The search bar element
	
	///Events
	if (addon.tab.clientVersion == "scratch-www") { //We're on scratch-www
		
		//Elements
		exsearch_searchBar = document.getElementById("frc-q-1088"); //The scratch-www search input
		var exsearch_links; //Header links

		//Functions
		function exsearch_getLinks() { //Gets all header links
			return document.querySelectorAll(".link:not(.search ~ *)") //All .links before .search
		}
		
		function exsearch_clickIn() { //Clicking into the search bar
			let i;
			exsearch_links = exsearch_getLinks(); //Get the links
			for (i=0; i<exsearch_links.length; i++) { //Iterate the links
				if (exsearch_links[i]) {exsearch_links[i].style.display = "none";} //Hide them
			}
		}
		function exsearch_clickOut() { //Clicking out of  the search bar
			let i;
			exsearch_links = exsearch_getLinks(); //Get the links
			for (i=0; i<exsearch_links.length; i++) { //Iterate the links
				if (exsearch_links[i]) {exsearch_links[i].style.removeProperty("display")} //Show them
			}
		}
		//Events 
		exsearch_searchBar.addEventListener("focusin", exsearch_clickIn);
		exsearch_searchBar.addEventListener("focusout", exsearch_clickOut);
		
	} else { //We're on scratchr2
		
		//Elements
		var exsearch_siteNav; //The site navigation buttons
		exsearch_searchBar = document.getElementById("search-input"); //The search bar
		exsearch_siteNav   = document.getElementsByClassName("site-nav")[0]; //The header buttons
		
		//Functions
		function exsearch_clickIn() { //Clicking into the search bar
			exsearch_siteNav.style.display = "none"; //Hide the site navigation
		}
		function exsearch_clickOut() { //Clicking out of  the search bar
			exsearch_siteNav.style.removeProperty("display"); //Show the site nav
		}
		//Events 
		exsearch_searchBar.addEventListener("focusin", exsearch_clickIn);
		exsearch_searchBar.addEventListener("focusout", exsearch_clickOut);
	}
}
