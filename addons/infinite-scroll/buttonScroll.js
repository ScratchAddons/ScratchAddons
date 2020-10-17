async function commentLoader(addon, heightControl, selector) {
  await addon.tab.waitForElement(selector);
  document.querySelector(selector).style.display = "none";
  window.addEventListener("scroll", async () => {
    if (window.scrollY + window.innerHeight >= document.getElementById(heightControl).offsetHeight - 500) {
      if (document.querySelector(selector)) {
        document.querySelector(selector).click();
        await addon.tab.waitForElement(selector);
        document.querySelector(selector).style.display = "none";
      }
    }
  });
}

export default async function ({ addon, global, console }) {
  if (window.location.pathname.split("/").length == 5 && addon.settings.get("studioScroll"))
    commentLoader(addon, "content", "#comments > div:nth-child(2) > ul > div");
  if (window.location.pathname.split("/").length == 4 && addon.settings.get("profileCommentScroll"))
    commentLoader(addon, "content", "#comments > div:nth-child(3) > ul > div");
  if (window.location.pathname.split("/").length == 4 && addon.settings.get("projectScroll"))
    commentLoader(
      addon,
      "view",
      "#view > div > div.project-lower-container > div > div > div.comments-container > div.flex-row.comments-list > button"
    );
  if (window.location.pathname.split("/").length == 3 && addon.settings.get("messageScroll"))
    commentLoader(addon, "view", "#view > div > div.messages-details.inner > section.messages-social > button");
}
