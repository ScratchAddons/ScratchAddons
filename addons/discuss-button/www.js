export default async function ({ addon, console }) {
  if (!addon.settings.get("compact-nav")) return;
  if(addon.tab.clientVersion == "scratchr2") return ;
  const user = addon.auth;
  if (await user.fetchIsLoggedIn()) {
    const username = await user.fetchUsername();
    const accountnav = document.querySelector(".account-nav :not(.link)");
    const dropdown = accountnav.childNodes[1];
    const profileName = document.createElement("li");
    const profileNameChild = document.createElement("a");
    profileNameChild.setAttribute("href","#");
    const profileNameChildChild = document.createElement("span");
    profileNameChildChild.classList.add("profile-name");
    profileNameChildChild.innerText = username;
    profileNameChild.appendChild(profileNameChildChild);
    profileName.appendChild(profileNameChild);
    dropdown.insertBefore(profileName, dropdown.firstChild);
    dropdown.childNodes[1].classList.add("divider");
  }
}
