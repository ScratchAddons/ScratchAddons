export default async function ({ addon, global, console, msg, safeMsg: m }) {
  let loves = { name: "love" };
  let favorites = { name: "favorite" };
  let username = await addon.auth.fetchUsername();
  await addon.tab.waitForElement(".button.action-button.report-button", { markAsSeen: true });
  let visitingOwnProject = username !== null && document.querySelector(".button.action-button.report-button") === null;

  // Adds the elements that contain the "Love" and "Favorite" labels
  // to the love and favorite buttons.
  function initializeLabels(button) {
    button.buttonElement = document.querySelector(`.project-${button.name}s`);
    button.labelElement = document.createElement("span");
    button.labelElement.classList.add(`sa-${button.name}-label`);
    button.buttonElement.after(button.labelElement);
  }

  // Calculates whether or not various project stats should show.
  // Love and favorite counts are handled separately since they get custom
  // labels.
  function refreshLabels() {
    refreshButton(loves);
    refreshButton(favorites);
    // If the user has the "show stats on my own projects" setting enabled,
    // show the remix and view count if the user owns the project.
    document.querySelectorAll(".project-remixes, .project-views").forEach((element) => {
      if (!addon.self.disabled && addon.settings.get("showOwnStats") && visitingOwnProject) {
        element.classList.add("stat-display");
      } else {
        element.classList.remove("stat-display");
      }
    });
  }

  // Handles the buttons -- we can't simply hide them or the user wouldn't be
  // able to love or favorite.
  // This just controls an appended label and whether or not the count should
  // be displayed.
  async function refreshButton(button) {
    // Checks if the button's count should be replaced with a custom label
    if (
      !addon.self.disabled &&
      addon.settings.get(`${button.name}s`) &&
      !(addon.settings.get("showOwnStats") && visitingOwnProject)
    ) {
      // Show a custom label
      if (document.querySelector(`.${button.name}d`) !== null) {
        // The user loved/favorited the project
        button.labelElement.innerText = m(`${button.name}-enabled`);
      } else {
        // The user has not loved/favorited the project
        button.labelElement.innerText = m(`${button.name}-disabled`);
      }

      // Do not show the love/favorite count
      button.buttonElement.classList.remove("stat-display");

      // Checks if the user is signed in or not, and hides the love/favorite
      // buttons accordingly
      username = await addon.auth.fetchUsername();
      if (username === null) {
        button.buttonElement.classList.add("hidden");
        button.labelElement.classList.add("hidden");
      } else {
        button.buttonElement.classList.remove("hidden");
        button.labelElement.classList.remove("hidden");
      }
    } else {
      // Do not show a custom label
      button.labelElement.innerText = "";
      // Show the love/favorite count
      button.buttonElement.classList.add("stat-display");
    }
  }

  // Acually run the addon sequence.
  await addon.tab.waitForElement(".project-loves", { markAsSeen: true });
  initializeLabels(loves);
  initializeLabels(favorites);
  refreshLabels();

  // Re-calculate visibility of various elements when settings change
  // or the user loves/favorites the project
  addon.settings.addEventListener("change", () => {
    refreshLabels();
  });
  addon.self.addEventListener("disabled", () => {
    refreshLabels();
  });
  addon.self.addEventListener("reenabled", () => {
    refreshLabels();
  });
  addon.tab.redux.addEventListener("statechanged", (data) => {
    if (data.detail.action.type === "SET_LOVED") {
      setTimeout(() => refreshButton(loves), 0);
    }
    if (data.detail.action.type === "SET_FAVED") {
      setTimeout(() => refreshButton(favorites), 0);
    }
  });

  // Since the user can sign in during the same session, the login status always
  // needs to be updated.
  while (true) {
    await addon.tab.waitForElement(".project-loves", { markAsSeen: true });
    visitingOwnProject = username !== null && document.querySelector(".button.action-button.report-button") === null;
  }
}
