async function commentLoader(addon, heightControl, selector, pathname, { yProvider = undefined } = {}) {
  let func;
  let prevScrollDetector;
  const yProviderValue = yProvider;
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
    let edge = false;
    func = () => {
      const threshold = yProvider ? yProvider.scrollTop + yProvider.clientHeight : window.scrollY + window.innerHeight;
      if (typeof pathname === "string" && (window.location.pathname.split("/")[3] || "") !== pathname) return;
      if (!edge && threshold >= el.closest(heightControl).offsetHeight - 500) {
        edge = true;
        if (el) {
          el.click();
        }
      } else if (threshold < el.closest(heightControl).offsetHeight - 500) {
        edge = false;
      }
    };
    scrollDetecter.addEventListener("scroll", func, { passive: true });
  }
}

export default async function ({ addon, global, console }) {
  if (window.location.pathname.split("/")[1] === "users" && addon.settings.get("profileCommentScroll"))
    commentLoader(addon, "#content", "[data-control=load-more]");
  const isStudio = window.location.pathname.split("/")[1] === "studios";
  const isStudioComments = isStudio && addon.settings.get("studioScroll");
  const isProjectComments =
    window.location.pathname.split("/")[1] === "projects" && addon.settings.get("projectScroll");
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

  // Enable scrolling for studio-followers
  if (isStudio && addon.settings.get("studioBrowseProjectScroll")) {
    addon.tab.waitForElement(".sa-followers-main .user-projects-modal-content").then((el) => {
      el.setAttribute("data-scrollable", "true");
    });
  }
}
