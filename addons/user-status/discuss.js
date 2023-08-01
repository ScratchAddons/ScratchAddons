import { getStatuses } from "./getStatuses.js";

export default async function ({ addon, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");

  for (const i of posts) {
    let username = i.querySelector(".username").innerText;
    let left = i.querySelector(".postleft").children[0];

    // Create statusText element
    let br = document.createElement("br");
    addon.tab.displayNoneWhileDisabled(br);
    let status = await getStatuses(username, msg("ocular-status-hover"), msg("aviate-status-hover"));
    addon.tab.displayNoneWhileDisabled(status);

    // Hide things
    if (addon.settings.get("show-status") === "others" && username === (await addon.auth.fetchUsername())) {
      status.style.display = "none";
      dot.style.display = "none";
    }

    // Append elements
    left.appendChild(br);
    left.appendChild(status);
  }

  // Show/hide things on setting change
  addon.settings.addEventListener("change", async function () {
    for (const i of posts) {
      let left = i.querySelector(".postleft").children[0];
      let username = left.querySelector(".username").innerText;
      let status = left.querySelector("span");
      let dot = i.querySelector(".sa-status-dot");
      let isMyProfile =
        addon.settings.get("show-status") === "others" && username === (await addon.auth.fetchUsername());
      if (!username || !dot) continue;
      if (isMyProfile || addon.settings.get("discuss") === false) {
        status.style.display = "none";
        dot.style.display = "none";
      } else {
        status.style.display = "inline-block";
        dot.style.display = "inline-block";
      }
    }
  });
}
