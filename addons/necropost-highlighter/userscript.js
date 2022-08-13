/**
 * @author RT_Borg
 * 
 * Necropost Highlighter
 * 
 * Uses topic id as a proxy for age, which doesn't require loading other pages
 * to read actual dates.
 *
 * The number of new topics per month on Scratch forums is fairly stable over time.
 * Since the topic interval doesn't need to be precise to determine a likely necropost,
 * this ends up working very well.
 *
 * Inspects topic ids of all posts on the page and highlights any topics significantly
 * older than surrounding posts.
 * 
 * Works with:
 *   - Addon: Website dark mode and customizable colors
 *   - Addon: Infinite scrolling
 *   - Standard and Mobile websites
 */

export default async function ({ addon, global, console }) {
	// Default is a little over a month's worth of topics. Reasonably stable through 2022.
	// There's a lot of tolerance. Half or twice as many topics filter pretty much the same.
	const defaultTopicInterval = 7500;
	const defaultForums = [
		"New Scratchers",
		"Help with Scripts",
		"Questions about Scratch",
		"Bugs and Glitches",
		"Project Ideas"
	];
	// Forums beyond these seem very poor options,
	// as many posts live long or are appropriately revived
	const customForumSettingToForum = {
		"applyToNewScratchers": "New Scratchers",
		"applyToHelpWithScripts": "Help with Scripts",
		"applyToQuestionsAboutScratch": "Questions about Scratch",
		"applyToBugsAndGlitches": "Bugs and Glitches",
		"applyToProjectIdeas": "Project Ideas",
		"applyToRequests": "Requests",
		"applyToSuggestions": "Suggestions",
		"applyToOpenSourceProjects": "Open Source Projects"
	};
	const searchResultsPageName = "Search Results"; // recent posts and unanswered posts
	let isMobileSite = await determineIsMobileSite();
	let forumOrSearchPageName = await determineForumOrSearchPageName();

	highlightNecropostsIfOnSelectedForumPage();
	
	addon.settings.addEventListener("change", onAddonSettingsChange);
	addon.self.addEventListener("disabled", onDisabled);
	addon.self.addEventListener("reenabled", onReenabled);
	
	// Support for infinite scrolling (only available on Standard not Mobile)
	const tableBodyNode = document.querySelector("tbody"); // null on mobile
	const config = {childList: true};
	const tableBodyMutationObserver = new MutationObserver(onRowsChanged);
	attachMutationObserverOnStandardSite();

	/***********************************************************************
	 * Callbacks
	 ***********************************************************************/
	async function onAddonSettingsChange() {
		await removeAnyPriorHighlights();
		await highlightNecropostsIfOnSelectedForumPage();
	}

	async function onDisabled() {
		detatchMutationObserverOnStandardSite();
		await removeAnyPriorHighlights();
	}
	
	async function onReenabled() {
		attachMutationObserverOnStandardSite();
		await highlightNecropostsIfOnSelectedForumPage();
	}

	function attachMutationObserverOnStandardSite() {
		if (!isMobileSite) {
			tableBodyMutationObserver.observe(tableBodyNode, config);
		}
	}

	function detatchMutationObserverOnStandardSite() {
		if (!isMobileSite) {
			tableBodyMutationObserver.takeRecords(); // and discard
			tableBodyMutationObserver.disconnect();
		}
	}

	/**
	 * For the infinite scrolling plugin.
	 * In the future, I'll consider only comparing "nearby" topic ids,
	 * since one could scroll quite a few days back "on the same page".
	 * Comparing posts made that many days apart, all using the most
	 * recent topic id as a comparator could increase false positives.
	 *
	 * Inefficiency of a full highlightNecropostsIfOnSelectedForumPage
	 * is probably not a concern here, browsing a forum page.
	 */
	async function onRowsChanged(mutationList, mutationObserver) {
		await highlightNecropostsIfOnSelectedForumPage();
	}
	

	/***********************************************************************
	 * This is where the magic happens
	 ***********************************************************************/
	async function highlightNecropostsIfOnSelectedForumPage() {
		let shouldRunOnThisPage = await isOnSelectedForumPage();
		if (!shouldRunOnThisPage) {
			return;
		}
		
		let topics = await gatherTopics();
		// console.log("Topic Count: " + topics.length);
		let highestTopicOnThisPage = highestTopicIdFrom(topics);
		// console.log("Highest TopicId: " + highestTopicOnThisPage);
		let lowestNewTopicId = highestTopicOnThisPage - determineTopicInterval();
		highlightTopicCellsWithTopicIdBelow(topics, lowestNewTopicId);
	}
	
	/**
	 * Returns an array of topic.
	 * Each topic is:
	 *    - topicId     int, used to compare topic "age" relative to other posts on the page
	 *    - topicCell   Node that will be highlighted if too old
	 *    - forum       String, usually the forum being listed. Comes from the row on a search page
	 */
	async function gatherTopics() {
		let possibleTopicCells; // verified before forming a topic
		if (isMobileSite) {
			possibleTopicCells = document.querySelectorAll(".topic.list>li");
		} else {
			possibleTopicCells = document.querySelectorAll(".tcl");
		}
		// console.log("possibleTopicCells length: " + possibleTopicCells.length);
		let topics = [];
		let theForum = forumOrSearchPageName; // usually, but overridden per cell if on a search page
		// console.log("theForum: " + theForum);
		for (let i = 0; i < possibleTopicCells.length; i++) {
			if (forumOrSearchPageName.includes(searchResultsPageName)) {
				// the cell to the right of the topic cell lists the forum, in search results
				theForum = possibleTopicCells[i].nextElementSibling.innerText;
			}
			let topic = {
				topicId: await extractTopicIdFrom(possibleTopicCells[i]),
				topicCell: possibleTopicCells[i],
				forum: theForum
			}
			if (topic.topicId != 0) {
				topics.push(topic);
				// console.log("gatherTopics: " + topic.topicId + " in " + topic.forum);
			}
		}
		return topics;
	}
	
	/**
	 * How many topics since the earliest on the same page to be considered a "necropost"
	 */
	function determineTopicInterval() {
		if (!addon.settings.get("chooseCustomTopicInterval")) {
			return defaultTopicInterval;
		}
		return addon.settings.get("customTopicInterval");
	}

	/**
	 * Does not conflict with Addon: Website dark mode and customizable colors
	 */
	async function removeAnyPriorHighlights() {
		let topics = await gatherTopics();
		topics.forEach((topic) => {
			topic.topicCell.style.backgroundColor='';
		});
	}

	function determineActivatedForums() {
		if (!addon.settings.get("chooseCustomForums")) {
			return defaultForums; 
		}
		let userSelectedForums = [];
		for (const setting in customForumSettingToForum) {
			if (addon.settings.get(setting)) {
				userSelectedForums.push(customForumSettingToForum[setting]);
			}
		}
		return userSelectedForums;
	}

	/**
	 * Name of a forum this addon might process, or "Search Results" or "".
	 */
	async function determineForumOrSearchPageName() {
		let title = document.querySelector("title");
		if (!title) {
			return "";
		}
		let titleText = title.innerText;
		if (titleText.includes(searchResultsPageName)) {
			return searchResultsPageName;
		}
		// check each forum we explicitly know about, so might be highlighting
		for (let setting in customForumSettingToForum){
			let forum = customForumSettingToForum[setting];
			if (titleText.includes(forum)) {
				return forum;
			}
		}
		// a page we don't know how to highlight (and probably shouldn't have run on)
		return "";
	}

	/**
	 * Search Results or user selected forums, or default forums if custom forums is off
	 */
	async function isOnSelectedForumPage() {
		if (forumOrSearchPageName.includes(searchResultsPageName)) {
			return true;
		}
		let activatedForums = determineActivatedForums();
		for (const activatedForum of activatedForums) {
			if (forumOrSearchPageName.includes(activatedForum)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Does not conflict with Addon: Website dark mode and customizable colors
	 */
	function highlightTopicCellsWithTopicIdBelow(topics, lowestNewTopicId) {
		const standardSiteStickyClass = ".isticky";
		const mobileSiteStickyClassName = "sticky";
		let highlightColor = addon.settings.get("highlightColor");

		let activatedForums = determineActivatedForums();	
		topics
			.filter(topic => !topic.topicCell.querySelector(standardSiteStickyClass)) // on a child
			.filter(topic => !topic.topicCell.classList.contains(mobileSiteStickyClassName)) // on this item
			.filter(topic => topic.topicId < lowestNewTopicId)
			.filter(topic => activatedForums.includes(topic.forum))
			.forEach(topic => topic.topicCell.style.backgroundColor=highlightColor);
	}
	
	function highestTopicIdFrom(topics) {
		let highestSoFar = -1;
		for (let i = 0; i < topics.length; i++) {
			if (topics[i].topicId > highestSoFar) {
				highestSoFar = topics[i].topicId;
			}
		}
		return highestSoFar;
	}

	async function determineIsMobileSite() {
		// urls look like: https://scratch.mit.edu/discuss/m/6/*
		let url = document.location.href;
		// console.log(url);
		return url.includes("/m/");
	}

	/**
	 * Returns int topicId, or 0 if no topic was found.
	 */
	async function extractTopicIdFrom(topicCell) {
		// Standard format: "/discuss/topic/622368/"
		// Mobile format (read): "/discuss/m/topic/622368/"
		// Mobile format (unread): "/discuss/m/topic/622368/unread/"
		// In each case, we want to return the int value 622368
		const standardTopicPrefix = "https://scratch.mit.edu/discuss/topic/";
		const mobileTopicPrefix = "https://scratch.mit.edu/discuss/m/topic/"
		const typicalSuffix = "/"; // all Standard and read mobile messages
		const unreadSuffix = "unread/"; // only on mobile

		let a = await topicCell.querySelector("a");
		if (a == null) {
			return 0;
		}	
		let topicUrl = a.toString();
		// console.log("topicUrl " + topicUrl);
		let topicPrefix = isMobileSite ? mobileTopicPrefix : standardTopicPrefix;
		if (!topicUrl.startsWith(topicPrefix)) {
			return 0;
		}
		let suffixLength = topicUrl.endsWith(unreadSuffix) ? unreadSuffix.length : typicalSuffix.length;
		let topicId = parseInt(topicUrl.substring(topicPrefix.length, topicUrl.length - suffixLength));
		// console.log("topicId " + topicId);
		return topicId;
	}
}
