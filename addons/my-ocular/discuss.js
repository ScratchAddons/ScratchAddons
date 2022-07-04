export default async function ({ addon, global, console, msg }) {
  let statusSetting = addon.settings.get("show-status");
  let posts = document.querySelectorAll(".blockpost");
  let cache = Object.create(null);

  // Update title, dot and status on settings change
  addon.settings.addEventListener("change", async function () {
    posts.forEach(async (i) => {
      let username = i.querySelector(".username").innerText;
      let statusElement = i.querySelector(".my-ocular-status");
      statusSetting = addon.settings.get("show-status");

      const { userStatus, color, statusType } = await fetchStatus(username);
      i.querySelector(".my-ocular-dot").style.backgroundColor = statusType == "ocular" ? (color ? color : "#bbb") : "";
      statusElement.innerText = userStatus ? userStatus : ""; // If status is not set, show "" instead of undefined
      updateTitle(statusElement, statusType);
    });
  });

  posts.forEach(async (i) => {
    let username = i.querySelector(".username").innerText;
    let left = i.querySelector(".postleft").children[0];

    const { userStatus, color, statusType } = await (cache[username] || (cache[username] = fetchStatus(username)));

    let br = document.createElement("br");
    addon.tab.displayNoneWhileDisabled(br);

    // Create status element
    let status = document.createElement("i");
    status.classList.add("my-ocular-status");
    addon.tab.displayNoneWhileDisabled(status);
    updateTitle(status, statusType);

    // Create ocular dot
    let dot = document.createElement("span");
    addon.tab.displayNoneWhileDisabled(dot, { display: "inline-block" });
    updateTitle(dot, statusType);
    dot.className = "my-ocular-dot";

    left.appendChild(br);
    left.appendChild(status);
    left.appendChild(dot);

    if (userStatus) {
      status.innerText = userStatus;
      dot.style.backgroundColor = statusType == "ocular" ? (color ? color : "#bbb") : "";
    }
  });

  async function fetchStatus(username) {
    let statusType; // Why? Different posts can have different statuses
    let response = await fetchSpecificStatus(username, addon.settings.get("show-status"));
    // If status is not set, try to get another status
    if (!response.status) {
      let otherStatus =
        addon.settings.get("show-status") == "aviate"
          ? "ocular"
          : addon.settings.get("show-status") == "ocular"
          ? "aviate"
          : "";
      response = await fetchSpecificStatus(username, otherStatus);
      if (response.status) {
        statusSetting = statusType;
        statusType = otherStatus;
      }
    } else if (response != false) {
      statusType = addon.settings.get("show-status");
    }
    return {
      userStatus: response.status?.replace(/\n/g, " "),
      color: response.color,
      statusType: statusType,
    };
  }

  async function fetchSpecificStatus(username, type) {
    if (type == "ocular") {
      return (await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`)).json();
    } else if (type == "aviate") {
      return (await fetch(`https://aviateapp.eu.org/api/${username}`)).json();
    }
    return false;
  }

  function updateTitle(el, statusType) {
    if (statusType == "ocular") el.title = msg("status-hover");
    else if (statusType == "aviate") el.title = msg("aviate-status-hover");
  }
}
