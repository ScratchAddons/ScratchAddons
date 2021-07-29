export default async function ({ addon, global, console, msg }) {
    await addon.tab.waitForElement('.stats', {
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly
    })

    addon.settings.get("loves") && (document.querySelector(".project-loves").innerText = '')
    addon.settings.get("favorites") && (document.querySelector(".project-favorites").innerText = '')
    addon.settings.get("remixes") && (document.querySelector(".project-remixes").remove())
    addon.settings.get("views") && (document.querySelector(".project-views").remove())

    // Loves & favorites mutate innerText; we use redux

    addon.tab.redux.addEventListener('statechanged', e => {
        document.querySelector(".project-loves").innerText = ''
        document.querySelector(".project-favorites").innerText = ''
    })
}
