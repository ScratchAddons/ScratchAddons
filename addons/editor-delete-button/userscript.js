export default async ({ addon, msg }) => {
  const { redux } = addon.tab;
  // Wait until user has logged in, and is the author of the project
  await redux.waitForState((state) => state.preview?.projectInfo?.author?.id === state.session?.session?.user?.id);
  while (true) {
    const fileMenu = await addon.tab.waitForElement("div[class^='menu-bar_file-group'] > :nth-child(3) ul", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly && !state.preview.visibilityInfo.deleted,
    });

    const dropdownItem = document.createElement("li");
    dropdownItem.className = addon.tab.scratchClass("menu_menu-item", "menu_hoverable", "menu_menu-section", {
      others: ["sa-editor-delete-button"],
    });
    dropdownItem.innerText = msg("button-text");
    addon.tab.displayNoneWhileDisabled(dropdownItem, { display: "block" });

    dropdownItem.addEventListener("click", async (e) => {
      const confirmed = await addon.tab.confirm(msg("modal-title"), msg("modal-msg"), {
        okButtonLabel: msg("yes"),
        cancelButtonLabel: msg("no"),
        useEditorClasses: true,
      });
      if (!confirmed) return;
      const res = await fetch(`/site-api/projects/all/${redux.state.preview.projectInfo.id}/`, {
        headers: {
          "X-CSRFToken": addon.auth.csrfToken,
        },
        method: "PUT",
        body: JSON.stringify({
          visibility: "trshbyusr",
        }),
      });

      if (res.ok) {
        redux.dispatch({
          type: "SET_VISIBILITY_INFO",
          visibilityInfo: {
            ...redux.state.preview.visibilityInfo,
            deleted: true,
          },
        });
        // TODO: Maybe go to mystuff instead?
        redux.dispatch({
          type: "scratch-gui/mode/SET_PLAYER",
          isPlayerOnly: true,
        });
      }
    });

    fileMenu.appendChild(dropdownItem);
  }
};
