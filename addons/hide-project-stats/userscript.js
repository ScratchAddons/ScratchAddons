export default async function ({ addon, global, console }) {
  let loves = { name: "love" };
  let favorites = { name: "favorite" };
  let username = await addon.auth.fetchUsername();

  await addon.tab.waitForElement(".title");
  let visitingOwnProject = username !== null && document.querySelector(".title a").textContent === username;

  /**
   * Calculates whether or not various project stats should show.
   * Love and favorite counts are handled separately since they get custom
   * labels.
   */
  async function refreshLabels() {
    await addon.tab.waitForElement(".project-favorites");
    loves.buttonElement = document.querySelector(`.project-${loves.name}s`);
    favorites.buttonElement = document.querySelector(`.project-${favorites.name}s`);
    refreshButton(loves);
    refreshButton(favorites);
    // If the user has the "show stats on my own projects" setting enabled, show the remix and view count if the user owns the project
    document.querySelectorAll(".project-remixes, .project-views").forEach((element) => {
      if (!addon.self.disabled && addon.settings.get("showOwnStats") && visitingOwnProject) {
        element.classList.add("stat-display");
      } else {
        element.classList.remove("stat-display");
      }
    });
  }

  /**
   * Handles the buttons -- we can't simply hide them or the user wouldn't be
   * able to love or favorite.
   * This just controls whether or not the count should
   * be displayed.
   */
  async function refreshButton(button) {
    // Checks if the button's count should be shown
    if (
      !addon.self.disabled &&
      addon.settings.get(`${button.name}s`) &&
      !(addon.settings.get("showOwnStats") && visitingOwnProject)
    ) {
      // Do not show the love/favorite count
      button.buttonElement.classList.remove("stat-display");

      // Checks if the user is signed in or not, and hides the love/favorite buttons accordingly
      username = await addon.auth.fetchUsername();
      if (username === null) {
        button.buttonElement.classList.add("hidden");
      } else {
        button.buttonElement.classList.remove("hidden");
      }
    } else {
      // Show the love/favorite count
      button.buttonElement.classList.add("stat-display");
      button.buttonElement.classList.remove("hidden");
    }
  }

  // Get the button elements
  refreshLabels();

  // Re-calculate visibility of various elements when settings change
  addon.settings.addEventListener("change", () => {
    refreshLabels();
  });
  addon.self.addEventListener("disabled", () => {
    refreshLabels();
  });
  addon.self.addEventListener("reenabled", () => {
    refreshLabels();
  });
  // For the case of exiting and returning to the project page
  addon.tab.addEventListener("urlChange", async () => {
    refreshLabels();
  });

  // Since the user can sign in during the same session, the login status always needs to be updated
  while (true) {
    // Re-calculate visibility of elements when stats row is modified
    const observer = new MutationObserver(() => refreshLabels());
    observer.observe(document.querySelector(".flex-row.stats.noselect"), {
      subtree: true,
      childList: true,
      characterData: true,
    });
    await addon.tab.waitForElement(".compose-row", { markAsSeen: true });
    username = await addon.auth.fetchUsername();
    visitingOwnProject = username !== null && document.querySelector(".button.action-button.report-button") === null;
    refreshLabels();
  }
}
