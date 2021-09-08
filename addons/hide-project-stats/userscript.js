export default async function ({ addon, global, console, msg, safeMsg: m }) {
  let loves = { name: "love" };
  let favorites = { name: "favorite" };

  function initializeLabels(button) {
    button.labelExists = false;
    button.buttonElement = document.getElementsByClassName(`project-${button.name}s`)[0];
    button.userLiked = document.getElementsByClassName(`${button.name}d`).length != 0;
    button.labelElement = document.createElement("span");
    button.labelElement.id = `sa-${button.name}-label`;
    button.buttonElement.after(button.labelElement);
  }

  function toggleLabels() {
    toggleOnButton(loves);
    toggleOnButton(favorites);
  }

  function toggleOnButton(button) {
    if (addon.settings.get(`${button.name}s`) && !addon.self.disabled) {
      // Setting was turned on
      button.labelExists = true;
      if (button.userLiked) {
        button.labelElement.innerText = m(`${button.name}-enabled`);
      } else {
        button.labelElement.innerText = m(`${button.name}-disabled`);
      }
    } else {
      // Setting was turned off
      button.labelExists = false;
      button.labelElement.innerText = "";
    }
  }

  initializeLabels(loves);
  initializeLabels(favorites);
  toggleLabels();

  addon.settings.addEventListener("change", () => {
    toggleLabels();
  });
  addon.self.addEventListener("disabled", () => {
    toggleLabels();
  });
  addon.self.addEventListener("reenabled", () => {
    toggleLabels();
  });
  addon.tab.redux.addEventListener("statechanged", (data) => {
    if (data.detail.action.type === "SET_LOVED") {
      loves.userLiked = !loves.userLiked;
      toggleOnButton(loves);
    }
    if (data.detail.action.type === "SET_FAVED") {
      favorites.userLiked = !favorites.userLiked;
      toggleOnButton(favorites);
    }
  });
}
