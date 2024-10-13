export default async function ({ addon, msg, console }) {
  const { redux } = addon.tab;
  while (true) {
    const button = await addon.tab.waitForElement("span[class*='share-button_share-button'][class*='is-shared']", {
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      markAsSeen: true,
    });

    button.classList.add("sa-unshare-button");
    button.querySelector("span").innerText = msg("unshare-button");
    button.addEventListener("click", async function thisFunction(e) {
      if (!(await addon.tab.confirm(msg("unshare-button"), msg("unshare-msg"), { useEditorClasses: true }))) return;
      redux.dispatch({
        type: "SET_COMMENT_FETCH_STATUS",
        infoType: "project",
        status: "FETCHING",
      });
      fetch(`/site-api/projects/all/${redux.state.preview.projectInfo.id}/`, {
        headers: {
          "x-csrftoken": addon.auth.csrfToken,
          "x-requested-with": "XMLHttpRequest",
        },
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({
          isPublished: false,
        }),
      }).then((res) => {
        if (res.status !== 200) {
          return redux.dispatch({
            type: "SET_COMMENT_FETCH_STATUS",
            infoType: "project",
            status: "FETCH_ERROR",
          });
          // We do not set error
        }

        redux.dispatch({
          type: "SET_COMMENT_FETCH_STATUS",
          infoType: "project",
          status: "FETCHED",
        });

        button.classList.remove("sa-unshare-button");
        button.removeEventListener("click", thisFunction);

        redux.dispatch({
          type: "UPDATE_PROJECT_INFO",
          info: {
            is_published: false,
          },
        });
      });
    });
  }
}
