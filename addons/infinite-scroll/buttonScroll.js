async function commentLoader(
  addon,
  heightControl,
  selector,
  pathname,
  { yProvider = undefined, canClick = () => true } = {}
) {
  let func;
  let prevScrollDetector;
  const yProviderValue = yProvider;
  document.body.classList.add("sa-collapse-footer");
  while (true) {
    const el = await addon.tab.waitForElement(selector, {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
    });
    yProvider = yProviderValue && el.closest(yProviderValue);
    const scrollDetecter = yProvider || window;
    if (func && prevScrollDetector) prevScrollDetector.removeEventListener("scroll", func, { passive: true });
    el.style.display = "none";
    prevScrollDetector = scrollDetecter;
    func = () => {
      const threshold = yProvider ? yProvider.scrollTop + yProvider.clientHeight : window.scrollY + window.innerHeight;
      if (typeof pathname === "string" && (window.location.pathname.split("/")[3] || "") !== pathname) return;
      if (threshold >= el.closest(heightControl).offsetHeight - 500) {
        if (el) {
          if (canClick()) el.click();
        }
      }
    };
    scrollDetecter.addEventListener("scroll", func, { passive: true });
  }
}

export default async function ({ addon, console }) {
  if (window.location.pathname.split("/")[1] === "users" && addon.settings.get("profileCommentScroll"))
    commentLoader(addon, "#content", "[data-control=load-more]");
  const isStudio = window.location.pathname.split("/")[1] === "studios";
  const isStudioComments = isStudio && addon.settings.get("studioScroll");
  const isProjectComments =
    window.location.pathname.split("/")[1] === "projects" && addon.settings.get("projectScroll");
  const isSearchOrExplore = ["search", "explore"].includes(window.location.pathname.split("/")[1]);
  if (isProjectComments || isStudioComments) {
    const buttonSelector = isStudioComments
      ? ".studio-compose-container .load-more-button"
      : "div.comments-container > div.flex-row.comments-list > button";
    const run = () => commentLoader(addon, "#view", buttonSelector, isStudioComments ? "comments" : null);
    if (location.hash.startsWith("#comments-")) {
      // Wait until user clicks "see all comments"
      // Note: we ignore the cases where the comment can't be found (e.g. /projects/x/#comments-0)
      const listener = (e) => {
        if (e.target.closest(buttonSelector)) {
          document.removeEventListener("click", listener, true);
          run();
        }
      };
      document.addEventListener("click", listener, true);
    } else run();
  }
  if (window.location.pathname.split("/")[1] === "messages" && addon.settings.get("messageScroll"))
    commentLoader(addon, "#view", "#view > div > div.messages-details.inner > section.messages-social > button");
  if (isStudio && addon.settings.get("studioProjectScroll"))
    commentLoader(addon, "#view", ".studio-projects-grid .studio-grid-load-more > button", "");
  if (isStudio && addon.settings.get("studioBrowseProjectScroll"))
    commentLoader(
      addon,
      ".user-projects-modal-grid",
      ".user-projects-modal:not(.sa-followers-main) .user-projects-modal-grid .studio-grid-load-more > button",
      "",
      { yProvider: ".user-projects-modal-content" }
    );
  if (isStudio && addon.settings.get("studioCuratorScroll"))
    commentLoader(addon, "#view", "div > .studio-members:last-child .studio-grid-load-more > button", "curators"); // Only scrolling curators for now
  if (isStudio && addon.settings.get("studioActivityScroll"))
    commentLoader(addon, "#view", ".studio-activity .studio-grid-load-more > button", "activity");
  if (isSearchOrExplore && addon.settings.get("searchExploreScroll")) {
    import("./search-explore-module.js").then((m) => {
      const canClick = () => !m.currentlyFetchingProjects();
      commentLoader(addon, "#view", "#projectBox > button.button", undefined, { canClick });
    });
  }

  // Enable scrolling for studio-followers
  // Disabled, see #3238
  /*
  if (isStudio && addon.settings.get("studioBrowseProjectScroll")) {
    addon.tab.waitForElement(".sa-followers-main .user-projects-modal-content").then((el) => {
      el.setAttribute("data-scrollable", "true");
    });
  }
  */

  if (isStudio && addon.tab.redux.state) {
    // Fix vanilla bug causing unnecessary re-fetch
    let projectsRefetching = false;
    let curatorsRefetching = false;
    let activityRefetching = false;
    addon.tab.redux.initialize();
    addon.tab.redux.addEventListener("statechanged", (e) => {
      switch (e.detail.action.type) {
        case "projects_APPEND": {
          projectsRefetching = false;
          return;
        }
        case "curators_APPEND": {
          curatorsRefetching = false;
          return;
        }
        case "activity_APPEND": {
          activityRefetching = false;
          return;
        }
      }
    });
    document.body.addEventListener(
      "click",
      (e) => {
        if (!e.target.closest("button.button")) return;
        if (e.target.closest(".studio-projects-grid .studio-grid-load-more > button")) {
          if (projectsRefetching) e.stopPropagation();
          projectsRefetching = true;
          return;
        } else if (e.target.closest("div > .studio-members:last-child .studio-grid-load-more > button")) {
          if (curatorsRefetching) e.stopPropagation();
          curatorsRefetching = true;
          return;
        } else if (e.target.closest(".studio-activity .studio-grid-load-more > button")) {
          if (activityRefetching) e.stopPropagation();
          activityRefetching = true;
          return;
        } else if (
          e.target.closest(
            ".user-projects-modal:not(.sa-followers-main) .user-projects-modal-grid .studio-grid-load-more > button"
          )
        ) {
          if (addon.tab.redux.state?.["user-projects"].loading) e.stopPropagation();
          return;
        }
      },
      { capture: true }
    );
  }
}
