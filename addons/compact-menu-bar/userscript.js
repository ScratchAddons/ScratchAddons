export default async function ({ addon }) {
    let span;
    let li;
    while (true) {
        if (await addon.auth.fetchIsLoggedIn()) {
            const username = await addon.auth.fetchUsername();
            const dropdown = await addon.tab.waitForElement(".account-nav_profile-name_2oRiV");
            span = dropdown;
            span?.remove();
            const profileSpans = await addon.tab.waitForElement(".menu_menu-item_3EwYA.menu_hoverable_3u9dt");
            li = profileSpans.appendChild(document.createElement("span"));
            li.className = "sa-profile-name";
            li.textContent = username;
        }
    }
}