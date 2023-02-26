export default async function ({ addon }) {
    let span;
    let li;
        if (await addon.auth.fetchIsLoggedIn()) {
            const username = await addon.auth.fetchUsername();
            const dropdown = await addon.tab.waitForElement(".account-nav_profile-name_2oRiV");
            span = dropdown;
            span?.remove();
            li = null;
            const profileSpans = dropdown.childNodes[0].childNodes[0];
            li = profileSpans.appendChild(document.createElement("span"));
            li.className = "sa-profile-name";
            li.textContent = username;
        }
    addon.self.addEventListener("disabled", init);
    addon.self.addEventListener("reenabled", init);
}