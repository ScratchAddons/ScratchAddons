export default async function ({ addon, global, console }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");
  // Get the search term and get the api end point to check the username
  const searchTerm = document
    .querySelector('[name="q"]')
    .value.trim();
  // If the username has the potential to be a valid username then create the link to the user page
  if (!/[^a-z1-9_-]+/i.test(searchTerm) && 1 < searchTerm.length && searchTerm.length <= 20) {
    //Select where the new tab will be appended, and create a new tab
    const tab = nav.appendChild(document.createElement("a")),
      li = tab.appendChild(document.createElement("li")),
      img = li.appendChild(document.createElement("img")),
      span = li.appendChild(document.createElement("span"));

    // Link to the profile
    tab.href = `https://scratch.mit.edu/users/${searchTerm}/`;
    img.src = addon.self.dir + "/user.svg";
    img.className = "tab-icon";

    //Add the text below the image
    span.innerText = "Profile";
  }
}
