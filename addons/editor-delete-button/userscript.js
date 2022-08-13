export default async (
  /** @type {import("../../addon-api/content-script/typedef.js").UserscriptUtilities} **/ { addon, msg, console }
) => {
  // Fetch as text without parsing as JSON, because guess what,
  // the code will stringify anyway!
  const defaultProjectPromise = fetch(`${addon.self.dir}/default.json`).then((res) => res.text());

  const {
    redux,
    traps: { vm },
  } = addon.tab;
  let dropdownItem;

  redux.initialize();
  redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "SET_INFO") {
      // shared => unshared (editor-unshare-button)
      if (
        e.detail.state.prev.preview.projectInfo.is_published &&
        !e.detail.state.next.preview.projectInfo.is_published
      ) {
        dropdownItem?.classList.remove("is-shared");
      } else if (
        !e.detail.state.prev.preview.projectInfo.is_published &&
        e.detail.state.next.preview.projectInfo.is_published
      ) {
        // unshared => shared
        dropdownItem?.classList.add("is-shared");
      }
    }
  });

  while (true) {
    await redux.waitForState(
      (state) =>
        state.preview?.projectInfo?.author?.id === state.session?.session?.user?.id &&
        !state.preview?.projectInfo?.is_published
    );
    const fileMenu = await addon.tab.waitForElement("div[class^='menu-bar_file-group'] > :nth-child(3) ul", {
      markAsSeen: true,
      reduxCondition: (state) =>
        !state.scratchGui.mode.isPlayerOnly &&
        !state.preview.visibilityInfo.deleted &&
        !state.preview.projectInfo.is_published,
    });

    dropdownItem = document.createElement("li");
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
      if (addon.settings.get("resetProject")) {
        const defaultProject = await defaultProjectPromise;
        vm.loadProject(defaultProject);
        const safe = await new Promise((resolve, reject) => {
          const xhrOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function (method, url, ...args) {
            if (method === "put" && String(url).startsWith("https://projects.scratch.mit.edu/")) {
              this.addEventListener("loadend", (ev) => {
                if (ev.target.status === 200) {
                  XMLHttpRequest.prototype.open = xhrOpen;
                  resolve(true);
                } else {
                  // Shouldn't happen
                  reject();
                }
              });
            }
            return xhrOpen.call(this, method, url, ...args);
          };
          redux.dispatch({
            type: "scratch-gui/project-state/START_MANUAL_UPDATING",
          });
        }).catch(() => alert(msg("fetch-err")));
        if (!safe) return;
      }
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
