export default async function ({ addon, global, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");
  let cache = Object.create(null);

  addon.settings.addEventListener("change", async function () {
    posts.forEach(async (i) => {
      let username = i.querySelector(".username").innerText;
      let statusElement = i.querySelector(".my-ocular-status");
      const { userStatus, color } = await fetchStatus(username);
      i.querySelector(".my-ocular-dot").style.backgroundColor =
        addon.settings.get("show-status") == "ocular" ? (color ? color : "#bbb") : "";
      if (userStatus) {
        statusElement.innerText = userStatus;
      } else {
        statusElement.innerText = "";
      }
      updateTitle(statusElement);
    });
  });

  posts.forEach(async (i) => {
    let username = i.querySelector(".username").innerText;

    let left = i.querySelector(".postleft").children[0];

    const { userStatus, color } = await (cache[username] || (cache[username] = fetchStatus(username)));

    let br = document.createElement("br");
    addon.tab.displayNoneWhileDisabled(br);
    let status = document.createElement("i");
    status.classList.add("my-ocular-status");
    addon.tab.displayNoneWhileDisabled(status);
    updateTitle(status);
    let dot = document.createElement("span");
    addon.tab.displayNoneWhileDisabled(dot, { display: "inline-block" });
    updateTitle(dot);
    dot.className = "my-ocular-dot";

    left.appendChild(br);
    left.appendChild(status);
    left.appendChild(dot);

    if (userStatus) {
      status.innerText = userStatus;
      dot.style.backgroundColor = addon.settings.get("show-status") == "ocular" ? (color ? color : "#bbb") : "";
    }
  });

  async function fetchStatus(username) {
    let response;
    if (addon.settings.get("show-status") == "ocular") {
      response = (await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`)).json();
    } else if (addon.settings.get("show-status") == "aviate") {
      response = (await fetch(`https://aviateapp.eu.org/api/${username}`)).json();
    }
    const data = (await response) ? await response : '"status": "","color": ""';
    return {
      userStatus: data.status,
      color: data.color,
    };
  }

  function updateTitle(el) {
    if (statusSetting == "ocular") el.title = msg("status-hover");
    else el.title = msg("aviate-status-hover");
  }
}
