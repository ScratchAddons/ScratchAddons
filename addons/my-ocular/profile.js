export default async function ({ addon, global, console }) {
  var username = document.querySelector("#profile-data > div.box-head > div > h2").innerText;

  var container = document.querySelector(".location");

  var response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
  var data = await response.json();

  var statusText = data.status;
  var color = data.color;
  if (statusText) {
    var statusSpan = document.createElement("i"); // for whatever reason, chrome turns variable named status into text. why the heck. aaaaaaaaaaaaaaaaaa
    statusSpan.title = `This is ${username}'s ocular status, displayed with Scratch Addons. You can set one at https://my-ocular.jeffalo.net.`;
    statusSpan.innerText = statusText;

    var dot = document.createElement("span");
    dot.title = `This is ${username}'s ocular favourite colour, displayed with Scratch Addons. You can set one at https://my-ocular.jeffalo.net.`;
    dot.style.height = "10px";
    dot.style.width = "10px";
    dot.style.marginLeft = "5px";
    dot.style.backgroundColor = "#bbb"; //default incase bad
    dot.style.borderRadius = "50%";
    dot.style.display = "inline-block";
    dot.style.backgroundColor = color;

    var location = document.createElement("span"); // create a new location element
    location.classList.add("group"); // give it the group class so it fits in
    location.innerText = container.innerText; // set it to the old innertext

    container.innerText = ""; // clear the old location

    container.appendChild(location); // give it the location
    container.appendChild(statusSpan);
    container.appendChild(dot);
  }
}
