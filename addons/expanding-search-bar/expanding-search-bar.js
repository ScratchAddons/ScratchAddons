export default async function ({ addon, global, console }) {

	///scratch-www checking
	var exsearch_isWWW; //True if scratch-www, false if not
	if (document.getElementsByClassName("site-nav")[0]) {
		exsearch_isWWW = false;
	} else {
		exsearch_isWWW = true;
	}
	
	///Other functions
	function exsearch_NoDispIfExist(name) { // Sets the display of a class's 1st element to "none" if it exists
		var elem = document.getElementsByClassName(name)[0]; // The element itself
		if (elem) {elem.style.display = "none";}
		}
	function exsearch_DelDispIfExist(name) { // Deletes the display param of a class's 1st element if it exists
		var elem = document.getElementsByClassName(name)[0]; // The element itself
		if (elem) {elem.style.removeProperty("display");}
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
		//Functions
		function exsearch_clickIn() { //Clicking into the search bar
			exsearch_NoDispIfExist("create"); //Create
			exsearch_NoDispIfExist("explore"); //Explore
			exsearch_NoDispIfExist("ideas"); //Ideas
			exsearch_NoDispIfExist("about"); //About
			exsearch_NoDispIfExist("discuss"); //SA Discuss button compatibility
		}
		function exsearch_clickOut() { //Clicking out of  the search bar
			exsearch_DelDispIfExist("create"); //Create
			exsearch_DelDispIfExist("explore"); //Explore
			exsearch_DelDispIfExist("ideas"); //Ideas
			exsearch_DelDispIfExist("about"); //About
			exsearch_DelDispIfExist("discuss"); //SA Discuss button compatibility
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
