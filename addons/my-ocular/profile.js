export default async function ({ addon, global, console, msg }) {
  const username = document.querySelector("#profile-data > div.box-head > div > h2").innerText?.split("#")[0]; // Fix bug with user-id addon
  let container = document.querySelector(".location");
  let data = await fetchStatus(username);

  addon.settings.addEventListener("change", updateOcular);
  addon.self.addEventListener("disabled", () => updateOcular(true));
  addon.self.addEventListener("reenabled", () => updateOcular());

  if (typeof data.userStatus !== "string") return;

  // Create status element
  let statusSpan = document.createElement("span");
  statusSpan.title = msg("status-hover");
  statusSpan.innerText = data.userStatus;
  statusSpan.style.fontStyle = "italic";
  statusSpan.style.setProperty("display", "inline-block", "important");
  statusSpan.id = "my-ocular-span";

  // Create my-ocular-dot
  let dot = document.createElement("span");
  dot.title = msg("status-hover");
  dot.classList.add("my-ocular-dot");
  dot.style.setProperty("display", "inline-block", "important"); // I have to do it like this because .style doesn't let me set prio, and featured project banner messes with this without !important
  dot.style.backgroundColor = data.color;

  // Create location element
  let locationElem = document.createElement("span");
  locationElem.id = "my-ocular-old-location";
  locationElem.innerText = container.innerText; // Set it to the old innerText
  locationElem.fontStyle = "italic";
  container.innerText = ""; // Clear the old location

  // We can add elements on start and then just show/hide them
  if (addon.settings.get("show-status") === "others" && username == (await addon.auth.fetchUsername())) {
    dot.style.display = "none";
    statusSpan.style.display = "none";
  }

  // Append all elements
  container.appendChild(locationElem);
  container.appendChild(statusSpan);
  container.appendChild(dot);

  async function fetchStatus(username) {
    const response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
    const data = await response.json();
    return {
      userStatus: data.status?.replace(/\n/g, " "),
      color: data.color,
    };
  }

  async function updateOcular(disabled) {
    let span = document.querySelector(".my-ocular-span");
    let dot = document.querySelector(".my-ocular-dot");
    let isMyProfile = addon.settings.get("show-status") === "others" && username == (await addon.auth.fetchUsername());
    if (isMyProfile || addon.settings.get("profile") === false || disabled === true) {
      span.style.display = "none";
      dot.style.display = "none";
    } else {
      span.style.display = "inline-block";
      dot.style.display = "inline-block";
    }
  }
}
