export default async function ({ addon, global, console, msg }) {
  if (!addon.settings.get("discuss")) {
    await new Promise((resolve) => {
      addon.settings.addEventListener("change", () => {
        if (addon.settings.get("discuss")) resolve();
      });
    });
  }

  let posts = document.querySelectorAll(".blockpost");
  let cache = Object.create(null);

  posts.forEach(async (i) => {
    let username = i.querySelector(".username").innerText;

    let left = i.querySelector(".postleft").children[0];

    const { userStatus, color } = await (cache[username] || (cache[username] = fetchStatus(username)));

    if (userStatus) {
      let status = document.createElement("div");
      status.title = msg("status-hover");
      status.innerText = userStatus;
      status.className = "my-ocular-status";
      status.style.display = "none"; // overridden by userstyle if the setting is enabled

      let dot = document.createElement("span");
      dot.className = "my-ocular-dot";

      dot.style.backgroundColor = color;

      left.appendChild(status);
      if (color) status.appendChild(dot);
    }
  });

  async function fetchStatus(username) {
    const response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
    const data = await response.json();
    return {
      userStatus: data.status?.replace(/\n/g, " "),
      color: data.color,
    };
  }
}
