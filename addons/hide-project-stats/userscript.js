export default async function ({ addon, global, console, msg, safeMsg: m }) {
  let loves = { name: "love" };
  let favorites = { name: "favorite" };
  let username = await addon.auth.fetchUsername();
  while (true) {
  await addon.tab.waitForElement(".project-loves", { markAsSeen: true });
  let visitingOwnProject = username !== null && document.querySelector(".button.action-button.report-button") === null;

  function initializeLabels(button) {
    button.buttonElement = document.querySelector(`.project-${button.name}s`);
    button.labelElement = document.createElement("span");
    button.labelElement.classList.add(`sa-${button.name}-label`);
    button.buttonElement.after(button.labelElement);
  }

  function refreshLabels() {
    refreshButton(loves);
    refreshButton(favorites);
    // If the user has the "show stats on my own projects" setting enabled,
    // show the remix and view count if the user owns the project.
    // Love and favorite counts are handled separately since they get custom labels.
    document.querySelectorAll(".project-remixes, .project-views").forEach((element) => {
      if (!addon.self.disabled && addon.settings.get("showOwnStats") && visitingOwnProject) {
        element.classList.add("stat-display");
      } else {
        element.classList.remove("stat-display");
      }
    });
  }

  // Handles the buttons -- we can't simply hide them or the user wouldn't be able to love or favorite.
  // This just controls an appended label -- a lot of the work is actually done by CSS.
  async function refreshButton(button) {
    if (
      !addon.self.disabled &&
      addon.settings.get(`${button.name}s`) &&
      !(addon.settings.get("showOwnStats") && visitingOwnProject)
    ) {
      // Setting was turned on
      if (document.querySelector(`.${button.name}d`) != null) {
        // Checks for class that enables button
        button.labelElement.innerText = m(`${button.name}-enabled`);
      } else {
        button.labelElement.innerText = m(`${button.name}-disabled`);
      }
      button.buttonElement.classList.remove("stat-display");
      username = await addon.auth.fetchUsername();
      if (username == null) {
        button.buttonElement.classList.add("hidden");
        button.labelElement.classList.add("hidden");
      } else {
        button.buttonElement.classList.remove("hidden");
        button.labelElement.classList.remove("hidden");
      }
    } else {
      // Setting was turned off
      button.labelElement.innerText = "";
      button.buttonElement.classList.add("stat-display");
    }
  }

  initializeLabels(loves);
  initializeLabels(favorites);
  refreshLabels();

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
      refreshButton(loves);
    }
    if (data.detail.action.type === "SET_FAVED") {
      refreshButton(favorites);
    }
  });
}
}
