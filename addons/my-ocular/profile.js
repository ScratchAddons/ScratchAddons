export default async function ({ addon, global, console, msg }) {
  var username = document.querySelector("#profile-data > div.box-head > div > h2").innerText;

  var container = document.querySelector(".location");

  var response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
  var data = await response.json();

  var statusText = data.status;
  var color = data.color;
  if (statusText) {
    var statusSpan = document.createElement("i"); // for whatever reason, chrome turns variable named status into text. why the heck. aaaaaaaaaaaaaaaaaa
    statusSpan.title = msg("status-hover");
    statusSpan.innerText = statusText;

    var dot = document.createElement("span");
    dot.title = msg("status-hover");
    dot.style.height = "10px";
    dot.style.width = "10px";
    dot.style.marginLeft = "5px";
    dot.style.backgroundColor = "#bbb"; //default incase bad
    dot.style.borderRadius = "50%";

    dot.style.setProperty("display", "inline-block", "important"); // i have to do it like this because .style doesn't let me set prio, and featured project banner messes with this without !important

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
