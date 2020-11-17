export default async function ({ addon, global, console }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");
  //Create elements for tab
  const tab = nav.appendChild(document.createElement("a")),
    li = tab.appendChild(document.createElement("li")),
    img = li.appendChild(document.createElement("img")),
    span = li.appendChild(document.createElement("span")),
    user = document.querySelector('[name="q"]').value.trim(),
    url = "/users/" + user + "/";

  //Set up elements
  img.src = addon.self.dir + "/user.svg";
  img.className = "tab-icon";
  span.innerText = "Profile";

  //Check if user exsits
  fetch(url)
    .then((response) => {
      if (response.ok) tab.href = url;
      else {
        img.style.filter = "grayscale(100%) brightness(100%) sepia(100%) hue-rotate(-50deg) saturate(600%) contrast(1)";
        span.style.color = "red";
        li.title = user + " does not exist!"
      }
    });
}
