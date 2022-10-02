export default async function ({ addon, global, console }) {
  let loves = { name: "love" };
  let favorites = { name: "favorite" };

  /**
   * Checks whether or not the currently signed-in user matches the project owner.
   * @returns A boolean value.
   */
  async function isVisitingOwnProject() {
    let username = await addon.auth.fetchUsername();
    await addon.tab.waitForElement(".title");
    return username !== null && document.querySelector(".title form");
  }

  /**
   * Calculates whether or not various project stats should show.
   * Love and favorite counts are handled separately since they get custom labels.
   */
  async function refreshLabels() {
    await addon.tab.waitForElement(".project-favorites");
    refreshButton(loves);
    refreshButton(favorites);
    // If the user has the "show stats on my own projects" setting enabled,
    // show the remix and view count if the user owns the project
    document.querySelectorAll(".project-remixes, .project-views").forEach(async (element) => {
      if (!addon.self.disabled && addon.settings.get("showOwnStats") && (await isVisitingOwnProject())) {
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
    button.buttonElement = document.querySelector(`.project-${button.name}s`);
    // Checks if the button's count should be hidden
    if (
      !addon.self.disabled &&
      addon.settings.get(`${button.name}s`) &&
      !(addon.settings.get("showOwnStats") && (await isVisitingOwnProject()))
    ) {
      // Do not show the love/favorite count
      button.buttonElement.classList.remove("stat-display");

      // Checks if the user is signed in or not, and hides the love/favorite buttons accordingly
      if ((await addon.auth.fetchUsername()) === null) {
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

  /**
   * Watch the stats row for changes (specifically for loves and favorites
   * because Scratch completely clears out and readds classes when the love
   * or favorite buttons are clicked)
   */
  function observeStatsRow() {
    observer.observe(document.querySelector(".flex-row.stats.noselect"), {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }

  const observer = new MutationObserver(() => refreshLabels());

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
    // The element we were observing got cleared, so we need to reattach
    // to the observer
    observeStatsRow();
  });

  // Re-calculate visibility of elements when stats row is modified
  // (such as when the user loves or favorites, since this will
  // change the label to the count)

  // Since the user can sign in during the same session,
  // the login status needs to be updated when this occurs
  while (true) {
    await addon.tab.waitForElement(".project-loves");
    await addon.tab.waitForElement(".project-favorites");
    refreshLabels();
    observeStatsRow();
    // An element with .compose-row appears when signing in
    await addon.tab.waitForElement(".compose-row", { markAsSeen: true });
  }
}
