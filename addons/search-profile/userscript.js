export default async function ({ addon, global, console }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");
  // Get the search term and get the api end point to check the username
  const userPage = `https://api.scratch.mit.edu/accounts/checkusername/${document
    .querySelector('[name="q"]')
    .value.trim()}/`;
  // Fetch the user page to see whether the user exists
  const response = await fetch(userPage);
  // Get the json of the response
  const json = await response.json();
  // If the username exists make the link to the user page
  if (json.message === "username exists") {
    //Select where the new tab will be appended, and create a new tab
    const tab = nav.appendChild(document.createElement("a")),
      li = tab.appendChild(document.createElement("li")),
      img = li.appendChild(document.createElement("img")),
      span = li.appendChild(document.createElement("span"));

    // Link to the profile
    tab.href = `https://scratch.mit.edu/users/${document.querySelector('[name="q"]').value.trim()}/`;
    // Set up the image
    img.src = addon.self.dir + "/user.svg";
    img.className = "tab-icon";

    //Add the text below the image
    span.innerText = "Profile";
  }
}
