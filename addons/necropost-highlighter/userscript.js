/**
 * @author RT_Borg
 *
 * Uses topic id as a proxy for age, which doesn't require loading other pages
 * to read actual dates.
 */

export default async function ({ addon, global, console, msg }) {
  // Default is a little over a month's worth of topics. Reasonably stable through 2022.
  // There's a lot of tolerance. Half or twice as many topics filter pretty much the same.
  const TOPICS_PER_MONTH = 7500;
  const defaultForums = [
    "New Scratchers",
    "Help with Scripts",
    "Questions about Scratch",
    "Bugs and Glitches",
    "Project Ideas",
  ];
  // Forums beyond these seem very poor options,
  // as many posts live long or are appropriately revived
  const customForumSettingToForum = {
    applyToNewScratchers: "New Scratchers",
    applyToHelpWithScripts: "Help with Scripts",
    applyToQuestionsAboutScratch: "Questions about Scratch",
    applyToBugsAndGlitches: "Bugs and Glitches",
    applyToProjectIdeas: "Project Ideas",
    applyToRequests: "Requests",
    applyToSuggestions: "Suggestions",
    applyToOpenSourceProjects: "Open Source Projects",
  };
  const searchResultsPageName = "Search Results"; // recent posts and unanswered posts
  // mobile urls look like: https://scratch.mit.edu/discuss/m/6/*
  const isMobileSite = /^\/discuss\/m\//.test(location.pathname);
  // tableBodyNode will be null on mobile and non-table search page:
  // https://scratch.mit.edu/discuss/search/?action=show_user&show_as=posts
  const tableBodyNode = document.querySelector("tbody"); // null on mobile

  if (!tableBodyNode && !isMobileSite) {
    // Standard site page without a table. Don't run on this page.
    return;
  }

  const forumOrSearchPageName = determineForumOrSearchPageName();

  /**
   * An array of topic
   * Each topic is:
   *    - topicId      int, used to compare topic "age" relative to other posts on the page
   *    - topicCell    Node that will be highlighted if too old
   *    - forum        String, usually the forum being listed. Comes from the row on a search page
   *    - restoreCell  Only defined if the cell is modified. A clone of the initial state
   *                   of the cell Node, to revert for disable addon reload and settings changes
   */
  let topics = [];

  highlightNecropostsIfOnSelectedForumPage();

  addon.settings.addEventListener("change", onAddonSettingsChange);
  addon.self.addEventListener("disabled", onDisabled);
  addon.self.addEventListener("reenabled", onReenabled);

  // Support for infinite scrolling (only available on Standard not Mobile)
  let tableBodyMutationObserver;
  const config = { childList: true };
  attachMutationObserverOnStandardSite();

  /***********************************************************************
   * Callbacks
   ***********************************************************************/
  function onAddonSettingsChange() {
    removeAnyPriorHighlights();
    highlightNecropostsIfOnSelectedForumPage();
  }

  function onDisabled() {
    detachMutationObserverOnStandardSite();
    removeAnyPriorHighlights();
  }

  function onReenabled() {
    attachMutationObserverOnStandardSite();
    highlightNecropostsIfOnSelectedForumPage();
  }

  function attachMutationObserverOnStandardSite() {
    if (!isMobileSite) {
      tableBodyMutationObserver = new MutationObserver(onRowsChanged);
      tableBodyMutationObserver.observe(tableBodyNode, config);
    }
  }

  function detachMutationObserverOnStandardSite() {
    if (!isMobileSite) {
      tableBodyMutationObserver.takeRecords(); // and discard
      tableBodyMutationObserver.disconnect();
      tableBodyMutationObserver = null;
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
  function onRowsChanged(mutationList, mutationObserver) {
    requestAnimationFrame(rebuild);
  }

  function rebuild() {
    removeAnyPriorHighlights();
    highlightNecropostsIfOnSelectedForumPage();
  }

  /***********************************************************************
   * This is where the magic happens
   ***********************************************************************/
  function highlightNecropostsIfOnSelectedForumPage() {
    let shouldRunOnThisPage = isOnSelectedForumPage();
    if (!shouldRunOnThisPage) {
      return;
    }

    gatherTopics();
    let highestTopicOnThisPage = highestTopicIdFrom(topics);
    let staleTopicInterval = TOPICS_PER_MONTH * addon.settings.get("monthCountConsideredOld");
    let lowestNewTopicId = highestTopicOnThisPage - staleTopicInterval;
    highlightTopicCellsWithTopicIdBelow(topics, lowestNewTopicId);
  }

  /**
   * Populates the topics array with an entry for each cell associated with a forum being handled.
   * In most cases that means all topic cells, but Search pages are special.
   * Any topics gathered previously will be forgotten. (And should have already been when disabling.)
   * Each topic is:
   *    - topicId      int, used to compare topic "age" relative to other posts on the page
   *    - topicCell    Node that will be highlighted if too old
   *    - forum        String, usually the forum being listed. Comes from the row on a search page
   *    - restoreCell  Only defined if the cell is modified.
   *                   A clone of the initial state of the cell Node, to revert for disable addon
   */
  function gatherTopics() {
    topics = [];
    let possibleTopicCells; // verified before forming a topic
    if (isMobileSite) {
      possibleTopicCells = document.querySelectorAll(".topic.list>li");
    } else {
      possibleTopicCells = document.querySelectorAll(".tcl");
    }
    let theForum = forumOrSearchPageName; // usually, but overridden per cell if on a search page
    for (const cell of possibleTopicCells) {
      if (forumOrSearchPageName.includes(searchResultsPageName)) {
        // the cell to the right of the topic cell lists the forum, in search results
        if (!cell.nextElementSibling) {
          // synthetic "Page n" rows attached by Infinite Scrolling on search pages
          // have no sibling, because they span all 4 columns
          continue;
        }
        theForum = cell.nextElementSibling.innerText;
      }
      const theTopicId = extractTopicIdFrom(cell);
      if (theTopicId !== 0) {
        // No restoreCell property at this point. Only added if the cell is modified
        const topic = {
          topicId: theTopicId,
          topicCell: cell,
          forum: theForum,
        };
        topics.push(topic);
      }
    }
  }

  /**
   * Restores topic cells to the initial state they had before any highlighting on this page.
   * Clears any previously gathered topics.
   */
  function removeAnyPriorHighlights() {
    topics.forEach((topic) => {
      if (topic.restoreCell) {
        topic.topicCell.replaceWith(topic.restoreCell);
      }
    });
    topics = [];
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
  function determineForumOrSearchPageName() {
    const title = document.querySelector("title");
    if (!title) {
      return "";
    }
    const titleText = title.innerText;
    if (titleText.includes(searchResultsPageName)) {
      return searchResultsPageName;
    }
    // check each forum we explicitly know about, so might be highlighting
    for (let setting of Object.keys(customForumSettingToForum)) {
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
  function isOnSelectedForumPage() {
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
   * Uses a style derived from "Website dark mode and customizable colors" addon
   */
  function highlightTopicCellsWithTopicIdBelow(topics, lowestNewTopicId) {
    const standardSiteStickyClass = ".isticky";
    const mobileSiteStickyClassName = "sticky";

    let activatedForums = determineActivatedForums();
    topics
      .filter((topic) => !topic.topicCell.querySelector(standardSiteStickyClass)) // on a child
      .filter((topic) => !topic.topicCell.classList.contains(mobileSiteStickyClassName)) // on this item
      .filter((topic) => topic.topicId < lowestNewTopicId)
      .filter((topic) => activatedForums.includes(topic.forum))
      .forEach(highlightSingle);

    function highlightSingle(topic) {
      if (!topic.restoreCell) {
        topic.restoreCell = topic.topicCell.cloneNode(true);
      }

      if (addon.settings.get("colorTopicCells")) {
        topic.topicCell.classList.add("highlighted-necropost");
      }

      const necropostMessage = msg("necropost");
      if (isMobileSite) {
        let replies = topic.topicCell.querySelector("span");
        replies.textContent += " " + necropostMessage;
        return;
      }
      let possibleNewPostsLink = topic.topicCell.querySelector(".tclcon>a");
      if (possibleNewPostsLink) {
        possibleNewPostsLink.textContent = necropostMessage;
      } else {
        // No New Posts link. Insert a plain text '(Necropost?)'
        let byUser = topic.topicCell.querySelector("span.byuser");
        byUser.textContent += " " + necropostMessage;
      }
    }
  }

  function highestTopicIdFrom(topics) {
    let highestSoFar = -1;
    for (const topic of topics) {
      if (topic.topicId > highestSoFar) {
        highestSoFar = topic.topicId;
      }
    }
    return highestSoFar;
  }

  /**
   * Returns int topicId, or 0 if no topic was found.
   */
  function extractTopicIdFrom(topicCell) {
    const link = topicCell.querySelector("a");
    if (link instanceof HTMLAnchorElement) {
      const topicIdText = /\/topic\/(\d+)\//.exec(link.href)?.[1];
      if (topicIdText) {
        return parseInt(topicIdText);
      }
    }
    return 0;
  }
}
