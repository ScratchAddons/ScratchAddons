export default async function ({ addon, global, console, msg }) {
  addon.settings.addEventListener("change", async function () {
    statusSetting = addon.settings.get("show-status");
    let statusElement = document.querySelector("#my-ocular-status");
    let status = (await getStatus()).status;
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

  let statusSetting = addon.settings.get("show-status");
  let username = document.querySelector("#profile-data > div.box-head > div > h2").innerText;
  let container = document.querySelector(".location");
  let data = await getStatus();

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

  if (data !== false) {
    locationElem.classList.add("group");
    statusSpan.innerText = data.status;
    dot.style.backgroundColor = data.color;
  }

  async function getStatus() {
    if (statusSetting == "ocular") {
      return (await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`)).json();
    } else if (statusSetting == "aviate") {
      return (await fetch(`https://aviateapp.eu.org/api/${username}`)).json();
    } else {
      return false;
    }
  }

  function updateTitle(el) {
    if (statusSetting == "ocular") el.title = msg("status-hover");
    else el.title = msg("aviate-status-hover");
  }
}
