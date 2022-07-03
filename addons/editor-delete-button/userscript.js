export default async ( /** @type {import("../../addon-api/content-script/typedef").UserscriptUtilities} */{ addon, console, msg }) => {
    const { redux } = addon.tab;
    while (true) {
        const loadItem = await addon.tab.waitForElement("div[class^='menu-bar_file-group'] > :nth-child(3) ul > :nth-child(4):not(.sa-editor-delete-button)", {
            markAsSeen: true,
            reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly && typeof state.session?.session?.user === "object" && !state.preview.visibilityInfo.deleted,
        });
        
        const dropdownItem = document.createElement("li");
        dropdownItem.className = addon.tab.scratchClass("menu_menu-item", "menu_hoverable", { others: ["sa-editor-delete-button"] });
        dropdownItem.innerText = msg("button-text");
        addon.tab.displayNoneWhileDisabled(dropdownItem, { display: "block" });

        dropdownItem.addEventListener("click", async (e) => {
            if (!await addon.tab.confirm(msg("modal-title"), msg("modal-msg"), { okButtonLabel: msg("yes"), cancelButtonLabel: msg("no"), useEditorClasses: true })) return;
            const res = await fetch(`/site-api/projects/all/${redux.state.preview.projectInfo.id}/`, {
                headers: {
                    "X-CSRFToken": addon.auth.csrfToken,
                },
                method: "PUT",
                body: JSON.stringify({
                    visibility: "trshbyusr"
                })
            })

            if (res.ok) {
                redux.dispatch({
                    type: "SET_VISIBILITY_INFO",
                    visibilityInfo: {
                        ...redux.state.preview.visibilityInfo,
                        deleted: true
                    }
                });
                // TODO: Maybe go to mystuff instead?
                redux.dispatch({
                    type: "scratch-gui/mode/SET_PLAYER",
                    isPlayerOnly: true,
                })
            }
        })
        
        loadItem.insertAdjacentElement("beforebegin", dropdownItem);

    }
}
