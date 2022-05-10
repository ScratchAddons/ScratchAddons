export default async function ({ addon, console }) {
  if(addon.tab.clientVersion == "scratch-www") return ;
  const user = addon.auth;
  if (await user.fetchIsLoggedIn()) {
    const username = await user.fetchUsername();
    const accountnav = document.querySelector(".logged-in-user");
    const dropdown = accountnav.childNodes[1].firstChild;
    const profileName = document.createElement("li");
    const profileNameChild = document.createElement("a");
    profileNameChild.setAttribute("href","#");
    profileNameChild.innerText = username;
    function enable() {
      dropdown.firstChild.classList.add("divider");
      dropdown.firstChild.classList.add("logout"); // just for color or divider used for signout button
      profileName.appendChild(profileNameChild);
      dropdown.insertBefore(profileName, dropdown.firstChild);
      accountnav.firstChild.removeChild(accountnav.firstChild.childNodes[1]);
    }
    function disable() {
      dropdown.childNodes[1].classList.remove("divider");
      dropdown.childNodes[1].classList.remove("logout");
      profileName.removeChild(profileNameChild);
      dropdown.removeChild(profileName);
      accountnav.firstChild.insertBefore(document.createTextNode(username),accountnav.firstChild.childNodes[1]);
    }
    enable();
    addon.self.addEventListener("disabled", () => disable());
    addon.self.addEventListener("reenabled", () => enable());
  }
}
