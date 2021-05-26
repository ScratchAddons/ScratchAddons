export default async function ({ addon, global, console }) {

	///scratch-www checking
	var exsearch_isWWW; //True if scratch-www, false if not
	if (document.getElementsByClassName("site-nav")[0]) {
		exsearch_isWWW = false;
	} else {
		exsearch_isWWW = true;
	}
	
	
	///"""Constants"""
	var exsearch_searchBar; //The search bar element
	if (exsearch_isWWW) {
		//scratch-www constants
		exsearch_searchBar = document.getElementById("frc-q-1088"); //The scratch-www search bar
	} else {
		//scratchr2 constants
		var exsearch_siteNav; //The site navigation buttons
		exsearch_searchBar = document.getElementById("search-input"); //The search bar
		exsearch_siteNav   = document.getElementsByClassName("site-nav")[0]; //The header buttons
	}

	///Events
	//check scratchr2
	if (exsearch_isWWW) { //We're on scratch-www
		
		var exsearch_links;
		
		//Functions
		function exsearch_getLinks() { //Gets all header links
			let e = document.getElementsByClassName("link")[0]; //The first link
			let list = []; //The list
			
			while (e.classList.contains("link")) { //Repeat until the element is NOT a link
				list.push(e); //Add
				e = e.nextSibling; //Next 
			}
			return list;
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