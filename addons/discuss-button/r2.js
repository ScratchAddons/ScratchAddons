export default async function ({ addon, console }) {
  if (!addon.settings.get("compact-nav")) return;
  if (addon.tab.clientVersion == "scratch-www") return;
  const user = addon.auth;
  if (await user.fetchIsLoggedIn()) {
    const username = await user.fetchUsername();
    const accountnav = document.querySelector(".logged-in-user");
    const dropdown = accountnav.childNodes[1].firstChild;
    const profileName = document.createElement("li");
    const profileNameChild = document.createElement("a");
    profileNameChild.setAttribute("href", "#");
    profileNameChild.innerText = username;
    dropdown.firstChild.classList.add("divider");
    dropdown.firstChild.classList.add("logout"); // just for color or divider used for signout button
    profileName.appendChild(profileNameChild);
    dropdown.insertBefore(profileName, dropdown.firstChild);
    accountnav.firstChild.removeChild(accountnav.firstChild.childNodes[1]);
  }
}
