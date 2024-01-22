export default async function ({ addon, msg }) {
  const lastPathFromURL = /\/([^\/]*)\/$/;
  if (
    !(await addon.auth.fetchIsLoggedIn()) ||
    !location.pathname.startsWith(`/users/${await addon.auth.fetchUsername()}`)
  ) {
    return;
  }

  const username = await addon.auth.fetchUsername();
  const xToken = await addon.auth.fetchXToken();
  const destructiveActions = ["projects", "studios"];
  const requests = {
    projects: {
      req: (object) => `/site-api/projects/all/${object}/`,
      method: "PUT",
    },
    favorites: {
      req: (object) => `https://api.scratch.mit.edu/proxy/projects/${object}/favorites/user/${username}`,
      method: "DELETE",
    },
    studios_following: {
      req: (object) => `/site-api/users/bookmarkers/${object}/remove/?usernames=${username}`,
      method: "PUT",
    },
    studios: {
      req: (object) => `/site-api/users/curators-in/${object}/remove/?usernames=${username}`,
      method: "PUT",
    },
    following: {
      req: (object) => `/site-api/users/followers/${object}/remove/?usernames=${username}`,
      method: "PUT",
    },
  };

  const createButton = (el, action) => {
    const button = document.createElement("button");
    button.title = msg("title-text");
    button.textContent = "X";
    button.classList.add("sa-remove-button");
    button.dataset.action = action;
    button.dataset.object = el.querySelector("a").href.match(lastPathFromURL)[1];
    button.dataset.name = el.querySelector(".title").textContent.trim();
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const { action, object, name } = e.target.dataset;
      const confirmations = addon.settings.get("confirmations");
      if (
        (confirmations === "all" || (confirmations === "destructive" && destructiveActions.includes(action))) &&
        !confirm(msg(`confirm-${action}`, { name }))
      ) {
        return;
      }
      const { req, method } = requests[action];
      request(req(object), method, action, name, e.target.parentElement);
    });
    el.insertBefore(button, el.firstChild);
  };
  const request = (url, method, action, name, item) => {
    fetch(url, {
      headers: {
        "x-csrftoken": addon.auth.csrfToken,
        "x-requested-with": "XMLHttpRequest",
        "x-token": xToken,
      },
      method: method,
      credentials: "include",
      body: JSON.stringify({
        isPublished: false,
      }),
    }).then((response) => {
      if (response.status === 200) {
        item.style.display = "none";
      } else {
        alert(msg(`fail-${action}`, { name }));
      }
    });
  };
  const enable = () => {
    const removableRows = ["projects", "favorites", "studios_following", "studios", "following"].filter((row) =>
      addon.settings.get(`show_on_${row}`)
    );
    const action = location.pathname.match(lastPathFromURL)[1];
    if (removableRows.includes(action)) {
      [...document.querySelectorAll(".item")].forEach((el) => createButton(el, action));
    }
  };
  const disable = () => {
    [...document.querySelectorAll(".sa-remove-button")].forEach((el) => el.remove());
  };

  addon.self.addEventListener("reenabled", enable);
  addon.self.addEventListener("disabled", disable);
  addon.settings.addEventListener("change", () => {
    disable();
    enable();
  });

  enable();
}
