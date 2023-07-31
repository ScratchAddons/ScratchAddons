import { getStatus } from "./getStatuses.js";

export default async function ({ addon, console, msg }) {
  const username = document.querySelector("#profile-data > div.box-head > div > h2").innerText?.split("#")[0]; // Fix bug with user-id addon
  let container = document.querySelector(".location");

  addon.settings.addEventListener("change", updateStatuses);
  addon.self.addEventListener("disabled", () => updateStatuses(true));
  addon.self.addEventListener("reenabled", () => updateStatuses());

  // Create status element
  let statusSpan = document.createElement("span");
  statusSpan.title = msg("status-hover");
  statusSpan.innerHTML = await getStatus(username);
  statusSpan.style.fontStyle = "italic";
  statusSpan.style.setProperty("display", "inline-block", "important");
  statusSpan.id = "sa-status-span";

  // Create location element
  let locationElem = document.createElement("span");
  locationElem.id = "sa-status-old-location";
  locationElem.innerText = container.innerText; // Set it to the old innerText
  locationElem.fontStyle = "italic";
  container.innerText = ""; // Clear the old location

  // We can add elements on start and then just show/hide them
  if (addon.settings.get("show-status") === "others" && username === (await addon.auth.fetchUsername())) {
    dot.style.display = "none";
    statusSpan.style.display = "none";
  }

  // Append all elements
  container.appendChild(locationElem);
  container.appendChild(statusSpan);

  async function updateStatuses(disabled) {
    let span = document.querySelector(".sa-status-span");
    let dot = document.querySelector(".sa-status-dot");
    let isMyProfile = addon.settings.get("show-status") === "others" && username === (await addon.auth.fetchUsername());
    if (isMyProfile || addon.settings.get("profile") === false || disabled === true) {
      span.style.display = "none";
      dot.style.display = "none";
    } else {
      span.style.display = "inline-block";
      dot.style.display = "inline-block";
    }
  }
}
