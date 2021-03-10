async function commentLoader(addon, heightControl, selector) {
  let func;
  while (true) {
    const el = await addon.tab.waitForElement(selector, { markAsSeen: true });
    if (func) window.removeEventListener("scroll", func, { passive: true });
    el.style.display = "none";
    func = () => {
      if (window.scrollY + window.innerHeight >= document.querySelector(heightControl).offsetHeight - 500) {
        if (el) el.click();
      }
    };
    window.addEventListener("scroll", func, { passive: true });
  }
}

export default async function ({ addon, global, console }) {
  if (
    window.location.pathname.split("/")[1] === "studios" &&
    window.location.pathname.split("/")[3] === "comments" &&
    addon.settings.get("studioScroll")
  )
    commentLoader(addon, "#content", "#comments > div:nth-child(2) > ul > div");
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
      const el = await addon.tab.waitForElement(
        "#view > div > div.project-lower-container > div > div > div.comments-container > div.flex-row.comments-list > button"
      );
      el.addEventListener("click", () => run(), { once: true });
    } else run();
  }
  if (window.location.pathname.split("/")[1] === "messages" && addon.settings.get("messageScroll"))
    commentLoader(addon, "#view", "#view > div > div.messages-details.inner > section.messages-social > button");
}
