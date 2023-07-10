export default async function ({ addon, console, msg }) {
  while (true) {
    let item = await addon.tab.waitForElement(".media-stats", { markAsSeen: true });
    if (window.location.hash === "#galleries" && item.childElementCount === 2) {
      let leaveButton = item.appendChild(document.createElement("a"));
      leaveButton.className = "unshare";
      leaveButton.innerText = msg("leave");
      leaveButton.setAttribute("data-id", item.parentElement.querySelector(".title a").href.match(/[0-9]+/g));
      leaveButton.addEventListener("click", async function (e) {
        if (await addon.tab.confirm(msg("leave-new"), msg("leave-confirm"))) {
          await fetch(
            `https://scratch.mit.edu/site-api/users/curators-in/${leaveButton.getAttribute(
              "data-id",
            )}/remove/?usernames=${Scratch.INIT_DATA.LOGGED_IN_USER.model.username}`,
            { method: "PUT", headers: { "x-csrftoken": addon.auth.csrfToken, "x-requested-with": "XMLHttpRequest" } },
          );
          window.location.reload();
        }
      });
    }
  }
}
