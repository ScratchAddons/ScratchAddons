export default async function ({ addon, msg, global, console }) {
    var searchBar;
    if (addon.tab.clientVersion == 'scratchr2') {
        searchBar = document.querySelector('#search-input')
    } else searchBar = await addon.tab.waitForElement('#frc-q-1088')

    searchBar.autocomplete = 'off'
}
