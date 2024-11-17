export default async function ({ addon }) {
  if (!(await addon.auth.fetchIsLoggedIn())) {
    return;
  }
  addon.settings.addEventListener("change", () => {
    document.querySelectorAll(".sa-mention").forEach((el) => {
      el.classList.remove("sa-mention");
    });
  });
  const username = await addon.auth.fetchUsername();
  while (true) {
    const el = await addon.tab.waitForElement(
      [
        ".comment-content", // Project/studio comments
        ".description-block", // Insturctions / Notes and Credits
        ".comment .content", // Profile comments
        "#user-details", // About me / What I'm working on
        ".post_body_html", // Forum posts
        ".postsignature", // Forum signatures
      ]
        .filter(Boolean)
        .map(
          (selector) =>
            `${selector} a[href^="/users/${username}"]:not(.sa-mention)` +
            (addon.settings.get("direct")
              ? `, ${selector} a[href^="https://scratch.mit.edu/users/${username}"]:not(.sa-mention)`
              : "")
        )
        .join(",")
    );
    el.classList.add("sa-mention");
  }
}
