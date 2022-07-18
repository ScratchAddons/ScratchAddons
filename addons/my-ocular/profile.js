export default async function ({ addon, global, console, msg }) {
  if (!addon.settings.get("profile")) {
    await new Promise((resolve) => {
      addon.settings.addEventListener("change", () => {
        if (addon.settings.get("profile")) resolve();
      });
    });
  }

  var username = document.querySelector("#profile-data > div.box-head > div > h2").innerText;

  var container = document.querySelector(".location");

  var response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
  var data = await response.json();

  if (typeof data.status !== "string") return;

  var statusText = data.status.replace(/\n/g, " "); // clear out newlines
  var color = data.color;
  if (statusText) {
    var statusSpan = document.createElement("span"); // for whatever reason, chrome turns variable named status into text. why the heck. aaaaaaaaaaaaaaaaaa
    statusSpan.title = msg("status-hover");
    statusSpan.innerText = statusText;
    statusSpan.className = "my-ocular-status";
    statusSpan.style.display = "none"; // overridden by userstyle if the addon is enabled

    var dot = document.createElement("span");
    dot.title = msg("status-hover");
    dot.className = "my-ocular-dot";
    dot.style.display = "none"; // overridden by userstyle if the addon is enabled

    dot.style.backgroundColor = color;

    var locationElem = document.createElement("span"); // create a new location element
    locationElem.classList.add("group"); // give it the group class so it fits in
    locationElem.innerText = container.innerText; // set it to the old innertext

    container.innerText = ""; // clear the old location

    container.appendChild(locationElem); // give it the location
    container.appendChild(statusSpan);
    container.appendChild(dot);
  }
}
