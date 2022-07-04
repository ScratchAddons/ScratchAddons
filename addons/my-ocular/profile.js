export default async function ({ addon, global, console, msg }) {
  let statusSetting = addon.settings.get("show-status");

  // Update title, dot and status on settings change
  addon.settings.addEventListener("change", async function () {
    let statusElement = document.querySelector("#my-ocular-status");
    statusSetting = addon.settings.get("show-status"); // Update statusSetting variable

    let status = await fetchStatus(username);
    if (status?.status) {
      statusElement.innerText = status.status;
      dot.style.backgroundColor = statusSetting == "ocular" ? (status.color ? status.color : "#bbb") : "";
      updateTitle(statusElement);
      locationElem.classList.add("group");
    } else {
      statusElement.innerText = "";
      locationElem.classList.remove("group");
    }
  });

  let username = document.querySelector("#profile-data > div.box-head > div > h2").innerText;
  let container = document.querySelector(".location");
  let data = await fetchStatus(username);

  let statusSpan = document.createElement("i"); // For whatever reason, chrome turns variable named status into text.
  updateTitle(statusSpan);
  statusSpan.id = "my-ocular-status";

  // Create ocular dot
  let dot = document.createElement("span");
  addon.tab.displayNoneWhileDisabled(dot, { display: "inline-block" });
  dot.title = msg("status-hover");
  dot.className = "my-ocular-dot";

  let locationElem = document.createElement("span"); // Create a new location element
  locationElem.innerText = container.innerText; // Set it to the old innertext

  container.innerText = ""; // Clear the old location
  container.appendChild(locationElem); // give it the location
  container.appendChild(statusSpan);
  container.appendChild(dot);

  if (typeof data.status !== "string") return;
  var statusText = data.status.replace(/\n/g, " "); // clear out newlines
  if (statusText) {
    locationElem.classList.add("group");
    statusSpan.innerText = data.status;
    dot.style.backgroundColor = data.color;
  }

  async function fetchStatus(username) {
    let response = await fetchSpecificStatus(username, addon.settings.get("show-status"));
    // If status is not set, try to get another status
    if (!response.status) {
      let statusType =
        addon.settings.get("show-status") == "aviate"
          ? "ocular"
          : addon.settings.get("show-status") == "ocular"
          ? "aviate"
          : "";
      response = await fetchSpecificStatus(username, statusType);
      if (response.status) statusSetting = statusType;
    }
    response = response.status ? response : "'status': '', 'color': 'red'";
    return response;
  }

  async function fetchSpecificStatus(username, type) {
    if (type == "ocular") {
      return await (await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`)).json();
    } else if (type == "aviate") {
      return await (await fetch(`https://aviateapp.eu.org/api/${username}`)).json();
    }
    return "";
  }

  function updateTitle(el) {
    if (statusSetting == "ocular") el.title = msg("status-hover");
    else if (statusSetting == "aviate") el.title = msg("aviate-status-hover");
  }
}
