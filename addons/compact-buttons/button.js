
export default async function ({ addon, console, msg}) {
    await (await addon.tab.waitForElement(".see-inside-button span")).remove()
    await (await addon.tab.waitForElement(".remix-button span")).remove()
}