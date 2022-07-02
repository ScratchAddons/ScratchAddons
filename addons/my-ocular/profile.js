export default async function ({ addon, global, console, msg }) {
  let statusSetting = addon.settings.get("show-status");
  addon.settings.addEventListener("change", async function () {
    let statusElement = document.querySelector("#my-ocular-status");
    let status = (await fetchStatus(username)).status;
    if (statusElement && status) {
      statusElement.innerText = status;
      locationElem.classList.add("group");
    } else {
      statusElement.innerText = "";
      locationElem.classList.remove("group");
    }
    dot.style.backgroundColor = addon.settings.get("show-status") == "ocular" ? (color ? color : "#bbb") : "";
    updateTitle(statusElement);
  });

  let username = document.querySelector("#profile-data > div.box-head > div > h2").innerText;
  let container = document.querySelector(".location");
  let data = await fetchStatus(username);

  let statusSpan = document.createElement("i"); // For whatever reason, chrome turns variable named status into text.
  updateTitle(statusSpan);
  statusSpan.id = "my-ocular-status";


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
  if (data !== false && statusText) {
    locationElem.classList.add("group");
    statusSpan.innerText = data.status;
    dot.style.backgroundColor = data.color;
  }


  async function fetchStatus(username) {
    let showstatus = addon.settings.get("show-status");
    let response = await fetchSpecificStatus(username, showstatus);
    if (await response.status == null) {
      let statusType = showstatus == "aviate" ? "ocular" : (showstatus == "ocular" ? "aviate" : "");
      response = await fetchSpecificStatus(username, statusType);
      if (response) statusSetting = statusType
    }
    const data = (await response) ? await response : '"status": "","color": ""';
    return data ? data : false;
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
