export default async function ({ addon, global, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");
  let cache = Object.create(null);
  let statusSetting = addon.settings.get("show-status");

  addon.settings.addEventListener("change", async function () {
    posts.forEach(async (i) => {
      let username = i.querySelector(".username").innerText;
      let statusElement = i.querySelector(".my-ocular-status");
      const { userStatus, color } = await fetchStatus(username);
      i.querySelector(".my-ocular-dot").style.backgroundColor =
        statusSetting == "ocular" ? (color ? color : "#bbb") : "";
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
      dot.style.backgroundColor = statusSetting == "ocular" ? (color ? color : "#bbb") : "";
    }
  });

  async function fetchStatus(username) {
    let showstatus = addon.settings.get("show-status");
    let response = await fetchSpecificStatus(username, showstatus);
    if (await response.status == null) {
      let statusType = showstatus == "aviate" ? "ocular" : (showstatus == "ocular" ? "aviate" : "");
      response = await fetchSpecificStatus(username, statusType);
      if (response) statusSetting = statusType
    }
    const data = (await response) ? await response : '"status": "","color": ""';
    return {
      userStatus: data.status?.replace(/\n/g, " "),
      color: data.color,
    };
  }

  async function fetchSpecificStatus(username, type) {
    if (type == "ocular") {
      return (await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`)).json();
    } else if (type == "aviate") {
      return (await fetch(`https://aviateapp.eu.org/api/${username}`)).json();
    }
    return;
  }

  function updateTitle(el) {
    if (statusSetting == "ocular") el.title = msg("status-hover");
    else if (statusSetting == "aviate") el.title = msg("aviate-status-hover");
  }
}
