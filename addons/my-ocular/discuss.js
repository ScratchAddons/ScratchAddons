export default async function ({ addon, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");
  let cache = Object.create(null);

  for (const i of posts) {
    let username = i.querySelector(".username").innerText;
    let left = i.querySelector(".postleft").children[0];
    const { userStatus, color } = await (cache[username] || (cache[username] = fetchStatus(username)));

    if (typeof userStatus !== "string") {
      continue;
    }

    // Create statusText element
    let br = document.createElement("br");
    addon.tab.displayNoneWhileDisabled(br);
    let status = document.createElement("span");
    addon.tab.displayNoneWhileDisabled(status);
    status.title = msg("status-hover");
    status.innerText = userStatus;
    status.style.fontStyle = "italic";
    addon.tab.displayNoneWhileDisabled(status);

    // Create my-ocular dot
    let dot = document.createElement("span");
    addon.tab.displayNoneWhileDisabled(dot);
    dot.title = msg("status-hover");
    dot.className = "my-ocular-dot";
    dot.style.backgroundColor = color;

    // Hide things
    if (addon.settings.get("show-status") === "others" && username === (await addon.auth.fetchUsername())) {
      status.style.display = "none";
      dot.style.display = "none";
    }

    // Append elements
    left.appendChild(br);
    left.appendChild(status);
    if (color) left.appendChild(dot);
  }

  async function fetchStatus(username) {
    const response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
    const data = await response.json();
    return {
      userStatus: data.status?.replace(/\n/g, " "),
      color: data.color,
    };
  }

  // Show/hide things on setting change
  addon.settings.addEventListener("change", async function () {
    for (const i of posts) {
      let left = i.querySelector(".postleft").children[0];
      let username = left.querySelector(".username").innerText;
      let status = left.querySelector("span");
      let dot = i.querySelector(".my-ocular-dot");
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
