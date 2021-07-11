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
    yProvider = yProviderValue && document.querySelector(yProviderValue);
    const scrollDetecter = yProvider || window;
    if (func && prevScrollDetector) prevScrollDetector.removeEventListener("scroll", func, { passive: true });
    el.style.display = "none";
    prevScrollDetector = scrollDetecter;
    let edge = false;
    func = () => {
      const threshold = yProvider ? yProvider.scrollTop + yProvider.clientHeight : window.scrollY + window.innerHeight;
      if (typeof pathname === "string" && (window.location.pathname.split("/")[3] || "") !== pathname) return;
      if (!edge && threshold >= document.querySelector(heightControl).offsetHeight - 500) {
        edge = true;
        if (el) {
          el.click();
        }
      } else if (threshold < document.querySelector(heightControl).offsetHeight - 500) {
        edge = false;
      }
    };
    scrollDetecter.addEventListener("scroll", func, { passive: true });
  }
}

export default async function ({ addon, global, console }) {
  const isStudio = window.location.pathname.split("/")[1] === "studios";
  if (isStudio && addon.settings.get("studioScroll")) {
    commentLoader(addon, "#view", ".studio-compose-container > .load-more-button", "comments");
  }
  if (window.location.pathname.split("/")[1] === "users" && addon.settings.get("profileCommentScroll"))
    commentLoader(addon, "#content", "[data-control=load-more]");
  if (window.location.pathname.split("/")[1] === "projects" && addon.settings.get("projectScroll")) {
    const run = () =>
      commentLoader(
        addon,
        "#view",
        "#view > div > div.project-lower-container > div > div > div.comments-container > div.flex-row.comments-list > button"
      );
    if (location.hash.startsWith("#comments-")) {
      // Wait until user clicks "see all comments"
      // Note: we ignore the cases where the comment can't be found (e.g. /projects/x/#comments-0)
      const listener = (e) => {
        if (e.target.closest("div.comments-container > div.flex-row.comments-list > button")) {
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
    commentLoader(addon, ".user-projects-modal-grid", ".user-projects-modal-grid .studio-grid-load-more > button", "", {
      yProvider: ".user-projects-modal-content",
    });
  if (isStudio && addon.settings.get("studioCuratorScroll"))
    commentLoader(addon, "#view", "div > .studio-members:last-child .studio-grid-load-more > button", "curators"); // Only scrolling curators for now
  if (isStudio && addon.settings.get("studioActivityScroll"))
    commentLoader(addon, "#view", ".studio-activity .studio-grid-load-more > button", "activity");
}
