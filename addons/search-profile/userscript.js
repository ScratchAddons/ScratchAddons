export default async function ({ addon, global, console, msg }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");
  //Create elements for tab
  const tab = nav.appendChild(document.createElement("a")),
    li = tab.appendChild(document.createElement("li")),
    img = li.appendChild(document.createElement("img")),
    span = li.appendChild(document.createElement("span")),
    user = document.querySelector('[name="q"]').value.trim(),
    valid = user.length <= 20 && user.length >= 3 && !user.includes(" ") && user.match(/([\x30-\x39]|[\x41-\x5a]|[\x61-\x7a]|\x2d|\x5f)+/g)[0] == user;
  //Set up elements
  img.src = addon.self.dir + "/user.svg";
  img.className = "tab-icon";
  span.innerText = msg("profile");
  if (valid) tab.href = "/users/" + user + "/";
  //Check if whats entered is a valid username
  if (!valid) {
    img.style.filter = "grayscale(100%) brightness(100%) sepia(100%) hue-rotate(-50deg) saturate(600%) contrast(1)";
    span.style.color = "red";
    li.title = msg("invalid-username", {username: user});
  }
}
