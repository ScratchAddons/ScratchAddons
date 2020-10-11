export default async function ({ addon, global, console }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");

  //Select where the new tab will be appended, and create a new tab
  const tab = nav.appendChild(document.createElement("a")),
    li = tab.appendChild(document.createElement("li")),
    img = li.appendChild(document.createElement("img")),
    span = li.appendChild(document.createElement("span"));

  //Link to the profile
  tab.href = "/users/" + document.querySelector('[name="q"]').value.trim() + "/";

  //Set up the image.
  img.src = addon.self.dir + "/user.svg";
  img.className = "tab-icon";

  //Add the text below the image
  span.innerText = "Profile";
}
