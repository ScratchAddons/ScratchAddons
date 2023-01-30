export default async function ({ addon, console }) {
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
    // show counts if the user owns the project
    if (!addon.self.disabled && addon.settings.get("showOwnStats") && (await isVisitingOwnProject())) {
      getStatsRowParent().classList.add("sa-stat-display");
    } else {
      getStatsRowParent().classList.remove("sa-stat-display");
    }
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
      // Checks if the user is signed in or not, and hides the love/favorite buttons accordingly
      if ((await addon.auth.fetchUsername()) === null) {
        button.buttonElement.classList.add("hidden");
      } else {
        button.buttonElement.classList.remove("hidden");
      }
    } else {
      // Show the love/favorite count
      button.buttonElement.classList.remove("hidden");
    }
  }

  function getStatsRowParent() {
    return document.querySelector(".flex-row.stats.noselect").parentElement;
  }

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
  addon.tab.redux.addEventListener("statechanged", (data) => {
    // When the project is loved or unloved
    if (data.detail.action.type === "SET_LOVED") {
      refreshButton(loves);
    }
    // When the project is favorited or unfavorited
    if (data.detail.action.type === "SET_FAVED") {
      refreshButton(favorites);
    }
  });

  // Since the user can sign in during the same session,
  // the login status needs to be updated when this occurs
  while (true) {
    await addon.tab.waitForElement(".project-loves", { reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly });
    await addon.tab.waitForElement(".project-favorites", {
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    refreshLabels();
    // An element with .compose-row appears when signing in
    await addon.tab.waitForElement(".compose-row", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
  }
}
