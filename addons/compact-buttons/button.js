
export default async function ({ addon, console, msg }) {

    let rem = document.querySelector(".project-buttons")
    await rem.insertBefore((await (await addon.tab.waitForElement(".banner-button"))), rem.firstChild)
    await (await addon.tab.waitForElement(".banner-outer")).remove()

}