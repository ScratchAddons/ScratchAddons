export default async function ({ addon, console, msg }) {
  const lastPathFromURL = /\/([^\/]*)\/$/;
  if (
    !(await addon.auth.fetchIsLoggedIn()) ||
    !location.pathname.startsWith(`/users/${await addon.auth.fetchUsername()}`)
  ) {
    return;
  }

  const username = await addon.auth.fetchUsername();
  const xToken = await addon.auth.fetchXToken();
  const removableRows = ["projects", "favorites", "studios_following", "studios", "following"].filter((row) =>
    addon.settings.get(`show_on_${row}`)
  );

  const createButton = (el, action) => {
    const button = document.createElement("button");
    button.title = msg("row-remove");
    button.textContent = "X";
    button.classList.add("sa-remove-button");
    button.dataset.action = action;
    button.dataset.object = el.querySelector("a").href.match(lastPathFromURL)[1];
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const { action, object } = e.target.dataset;
      const item = e.target.parentElement;
      if (action === "projects") {
        request(`/site-api/projects/all/${object}/`, "PUT", msg("failed-unsharing"));
      } else if (action === "favorites") {
        request(
          `https://api.scratch.mit.edu/proxy/projects/${object}/favorites/user/${username}`,
          "DELETE",
          msg("failed-unfavoriting"),
          item
        );
      } else if (action === "studios_following") {
        request(
          `https://scratch.mit.edu/site-api/users/bookmarkers/${object}/remove/?usernames=${username}`,
          "PUT",
          msg("failed-unfollowing-studio"),
          item
        );
      } else if (action === "studios") {
        request(
          `https://scratch.mit.edu/site-api/users/curators-in/${object}/remove/?usernames=${username}`,
          "PUT",
          msg("failed-leaving"),
          item
        );
      } else if (action === "following") {
        request(
          `https://scratch.mit.edu/site-api/users/followers/${object}/remove/?usernames=${username}`,
          "PUT",
          msg("failed-unfollowing-user"),
          e.target.parentElement,
          item
        );
      }
    });
    el.insertBefore(button, el.firstChild);
  };
  const request = (url, method, message, item) => {
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
        alert(message);
      }
    });
  };
  const addButtons = (action) => {
    if (!addon.settings.get("dedicated_pages")) {
      [
        ...document
          .querySelector(`[data-control=view-all][href$="/${action}/"]`)
          .parentElement.parentElement.querySelectorAll(".item"),
      ].forEach((el) => createButton(el, action));
    }
  };

  if (location.pathname === `/users/${username}/`) {
    removableRows.forEach(addButtons);
  } else {
    const action = location.pathname.match(lastPathFromURL)[1];
    if (removableRows.includes(action)) {
      [...document.querySelectorAll(".item")].forEach((el) => createButton(el, action));
    }
  }
}
