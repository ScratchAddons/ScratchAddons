export default async function ({ addon }) {
  if (!(await addon.auth.fetchIsLoggedIn())) {
    return;
  }
  const username = await addon.auth.fetchUsername();
  setInterval(() => {
    if (addon.self.disabled) {
      return;
    }
    document
      .querySelectorAll(
        [
          ".comment-content", // Project/studio comments
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
      )
      .forEach((el) => {
        el.classList.add("sa-mention");
      });
  });
  addon.settings.addEventListener("change", () => {
    document.querySelectorAll(".sa-mention").forEach((el) => {
      el.classList.remove("sa-mention");
    });
  });
}
